const storage = require('electron-json-storage');
const request = require('request');
const conf = require('./config')
const path = require('path')
const url = require('url')
const { remote } = require('electron')

const apiKeyField = document.querySelector("#api-key")
const emailField = document.querySelector("#email")

const loginButton = document.querySelector("#login-button")

var apiKey = ""
var email = ""

if(apiKeyField) {
    apiKeyField.addEventListener('input', function(e) {
        apiKey = e.srcElement.value.toString().trim()
    })
}

if(emailField) {
    emailField.addEventListener('input', function(e) {
        email = e.srcElement.value.toString().trim()
    })
}

if(loginButton) {
    loginButton.onclick = function() {
        if(apiKey.length > 5 && (email.length > 5 && email.indexOf("@") > -1) && email.indexOf(".") > -1) {
            attemptLogin()
        } else {
            console.log("Please enter credentials")
            alert("Invalid credentials, please try again")
        }
    }
}

storage.get('authed', function(error, data) {
    if(error) throw error;

    if(JSON.stringify(data) === "{}") {
        console.log("Empty")
    } else {
        if(data.hasOwnProperty('apiKey') && typeof data.apiKey === 'string') apiKey = data.apiKey
        if(data.hasOwnProperty('email') && typeof data.email === 'string') email = data.email

        attemptLogin()
    }
});

function attemptLogin() {
    authWithGatekeeper(apiKey, email, function(err, data) {
        if(err) {
            throw err
        } else {
            if(err) {
                console.log("Error when authorising")
                alert("Invalid credentials")
            } else {
                storage.set('authed', { apiKey: apiKey, email: email }, function(error) {
                    if(error) throw error
                })

                remote.getCurrentWindow().loadURL(url.format({
                    pathname: path.join(__dirname, 'index.html'),
                    protocol: 'file:',
                    slashes: true
                }))
            }
        }
    })
}

function authWithGatekeeper(API_KEY, EMAIL, cb) {
    if(!isString(API_KEY) || !isString(EMAIL) || !isString(conf.SERVICE_GATEKEEPER_HOST) || !isString(conf.SERVICE_GATEKEEPER_PORT)) {
        throw new Error("API Key, Email, Gatekeeper Host or Port variables are tampered with, send a string")
    }

    try {
        const gatekeeperURL = conf.SERVICE_GATEKEEPER_HOST + ":" + conf.SERVICE_GATEKEEPER_PORT + "/auth";
        request({
            method: 'GET',
            uri: "http://" + gatekeeperURL,
            headers: {
                'apiKey' : API_KEY,
                'email' : EMAIL
            }
        }, function(err, res, body) {
            console.log(res)
            if(res.statusCode === 200) {
                cb(null, body)
            } else {
                cb(res.statusCode, null)
            }
        })
    } catch(e) {
        cb(e, null)
    }
}

function isString(str) {
    return Object.prototype.toString.call(str) === '[object String]'
}