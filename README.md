# Puck.js HUE Controller

## About
### What Does it Do?

Allows you to control Hue lights with a Puck.js.

### How Does It Work?

The Puck.js advertises a set of values that the node script listens for. The changing values indicate that the script should either:

  - Change Rooms
  - Toggle Lights On/Off
  - Change Light Brightness

The script then communicates over the network with the Hue Bridge, sending the appropriate request.

### Is It Practical?

Absolutely not, but it's kinda fun.

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
3. Register your computer with your Hue Bridge
   1. Press the Link button on the top of your Bridge
   2. run `node registerDevice.js <optional app name>`
   - This will register your device with the bridge, allowing you to programmatically access your lights
   - It will also create a `.env` and add the auto-generated `HUE_USERNAME` to it
4. Prepare the puck.js code: `node prepPuck.js`
   - This will:
      1. Connect to your bridge and gather your light groups
      2. Write the light groups to a `GROUPS` array in the file `espruino/puck-advertise-hue.js`
         - This array will dictate the light groups that are controlled from the Puck
         - If you want to omit or reorder groups, edit the `GROUPS` array
5. Flash the code to your puck.js
   1. Go to the [Espruino Web IDE](https://www.espruino.com/ide/)
   2. Turn on the Puck and connect it to the IDE via WebBluetooth
   3. Copy the code from `espruino/puck-advertise-hue.js` into the IDE
   4. Send the code to the Puck
   5. You can test it while connected to the IDE. Start pressing the Puck button and watch the console.
   6. Disconnect Puck from the Web IDE
6. Discover your Puck with node: `node discoverPucks.js`
   - On linux/RaspberryPi you must run as: `sudo node discoverPucks.js`
   - This will find any Puck.js within range that is `poweredOn` and advertising
   - It will write the mac address of each as a comma separated list `PUCKS` to the `.env`
   - You can safely run this script again, it will add newly discovered pucks to the list
   - If your Puck is not discovered, ensure it is disconnected from all devices and that bluetooth on your computer is enabled
7. You're ready to go! Run the main code with `node main.js`
   - On linux/RaspberryPi you must run as: `sudo node main.js`

### Extra Raspberry Pi Setup Steps
1. Ensure you have node installed on your path: `which node`
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

3. Go back and follow the rest of the normal [setup instructions](#setup)

## Using the Puck

### Quick Click (0.0s < clickDuration <= 0.3s)

Toggle brightness between 25%, 50%, 75%, 100%

Puck responds with a series of pretty green flashes equal to the light state (1, 2, 3, 4).

### Medium Click (0.3s < clickDuration <= 0.6s)

Toggle light On / Off

Puck responds with a long green flash.

### Long Click (0.6s < clickDuration <= 0.9s)

Switch the light group the puck is currently bound to.

Puck responds with a series of pretty blue flashes equal to the group number as ordered in the `GROUPS` array (one-indexed).

### Longer Click (0.9s < clickDuration <= 1.5s)

Puck reminds you what light group is selected.

Puck responds with a series of aggressive red flashes equal to the group number as ordered in the `GROUPS` array (one-indexed).

### Longest Click (duration > 2.0s)

Rainbow party.

## Limitations

Puck cannot speak directly with the Bridge, and must be proxied through a computer / RaspberryPi. Luckily this runs on a PiZero, so it is mostly unobtrusive and inexpensive.

Puck is limited by the range of the Bluetooth, so the computer running the node process needs to be relatively close to the rooms you want to use the puck in. Mine is located in between a couple rooms and seems to work well.

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
