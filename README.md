# Puck.js HUE Controller

## About
### What Does it Do?

Allows you to control Hue lights with a Puck.js proxied through a running node script.

### How Does It Work?

The Puck.js advertises a set of values that the node script listens for. The changing values indicate that the script should either:

  - Change which lights the Puck is bound to
  - Toggle the bound lights on/off
  - Change the brightness of the bound lights

The script then communicates over the network with the Hue Bridge, sending the appropriate request.

### Is It Practical?

Absolutely not, but it's kinda nifty.

### Are There Pretty Colors?

Of course.

## Requirements

Puck.js

Hue Bridge

Hue Lights and Light Groups

Bluetooth enabled computer / RaspberryPi running on the same network as your Hue Bridge

node.js (tested with v8.15.0)

npm

### OSX
[XCode](Xcode)

### RaspberryPi
Kernel version 3.6 or above

Packages: `bluetooth`, `bluez`, `libbluetooth-dev`, `libudev-dev`

## Setup

**_If you are running this on a RaspberryPi, see the [Extra Steps](#extra-raspberry-pi-setup-steps) below BEFORE proceeding._**

1. `git clone https://github.com/RobertMcReed/puck-js-hue.git`
2. `cd puck-js-hue && npm install`
3. Press the "Link" button on your Hue bridge
4. `npm run setup`
   - If on a Raspberry pi, you will need to grant sudo privileges to node in order to run the setup script
   - Alternately, you can run each step in the setup process manually

This will perform the following steps:

    1.  Register your device with the Hue Bridge, adding HUE_USERNAME to your .env
    2.  Discover the first nearby Puck and write it to PUCKS in the .env
    3.  Discover all of the lights connected to your Hue Bridge, writing the results to hue.json
    4.  Write a default config to config.json including all of the light groups connected to your bridge
    5.  Prepare the espruino file espruino/puck-advertise-hue.js
    6.  Flash the code to your Puck
        - This step is prone to failure
        - If flashing does not work, copy the contents of puck-advertise-hue.js into the Web IDE and send it to your puck manually
    7.  Start running `main.js` which will begin listening for Puck clicks

### Extra Raspberry Pi Setup Steps
1. Ensure you have node installed on your path
    - Run `which node`
    - If there is no output, install node as follows:
  
    ```
    wget https://nodejs.org/dist/v8.15.0/node-v8.15.0-linux-armv6l.tar.xz
    tar xvf node-v8.15.0-linux-armv6l.tar.xz
    cd node-v8.15.0-linux-armv6l
    sudo cp -R bin/* /usr/bin/
    sudo cp -R lib/* /usr/lib/
    sudo apt-get update && sudo apt-get upgrade
    sudo apt-get install build-essential
    ```
    
2. Install required bluetooth packages:

    ```
    sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
    ```

3. On linux you must run all of the BLE scripts using `sudo`. If you would like to bypass this requirement you can grant node access to start and stop listening for BLE devices as follows:

    ```
    sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
    ```

    - If you don't have `setcap` installed, first install it with the following:

        ```
        sudo apt-get install libcap2-bin
        ```

4. Go back and follow the rest of the normal [setup instructions](#setup)

### Manual Setup

If the setup script doesn't work for you, try running the scripts individually.

1. Register your computer with your Hue Bridge
   1. Press the Link button on the top of your Bridge
   2. run `npm run register` or `node utility/registerDevice.js <optional app name>`
      - This will register your device with the bridge, allowing you to programmatically access your lights
      - It will also create a `.env` and add the auto-generated `HUE_USERNAME` to it
2. Discover your Puck with node: `npm run discoverPuck` or `node utility/discoverPucks.js`
   - On linux/RaspberryPi you must run with: `sudo node utility/discoverPucks.js` unless you have granted node BLE privileges 
   - This will find any Puck.js within range that is powered on and advertising
   - It will write the mac address of each as a comma separated list `PUCKS` to the `.env`
   - You can safely run this script again, it will add newly discovered pucks to the list
   - If your Puck is not discovered, ensure it is disconnected from all devices and that bluetooth on your computer is enabled
   - You will need to force exit the script once your Pucks have been found
   - Alternately, run `npm run discoverOnePuck` or `node utility/discoverPucks --first` to exit after the first new Puck is discovered
3. Prepare the puck.js code: `npm run prep` or `node utility/prepPuck.js`
   - This will:
      1. Check to see if you have a `config.json` and if it has a `lights` array
           - If there is no lights array (or config), it will fetch all of the light groups connected to your bridge and add them to the config
      2. It will merge the config with the default config
           - If you pass the `--save` flag it will write the merged values to `config.json`
      3. It will write these values to the templated Espruino code and save it as `espruino/puck-advertise-hue.js`
4. Flash the code to your Puck.js by running `npm run flash` or `node utility/flashPuck.js`
   - On linux/RaspberryPi you must run as: `sudo node utility/flashPuck.js` unless you have granted node BLE privileges
   - This will flash `espruino/puck-advertise-hue.js` to the Puck
   - The code will be sent to the first puck listed in PUCKS in the .env
   - Occasionally flashing will fail -- if this happens, simply run the script again
   - If it continues to fail, ensure the puck is nearby and not connected to any other devices
   - As a fallback, copy the code from `espruino/puck-advertise-hue.js` into the Web IDE and manually flash it to the Puck

   **Note:** You can combine steps 3 and 4 by running `npm run update`

5. You're ready to go! Run the main code with `npm start` or `node main.js`
   - On linux/RaspberryPi you must run as: `sudo node main.js` unless you have enabled BLE privileges for node

## Using the Puck (Default Settings)

### Quick Click (0.0s < clickDuration <= 0.3s)

Toggle brightness between 25%, 50%, 75%, 100%

Puck responds with a pretty blue-green flash

If the lights are off, they will be turned on at 25%

### Medium Click (0.3s < clickDuration <= 0.6s)

Toggle light group On / Off

Puck responds with a beautiful red-blue flash

Lights start at whatever brightness they were previously set at

### Long Click (0.6s < clickDuration)

Switch the lights that the puck is currently bound to

Puck responds with a series of light blue-red-green flashes equal to the light number as ordered in the `LIGHTS` array (one-indexed) your config.json.

## Configuration

By default, the Puck will be set with the following configuration:

```
{
  "clickDuration": {
    "timeout": 300,
    "short": 0.3,
    "medium": 0.6
  },
  "modes": {
    "changeBrightness": {
      "colors": ["blue", "green"],
      "clickType": "short"
    },
    "toggleOnOff": {
      "colors": ["blue", "green", "red"],
      "clickType": "medium"
    },
    "selectLights": {
      "colors": ["blue", "red"],
      "clickType": "long",
      "delay": 120
    }
  }
}
```

- You can override any of these values by changing them in config.json at the root of the project
- If you run `npm run setup` or `node utility/prepPuck.js --save` a default config will be created for you
- Once you have made your desired changes, run `npm run update` or `npm run setup` or `node utility/prepPuck.js && node utility/flashPuck.js` to send the updated code to your Puck

### Properties

-  `clickDuration.timeout`
   -  After this number of seconds, the next click on the Puck, regardless of the click type, will take no effect, instead flashing the group number the Puck is bound to
   -  Set this to 0 to disable this feature

-  `clickDuration.short`
   -  The maximum duration in seconds a button press should be considered a short click

-  `clickDuration.medium`
   -  The maximum duration in seconds a button press should be considered a medium click

-  `modes.changeBrightness`, `modes.toggleOnOff`, `modes.selectLights`
   -  Configuration options for the three different button press modes

   -  `modes.<mode>.clickType`
      -  Either omit this property to use the defaults or set them for each mode
      -  Setting only one or two will create an error
      -  This controls which function gets bound to which press type
   -  `modes.<mode>.colors`
      -  Set the colors of the LEDS to flash with this type of button press
      -  Must be an array of values including any of "blue", "red", and "green"
   -  `modes.selectLights.delay`
      -  duration in seconds
      -  If it has been greater than delay seconds since the last time you switched lights, flash the current light number instead of switching
      -  set this to 0 to disable it
 -  `lights`
    -  An array containing objects describing all of the lights you want to control with the Puck
    -  By default, all of your light groups will be added
    -  Light objects must contain the following:
        ```
        {
          "type": "light" or "group",
          "name": "The name of the light or group",
          "key": <key from hue api>
        }
        ```
    -  To get a list of all of your lights and groups, run `npm run discoverLights` or `node utility/discoverLights.js`. This will write the file `hue.json` which will contain the properly formatted list of all of your lights
  
## Limitations

Puck cannot speak directly with the Bridge, and must be proxied through a computer / RaspberryPi. Luckily this runs on a PiZero, so it is mostly unobtrusive and inexpensive.

Puck is limited by the range of the Bluetooth, so the computer running the node process needs to be relatively close to the rooms you want to use the puck in. Mine is located in between a couple rooms and seems to work well.

## Troubleshooting

If running on a Raspberry Pi, ensure that you installed node as described in this readme, as well as following the additional raspberry pi setup instructions.

If you encounter issues with the setup script, or executing main.js, try removing your node modules with `rm -rf node_modules` or on linux `sudo rm -rf node_modules` and then reinstalling dependencies with `npm install`.

## Additional Resources

[Hue API Resources](https://developers.meethue.com/develop/get-started-2/)

[node-hue-api on npm](https://github.com/peter-murray/node-hue-api)

[noble on npm](https://github.com/noble/noble)

[Installing node on raspi](https://bloggerbrothers.com/2017/03/04/installing-nodejs-on-a-raspberry-pi/)

[node js distributions](http://nodejs.org/dist/)

[puck.js](https://www.puck-js.com/)

[puck.js videos](https://www.youtube.com/playlist?list=PL5LHmNPn_0mnuTSbytZJgc9jfmTqeylzg)


## License

MIT. Use it. Fork it. Change it. Make PRs.

## Contact

[Email](robert.mc.reed@gmail.com), [GitHub](https://github.com/RobertMcReed), [LinkedIn](https://www.linkedin.com/in/robertmcreed/)
