
// set rotation of tft
uint16_t rotation = 3; //0 - 3

#define TFT_CS         PA15
#define TFT_DC         PB3
#define TFT_LED        PB0
#define TFT_RST        PB4

// not needed for hardware spi
#define TFT_MOSI  PA7
#define TFT_MISO  PA6
#define TFT_SCK   PA5

#include <SPI.h>
#include <Adafruit_GFX.h>    // Core graphics library, with extra fonts.
//#include "Adafruit_ILI9341_STM.h"
#include <Adafruit_ILI9341_STM32.h>

Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST); // Use hardware SPI
//Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_MOSI, TFT_SCK, TFT_RST, TFT_MISO); // Use hardware SPI

// global vars
bool con = false;
bool firstLoop = true;
uint32_t lastUpdate = millis();

// command list
#define FULLSCREEN_IMG 254

void setup() {
  Serial.begin(115200);
  // wait for serial
  while (!Serial) {};

  // turn on led
  pinMode(TFT_LED, OUTPUT);
  digitalWrite(TFT_LED, HIGH);

  // setup led
  tft.begin();
  tft.setRotation(rotation);
  tft.fillScreen(colorToTFT("000000"));
  //  drawButtons();
}

void loop() {
  checkCon(); // check for connection
  sendUpdate(); // send tft info
  if (con) { // connected
    readSerialTFT();
  } // if(con)
} // void loop

void checkCon() {
  if (!con && usb()) {
    // new connection
    con = true;
    waitingForImage();
  } else if ((con && !usb()) || firstLoop) {
    // lost connection or first run
    con = false;
    firstLoop = false;
    noCon();
  }
} // void checkCon();

// only send update every 1 second
// tells program tft size
void sendUpdate() {
  if (millis() - lastUpdate >= 1000 && usb()) {
    // Send tft info every second
    Serial.print("W");
    Serial.print(tft.width());
    Serial.println(";");
    Serial.print("H");
    Serial.print(tft.height());
    Serial.println(";");
    lastUpdate = millis(); // reset last time fired
  }
}

void waitingForImage() {
  tft.fillScreen(colorToTFT("ffffff"));
  tft.setTextColor(colorToTFT("000000"));
  tft.setCursor(tft.width()/2-80, tft.height()/2);
  tft.print("Waiting for Image from USB");
}
void noCon() {
  tft.fillScreen(colorToTFT("ffffff"));
  tft.setTextColor(colorToTFT("000000"));
  tft.setCursor(tft.width()/2-80, tft.height()/2);
  tft.print("Looking for host software");
}

// reads image data from USB and prints images
void readSerialTFT() {
  uint8_t cmd;
  while (Serial.available() > 0 && usb()) {
    cmd = Serial.read();

    if (cmd == FULLSCREEN_IMG) {
      uint8_t b1;
      uint8_t b2;

      for (uint16_t y = 0; y < tft.height(); y++) {
        for (uint16_t x = 0; x < tft.width(); x++) {
          b1 = Serial.read(); // MSB
          b2 = Serial.read(); // LSB
          // combine bytes to a 16 bit
          uint16_t pixColor = b1 << 8 | b2;
          tft.drawPixel(x, y, pixColor);

          // this delay needed for stm32 for some reason
          delayMicroseconds(150);
        } // for x
      } // for y
    } //FULLSCREEN_IMG
  } // while serial
} // readSerialTFT()

bool usb() {
  if (Serial.getDTR() && Serial.getRTS()) {
    return true;
  } else {
    return false;
  }
}

/***********************************************
 * Converts web wolors to 565 for use with tft.
 * 
 * put hex humber as string without the # symbol
 * uint16_t 565color = colotToTFT("ffffff");
 ***********************************************/
uint16_t colorToTFT(const char *rgb32_str_)
{
  long rgb32 = strtoul(rgb32_str_, 0, 16);
  return (rgb32 >> 8 & 0xf800) | (rgb32 >> 5 & 0x07e0) | (rgb32 >> 3 & 0x001f);
}

