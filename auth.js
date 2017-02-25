const storage = require('electron-json-storage');
const request = require('request');
const conf = require('./config')
const path = require('path')
const url = require('url')
const { remote } = require('electron')
const helpers = require('./helpers')

const statusWidget = document.querySelector("#status")
var statusLines = [{ time: new Date(), text: "Waiting for a new connection..."}]

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
            updateStatusWidget(0, body)
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

function updateStatusWidget(auctionLines, customMessage) {
    if(statusWidget) {
        var message = { time: new Date(), text: "" }
        if(auctionLines === 0) {
            message.text = "No more auction lines to send to the server at this time.  We will keep scanning for new lines, don't worry!"
        } else {
            var lineType = "line"
            if(auctionLines > 1) lineType = "lines"
            message.text = " Sent " + auctionLines + " auction " + lineType + " to the server for parsing."
        }

        if(customMessage) {
            message.text = customMessage
        }

        // Check how many messages are in the buffer
        if(statusLines.length < 2) {
            statusLines.push(message)
        } else {
            statusLines.shift()
            statusLines.push(message)
        }

        statusWidget.innerHTML = ""
        statusLines.forEach(function(line, i) {
            let item = document.createElement("span")
            item.style = "opacity: 0." + (6 + i)
            item.className = "status-text"
            item.innerHTML = "<span style='color: #2788c1'>" + helpers.prettyDate(line.time) + "</span> " + line.text
            statusWidget.appendChild(item)
        })
    }
}
