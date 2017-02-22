const fs = require('fs')
const request = require('request')
const conf = require('./config')
const storage = require('electron-json-storage')
const helpers = require('./helpers')

const statusWidget = document.querySelector("#status")
var statusLines = [{ time: new Date(), text: "Waiting for a new connection..."}]

var Uploader = function() {
    this.filePath = null
    this.timer = null
    this.seekFrom = 0
    this.batchSize = 20 // reduce amount of messages sent to the server at a time
};

Uploader.prototype.init = function(config) {
    this.filePath = config.filePath || null
    this.batchSize = config.batchSize || this.batchSize
    this.seekFrom = 0
};

Uploader.prototype.authorise = function(cb) {
    storage.get('authed', function(error, data) {
        if(error) throw error

        var API_KEY = ""
        var EMAIL = ""

        if(data.hasOwnProperty('apiKey') && typeof data.apiKey === 'string') API_KEY = data.apiKey
        if(data.hasOwnProperty('email') && typeof data.email === 'string') EMAIL = data.email

        try {
            const gatekeeperURL = conf.SERVICE_GATEKEEPER_HOST + ":" + conf.SERVICE_GATEKEEPER_PORT + "/auth"
            console.log(gatekeeperURL)
            request({
                method: 'GET',
                uri: "http://" + gatekeeperURL,
                headers: {
                    'apiKey' : API_KEY,
                    'email' : EMAIL
                }
            }, function(err, res, body) {
                if(res.statusCode === 200) {
                    cb(null, body)
                } else {
                    cb(res.statusCode, null)
                }
            })
        } catch(e) {
            cb(e, null)
        }
    });
};

Uploader.prototype.upload = function() {
    try {
        var linesRead = 0
        var auctionLines = 0
        var seekAt = 1
        var lineBuffer = []

        var lineReader = require('readline').createInterface({
            input: require('fs').createReadStream(this.filePath)
        });

        lineReader.on('line', function(buffer) {
            var line = buffer.toString()
            if(seekAt > this.seekFrom && lineBuffer.length < this.batchSize) {
                line = this.oocLineToAuctionLine(line)
                if(this.isAuctionLine(line)) {
                    auctionLines++
                    lineBuffer.push(line)
                }
                linesRead++
                seekAt++
            } else if(lineBuffer.length >= this.batchSize) {
                lineReader.close()
                //console.log("Sending buffer: ", lineBuffer)
            } else {
                seekAt++
            }
        }.bind(this))

        lineReader.on('close', function() {
            updateStatusWidget(auctionLines)
            console.log("Read: " + linesRead + " lines, there were " + auctionLines + " auctions lines to be sent to the server.")
            linesRead = 0
            auctionLines = 0

            //console.log("Sending payload to server it is: " + (JSON.stringify(lineBuffer).length * 8) + "bytes")
            this.transmit(lineBuffer)

            if(seekAt >= this.seekFrom) {
                console.log("Seek from has been set to: ", seekAt)
                this.seekFrom = seekAt
            }
        }.bind(this))
    } catch(e) {
        throw new Error(e)
    }
};

Uploader.prototype.transmit = function(buffer) {

};

// On red server, auction chat is done via the OOC channel.
// Parse this and transform to a /auction string for the Collection service
// Players on blue may sometimes add auction items in ooc, this quickly allows us to
// build auction lines from that use case
Uploader.prototype.oocLineToAuctionLine = function(line) {
      if(line.toLowerCase().indexOf("says out of character,") > -1 && line.toLowerCase().match(/(wts|wtb|selling|buying|trading)/)) {
          var reg = /^\[([A-Za-z0-9: ]+)+] ([A-Za-z]+) says out of character, '(.+)'$/img
          var matches = reg.exec(line)
          if(matches && matches.length > 0) {
              var timestamp = matches[1]
              var seller = matches[2]
              var items = matches[3]

              return "[" + timestamp + "] " + seller + " auctions, '" + items + "'"
          }
      }

      return line
};

Uploader.prototype.startStreamingAuctionData = function() {
    this.authorise(function(err, data) {
        if(err) {
            throw new Error(err)
        } else {
            this.timer = setInterval(function() {
                this.upload()
            }.bind(this), 6000);
            this.upload()
        }
    }.bind(this))
};

Uploader.prototype.stopStreamingAuctionData = function() {
    if(this.timer) {
        clearInterval(this.timer)
        this.timer = null
        console.log("Stream stopped")
    } else {
        console.log("Stream was not running")
    }
}

Uploader.prototype.isAuctionLine = function(line) {
    return line.match(/^\[[A-Za-z0-9: ]+] [A-Za-z]+ auctions?, '.+'$/img)
}

function updateStatusWidget(auctionLines) {
    if(statusWidget) {
        var message = { time: new Date(), text: "" }
        if(auctionLines === 0) {
            message.text = "No more auction lines to send to the server at this time.  We will keep scanning for new lines, don't worry!"
        } else {
            var lineType = "line"
            if(auctionLines > 1) lineType = "lines"
            message.text = " Sent " + auctionLines + " auction " + lineType + " to the server for parsing."
        }

        // Check how many messages are in the buffer
        if(statusLines.length < 4) {
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

module.exports = Uploader;