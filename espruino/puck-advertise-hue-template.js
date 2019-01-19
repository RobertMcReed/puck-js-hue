// CONFIG BEGIN
const LIGHTS = [{ key: 1, type: 'light', name: 'default' }];
const SHORT_MAX = 0.3;
const MEDIUM_MAX = 0.6;
const CHANGE_DELAY = 10;
const BRIGHTNESS_COLORS = ['blue', 'green'];
const CHANGE_COLORS = ['blue', 'red'];
const TOGGLE_COLORS = ['blue', 'green', 'red'];
const HANDLERS = [handleChangeBrightness, handleToggleLights, handleChangeLights];
// CONFIG END

const colorMap = {
  red: LED1, // eslint-disable-line
  green: LED2, // eslint-disable-line
  blue: LED3, // eslint-disable-line
};

const getColors = colors => colors.map(color => colorMap[color]);

const state = {
  light: 0,
  toggle: 0,
  brightness: 0,
  lastLightTime: null,
};

function info() {
  const line = arguments.reduce((acc, phrase) => `${acc} ${phrase}`, '[INFO]');
  console.log(line);
}

const getNextLight = () => {
  if (++state.light === LIGHTS.length) state.light = 0;

  return { lightNum: state.light, key: LIGHTS[state.light].key };
};

const toggleLights = () => {
  if (++state.toggle > 1) state.toggle = 0;
};

const toggleBrightness = () => {
  if (++state.brightness > 1) state.brightness = 0;
};

const pulseMany = (colors, duration) => {
  const time = duration || 250;
  const pins = Array.isArray(colors) ? colors : [colors];
  pins.forEach(pin => digitalPulse(pin, 1, time)); // eslint-disable-line
};

const flashLightNum = (lightNum, colors) => {
  let nums = 0;

  const flasherHelper = () => {
    if (nums <= lightNum) {
      nums++;
      pulseMany(colors);
      setTimeout(flasherHelper, 500);
    }
  };

  flasherHelper();
};

const setAdvertisement = () => {
  const key = LIGHTS[state.light].key; // eslint-disable-line
  const toggle = state.toggle; // eslint-disable-line
  const brightness = state.brightness; // eslint-disable-line
  const type = state.type; // eslint-disable-line
  const advert = `${type[0]}${key}-${toggle}-${brightness}`;
  info('Setting Advertisement:', advert);
  NRF.setAdvertising( // eslint-disable-line
    {},
    { manufacturer: 0x0590, manufacturerData: [advert] } // eslint-disable-line
  );
};

function handleChangeBrightness() {
  pulseMany(getColors(BRIGHTNESS_COLORS), 400);
  info(`Adjusting brightness in ${LIGHTS[state.light].name}`);
  toggleBrightness();
}

function handleChangeLights(e) {
  let lightNum = state.light;
  let prefix = 'Lights set';

  if (state.lastLightTime && (e.time - state.lastLightTime) < CHANGE_DELAY) {
    const lightData = getNextLight();
    lightNum = lightData.lightNum; // eslint-disable-line
    prefix = 'Switching';
  }

  info(`${prefix} to ${LIGHTS[state.light].name}`);
  state.lastLightTime = e.time;
  flashLightNum(lightNum, getColors(CHANGE_COLORS));
}

function handleToggleLights() {
  pulseMany(getColors(TOGGLE_COLORS), 400); // eslint-disable-line
  info(`Toggling ${LIGHTS[state.light].name}`);
  toggleLights();
}

const handleWatch = (e) => {
  const len = e.time - e.lastTime;

  let fnNum = 0;
  if (len > MEDIUM_MAX) fnNum = 2;
  else if (len > SHORT_MAX) fnNum = 1;

  HANDLERS[fnNum](e);
  setAdvertisement();
};

const init = () => {
  info('__SET_ADVERT__');
  setAdvertisement(); // eslint-disable-next-line
  setWatch(handleWatch, BTN, { edge: 'falling', repeat: true, debounce: 50 }); 
};

init();