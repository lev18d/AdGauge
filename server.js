'use strict';

const express = require('express'); //express framework
const Clarifai = require('clarifai');
const WebCam = require('node-webcam');
const fs = require('fs');
const querystring = require('querystring');
const request = require('request');
const DatabaseManager = require('./database/database_manager');
let dbm = new DatabaseManager();
const bodyparser = require('body-parser');

const PORT = process.env.PORT || 3000;
const demographic = 'f783f0807c52474c8c6ad20c8cf45fc0';
const subscriptionKey = '4c824752ecbd402a9c24458473473dd1';


const app = express();

const cam = WebCam.create({
    width: 1280,
    height: 720,
    quality: 100,
    delay: 0,
    saveShots: true,
    output: "jpeg",
    device: '2',
    callbackReturn: "location",
    verbose: false
});

const clarifai = new Clarifai.App({
    apiKey: 'b53b6c1a796d4351ad943e5308c363f5'
});

app.use(express.static(__dirname + '/public')); //static server

app.get('/', (req, res) => {
    res.sendfile('./sample.html');
});

app.get('/redeem', (req, res) => {
    res.sendfile('./redeem.html');
});

app.use(bodyparser.urlencoded({extended: true}));

app.post('/redeem-discount', (request, response) => {
    dbm.applyDiscount(request.body.discountCode, request.body.amount, [request.body.product]);
    response.send('OK');
});

app.post('/startCollecting', (request, response) => {
    collectCustomerDemographics().then(result => {
        return dbm.recordCustomer(organize(result[0], result[1]), true);
    }).then(discount => {
        response.send(discount);
    });
});

app.listen(PORT, err => {
    if (err) console.log(err);
    else console.log(`Server listening on port: ${PORT}`);
});

function collectCustomerDemographics() {
    return new Promise((resolve, reject) => {
        let results = [];
        cam.capture("./images/image" + Date.now() + ".jpg", (err, data) => {
            console.log(err);
            analyzeWithAzure(data).then(result => {
                results.push(result);
                return analyzeWithClarifai(data);
            }).then(result => {
                results.push(result);
                return resolve(results);
            });
        });
    })
}

function analyzeWithClarifai(image) {
    return new Promise((resolve, reject) => {
        fs.readFile(image, (err, data) => {
            let encodedImage = new Buffer(data, 'binary').toString('base64');
            clarifai.models.predict(Clarifai.DEMOGRAPHICS_MODEL, {base64: encodedImage}).then(result => {
                return resolve(result);
            }).catch(console.log);
        });
    });
}

function analyzeWithAzure(image) {
    return new Promise((resolve, reject) => {
        fs.readFile(image, (err, data) => {
            if (err) throw err;
            let encodedImage = new Buffer(data, 'binary');
            let options = {
                url: 'https://westus.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false&returnFaceAttributes=age,gender,emotion',
                method: 'POST',
                processData: false,
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Ocp-Apim-Subscription-Key': subscriptionKey
                },
                body: data
            };
            request(options, function (err, response) {
                let obj = JSON.parse(response.body);
                return resolve(obj[0]);
            });
        });
    });
}

function organize(azobj, clarObj) {

//averaging age between Azure and Clarifai
    var azAge = parseInt(azobj.faceAttributes.age);
    var clarAge = clarObj.outputs[0].data.regions[0].data.face.age_appearance.concepts[0].name;


    var age = parseInt((parseInt(azAge) + parseInt(clarAge)) / 2);


    //getting gender from Azure
    var gender = azobj.faceAttributes.gender;


    //getting emotion from Azure
    var anger = azobj.faceAttributes.emotion.anger;
    var contempt = azobj.faceAttributes.emotion.contempt;
    var disgust = azobj.faceAttributes.emotion.disgust;
    var fear = azobj.faceAttributes.emotion.fear;
    var happiness = azobj.faceAttributes.emotion.happiness;
    var neutral = azobj.faceAttributes.emotion.neutral;
    var sadness = azobj.faceAttributes.emotion.sadness;
    var surprise = azobj.faceAttributes.emotion.surprise;


    var emotion = 'undefined';
    switch (Math.max(anger, contempt, disgust, fear, happiness, neutral, sadness, surprise)) {

        case anger:
            emotion = 'angry';
            break;
        case contempt:
            emotion = 'contemptuous';
            break;
        case disgust:
            emotion = 'disgusted';
            break;
        case fear:
            emotion = 'fearful';
            break;
        case happiness:
            emotion = 'happy';
            break;
        case neutral:
            emotion = 'neutral';
            break;
        case sadness:
            emotion = 'sad';
            break;
        case surprise:
            emotion = 'surprised';
            break;
        default:
            emotion = 'unknown';

    }

    //getting ethnicity from Clarifai
    var ethnicity = 'undefined';
    var confEthnicity = 0;

    for (let i = 0; i < 7; i++) {
        //finding Clarifai ethnicity with highest confidence.

        if (clarObj.outputs[0].data.regions[0].data.face.multicultural_appearance.concepts[i].value > confEthnicity) {
            confEthnicity = clarObj.outputs[0].data.regions[0].data.face.multicultural_appearance.concepts[i].value;
            ethnicity = clarObj.outputs[0].data.regions[0].data.face.multicultural_appearance.concepts[i].name;

        }
    }

    var results = {};

    results['gender'] = gender;
    results['age'] = age;
    results['emotion'] = emotion;
    results['ethnicity'] = ethnicity;
    return results;
}