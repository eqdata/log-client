//const remote = require('remote');
//const dialog = remote.require('electron').dialog;
const fs = require('fs')
const uploader = require('./uploader')
const storage = require('electron-json-storage')

const filePathSelect = document.querySelector("#file-select")
const filePathInput = document.querySelector("#file-input")
const characterNameSelect = document.querySelector("#character-select")
const serverSelect = document.querySelector("#server-select")
const uploadButton = document.querySelector("#upload")
const logoutButton = document.querySelector("#logout")
const path = require('path')
const url = require('url')
const { remote } = require('electron')

const userEmail = document.querySelector("#user-email")

const CHARACTER_REG = /eqlog_([A-Za-z]+)_(project1999|P1999PVP)\.txt/i;

var UPLOAD_DIR = ""
var SELECTED_FILE = ""

var apiKey = ""
var email = ""

const u = new uploader()

if(logoutButton) {
    logoutButton.onclick = function() {
        storage.remove('authed', function(error) {
            if(error) throw error
            remote.getCurrentWindow().loadURL(url.format({
                pathname: path.join(__dirname, 'auth.html'),
                protocol: 'file:',
                slashes: true
            }))
        })
    }
}

// Load some nice GUI so the user can tell if they are logged in
if(userEmail) {
    storage.get('authed', function(err, data) {
        if(err) {
            remote.getCurrentWindow().loadURL(url.format({
                pathname: path.join(__dirname, 'auth.html'),
                protocol: 'file:',
                slashes: true
            }))
        } else {
            apiKey = data.apiKey
            email = data.email

            userEmail.innerHTML = data.email
        }
    })
}

// Starts the toggle streaming process
if(uploadButton) {
    uploadButton.onclick = function(e) {
        if(UPLOAD_DIR.trim() !== "" && SELECTED_FILE.trim() !== "") {
            u.init({
                batchSize: 40,
                filePath: UPLOAD_DIR + SELECTED_FILE
            })
            if(!u.timer) {
                u.startStreamingAuctionData()
                if(characterNameSelect) characterNameSelect.disabled = true
                uploadButton.innerHTML = "Stop Streaming Logs <i class='fa fa-spin fa-spinner'/>"
                uploadButton.className = "streaming"
            } else {
                u.stopStreamingAuctionData()
                if(characterNameSelect) characterNameSelect.disabled = false
                uploadButton.innerHTML = "Begin Streaming Logs"
                uploadButton.className = ""
            }
        } else {
            alert("Please select a file and source directory for your EQ Logs")
        }
    }
}

// Allows us to select the character and sets the hidden field to 0 so we know
// if we're uploading a red or blue server file
if(characterNameSelect) {
    characterNameSelect.onchange = function(e) {
        console.log(e)
        var file = e.target.children[e.target.selectedIndex].data
        if(file) {
            SELECTED_FILE = file
            if(serverSelect) {
                var res = CHARACTER_REG.exec(file)
                if(res[2] && res[2].toLowerCase().indexOf("pvp") > -1) {
                    serverSelect.selectedIndex = 1
                } else {
                    serverSelect.selectedIndex = 0
                }
            }
        }
    }
}

// Whenever we change the file path we want to load all characters available in this directory
// this method also distinguishes if we will upload data for the red or blue server, we
// could extend this in future to allow other file types to be uploaded but right now
// the default naming convention should be followed
if(filePathSelect) {
    filePathSelect.onchange = function(e) {
        if(filePathInput) {
            var path = filePathSelect.files[0].path
            var parts = path.split("/", -1)
            // The last part of the path is a file not a folder, lets set defaults and strip it
            if(parts[parts.length-1].indexOf(".") > -1) {
                // this could be a character name, lets set it as default
                var res = CHARACTER_REG.exec(parts[parts.length-1])
                if(res && res.length > 0) {
                    SELECTED_FILE = res[0] // this is the full match, not the repeating group that contains char name
                }

                // Strip this from the file dir output to the UI
                parts[parts.length-1] = ""
            }
            path = "/";
            parts.forEach(function(part) {
                if(part.length > 0) {
                    path += part + "/"
                }
            });
            filePathInput.value = path

            UPLOAD_DIR = path

            // Now list out all log files in this directory
            try {
                fs.readdir(path, function(err, files) {
                    if(err) {
                        throw new Error(err)
                    } else {
                        // If we already have a char name set then we may want to change the selected index,
                        // instead of defaulting to 0
                        var selectedIndex = 0
                        var i = 0

                        characterNameSelect.innerHTML = "";
                        files.forEach(function(file) {
                            console.log("i is currently: ", i)
                            if(characterNameSelect && Object.prototype.toString.call(file) == '[object String]') {
                                var res = CHARACTER_REG.exec(file)
                                console.log("Result is: ", res)
                                if(res && res.length >= 1 && res[1]) {
                                    var isPVP = false
                                    var charName = res[1]
                                    if(res[2] && res[2].toLowerCase().indexOf("pvp") > -1) {
                                        charName += " - Red"
                                        isPVP = true
                                    } else {
                                        charName += " - Blue"
                                    }
                                    const docFrag = document.createDocumentFragment()
                                    const option = document.createElement("option")
                                    option.textContent = charName // set the char name as the label
                                    option.data = res[0] // save the file as the data-name attr
                                    docFrag.appendChild(option)

                                    characterNameSelect.appendChild(docFrag)

                                    if(SELECTED_FILE.toLowerCase().trim() === res[0].toLowerCase().trim()) {
                                        selectedIndex = i
                                        if(serverSelect) {
                                            if(isPVP) {
                                                serverSelect.selectedIndex = 1
                                            } else {
                                                serverSelect.selectedIndex = 0
                                            }
                                        }
                                    }

                                    // only iterate i on a valid file, otherwise our index is skewed and can go out of bounds!
                                    i++
                                }
                            }
                        })

                        characterNameSelect.selectedIndex = selectedIndex
                    }
                })
            } catch(e) {
                console.log("Error: ", e)
            }
        }
        console.log(e)
    }
}