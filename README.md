###Arduino TFT Image Loader

Currently only support for STM32Duino. More support to come. This is just loaded 
for help with a USB serial bug at the time. I will clean up as I go. 

####Requirements
#####Arduino
[OSHLAB_ILI9341](https://github.com/oshlab/OSHLAB_ILI9341) or compatable.

[Adafruit GFX](https://github.com/adafruit/Adafruit-GFX-Library)

##### App
[NodeJS](https://nodejs.org/en/) version >= 4

####Install
Clone or download the project. Navigate to the project folder and run the following command.
`npm install`.

You may have to recompile the binaries if not on Linux otherwise the install script should do it. 

#####Windows
Run the above command, but it is recommended you use powershell over cmd. 
After running the above command, you need to navigate to the 
Arduino_TFT_Image_Loader/node_modules/serialport 
folder and run the following commands.

`npm install -g nw-gyp`

then 

`nw-gyp rebuild --target=0.14.7`

#### Running
To run the app. Navigate to the project folder and run

`npm start`

