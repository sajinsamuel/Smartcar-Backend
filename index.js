'use strict';

const express = require('express');
const exphbs = require('express-handlebars');
const smartcar = require('smartcar');
const mongoose = require('mongoose');
const User = require('./models/userDataSchema');
var mqtt = require('mqtt');
const app = express();
var cors = require('cors');




const dbURI = 'mongodb+srv://parsemongo:1655dupontstreet@parseclusterstrike.k46cv.mongodb.net/smartcar?retryWrites=true&w=majority';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => console.log("connected to db"))
  .catch((errr) => console.log("DB connection error"));
app.use(cors());
app.engine(
  '.hbs',
  exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
  }),
);
app.set('view engine', '.hbs');

const port = 8000;

const client = new smartcar.AuthClient({
  clientId: "2d130ea0-0dcc-4364-b728-44b155b64581",
  clientSecret: "7d950b59-4f26-419c-985a-1f7e3df59a57",
  redirectUri: "http://localhost:8000/exchange",
  scope: ['required:read_vehicle_info'],
  testMode: true,
});

let access;
let username;
let ud;
// let mqttMessageString;

app.get('/login', function (req, res) {
  const authUrl = client.getAuthUrl();

  username = req.query.userName;
  // console.log("username  : " + username);
  res.redirect(authUrl);
});

app.get('/exchange', function (req, res) {
  const code = req.query.code;



  return client.exchangeCode(code)
    .then(function (_access) {
      // in a production app you'll want to store this in some kind of persistent storage
      access = _access;
      // console.log("Authorization code : " + code);
      // console.log("Access token : " + access.accessToken);
      res.redirect('/vehicle');

    })
});

app.get('/vehicle', function (req, res) {
  return smartcar.getVehicleIds(access.accessToken)
    .then(function (data) {

      return data.vehicles;
    })
    .then(function (vehicleIds) {

      const vehicle = new smartcar.Vehicle(vehicleIds[0], access.accessToken);


      return vehicle.info();
    })
    .then(function (info) {

      const data = {
        "AWSUserName": username,
        "AccessToken": access.accessToken,
        "AccessTokenExpiry": access.refreshExpiration,
        "vehicleID": info.id,
        "vehicleMake": info.make,
        "vehicleModel": info.model,
        "vehicleYear": info.year
      }

      console.log(data);
      const user = new User({
        AWSUserName: username,
        SmartcarAccessToken: access.accessToken,
        SmartcarAccessTokenExpiry: access.refreshExpiration,
        vehicleID: info.id,
        vehicleMake: info.make,
        vehicleModel: info.model,
        vehicleYear: info.year
      });

      user.save().then((result => { console.log(result) })).catch((err => { console.log(err) }))

      res.redirect('exp://127.0.0.1:19000');
    });
});

app.post('/getUserData', (req, res) => {

  const awsuname = req.query.un;

  User.find({ AWSUserName: awsuname }).limit(3).exec(function (err, user) {
    if (err) {
      console.log(err)
      res.end("error");
    } else {
      ud = user[0];
      console.log(ud)
      res.end(JSON.stringify(ud));
    }
  })
}
);

app.post('/mqttmessage', (req, res) => {

  const options = {
    username: "emonpi",
    password: "emonpimqtt2016",
    clean: true
  };

  var clientmqtt = mqtt.connect("mqtt://192.168.2.115", options)

  clientmqtt.on("connect", function () {
    console.log("MQTT connected : " + clientmqtt.connected);
  })


  var mqttTopic = req.query.topic;
  console.log("MQTT topic is : " + mqttTopic);

  clientmqtt.on('message', function (topic, message) {
    console.log(message.toString())
    const mqttMessageString = message.toString();
    clientmqtt.end()

    var mqttMsgJson = {
      "vehicleID":"ABCDEFGHIJK",
      "vrms": mqttMessageString

  }

    res.end(JSON.stringify(mqttMsgJson))


  })

  clientmqtt.subscribe(mqttTopic);

})



app.listen(port, () => console.log(`Listening on port ${port}`));
