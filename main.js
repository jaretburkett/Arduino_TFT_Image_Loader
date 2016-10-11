var SerialPort = require("serialport");
var fs = require('fs');
var Jimp = require("jimp");

// global vars
var serial = false;
var attached = false;
var device;
var tftHeight = 200;
var tftWidth = 200;

// stm32 serial
var vid = '1eaf';
var pid = '0004';

var gui = require('nw.gui'); //or global.window.nwDispatcher.requireNwGui() (see https://github.com/rogerwang/node-webkit/issues/707)

// Get the current window
var win = gui.Window.get();

// // closing cleanup
// win.on('close', function() {
//     try{
//         device.close(function(){
//             this.close(true);
//         });
//     }
//     catch(e){
//         this.close(true);
//     }
// });

// checks if is device
function isDevice(port) {
    try{
        // Linux
        if (port.vendorId == '0x'+vid && port.productId == '0x'+pid) {
            return true;
        }
        // teensy
        if (port.vendorId == '0x16c0' && port.productId == '0x0483') {
            return true;
        }
        // windows workaround
        if (typeof port.pnpId !== "undefined") {
            // windows 10 fix
            if (port.pnpId.indexOf(vid.toUpperCase()) != -1 && port.pnpId.indexOf(pid.toUpperCase()) != -1) {
                return true;
            }
        }
        // other
        if (port.vendorId.indexOf(vid) != -1 && port.productId.indexOf(pid) != -1) {
            return true;
        }
        // not our device
        else {
            return false;
        }
    }
    catch(e){
        return false;
    }
} // function isDevice(port)


// serial scanner
var serialscanner = setInterval(function () {
    try {
        if (!attached) {
            var found = false;
            SerialPort.list(function (err, ports) {
                ports.forEach(function (port) {
                    // console.log(port);
                    if (isDevice(port)) {
                        found = true;
                        serial = true;
                        console.log("Device Found:");
                        console.log(JSON.stringify(port));
                        attached = true;
                        device = new SerialPort(port.comName, {
                            baudrate: 115200,
                            parser: SerialPort.parsers.readline('\n'),
                            dataBits: 8,
                            parity: 'none',
                            stopBits: 1,
                            flowControl: false
                        });

                        device.on('error', function (err) {
                            console.log('Error: ', err);
                            console.log('Device Error');
                            serial = false;
                            attached = false;
                            device.close(function(){

                            });
                            $('#status').removeClass('connected').addClass('disconnected');
                        });
                        device.on('data', function (data) {
                            parseSerial(data);
                        });
                        device.on('disconnect', function () {
                            attached = false;
                            console.log("Device Disconnected");
                            console.log("Looking for Device");
                            $('#status').removeClass('connected').addClass('disconnected');
                            serial = false;
                            attached = false;
                        });
                        // device.readTimeout(1000);
                        $('#status').removeClass('disconnected').addClass('connected');

                    } // if found device
                });
            }); // find ports

        } // if not attached
    } // try
    catch (e) {
        console.log('cant connect');
        console.log(e);
        serial = false;
        attached = false;
    }
}, 1000); // - Serial Scanner

// parse serial command
function parseSerial(data) {
    // make a str of just the data (numbers only)
    var str = data.replace(/\D/g, '');
    if (data.indexOf('H') > -1) {
        tftHeight = parseInt(str);
        if($('#imagecontainer').height() != tftHeight){
            $('#imagecontainer').height(tftHeight);
        }
    }
    else if (data.indexOf('W') > -1){
        tftWidth = parseInt(str);
        if($('#imagecontainer').width() != tftHeight){
            $('#imagecontainer').width(tftWidth);
        }
    }
} // parse serial

function sendTFT(callback) {
    var arr = new Buffer(tftWidth * tftHeight * 2 + 1); // add 1 for command
    var count = 0;
    arr[0] = 254; // command byte
    count++;
    Jimp.read('./img/tmp.png').then(function (image) {
        // cover image to fit tft
        image.cover(tftWidth, tftHeight)
            // Convert the image into a 565 byte stream
            .scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                var red = this.bitmap.data[idx + 0];
                var green = this.bitmap.data[idx + 1];
                var blue = this.bitmap.data[idx + 2];
                var rgb565 = (((31 * (red + 4)) / 255) << 11) |
                    (((63 * (green + 2)) / 255) << 5) |
                    ((31 * (blue + 4)) / 255);
                var high = ((rgb565 >> 8) & 0xff); // high byte
                var low = rgb565 & 0xff; // low byte

                arr[count] = high;
                count++;
                arr[count] = low;
                count++;
            });
        try{
            writeAndDrain(arr, function () {
                // done writing
                callback(true);
            });

        } catch(e){
            console.log(e);
        }

    }); // jimp resize
}

// write image and send all data from buffer
function writeAndDrain (data, callback) {
    device.write(data, function () {
        device.drain(callback);
    });
}