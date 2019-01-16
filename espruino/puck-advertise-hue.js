const GROUPS = [
  { name: 'Bedroom', key: 1 },
  { name: 'Living Room', key: 2 },
  { name: 'Kitchen', key: 6 },
];
// DO NOT ADD ANYTHING ABOVE THIS LINE

const RED = LED1; // eslint-disable-line
const GREEN = LED2; // eslint-disable-line
const BLUE = LED3; // eslint-disable-line
const GROUP_DELAY = 10;

const state = {
  group: 0,
  toggle: 0,
  brightness: 0,
  lastGroupTime: null,
};

function info() {
  const line = arguments.reduce((acc, phrase) => `${acc} ${phrase}`, '[INFO]');
  console.log(line);
}

const getNextGroup = () => {
  if (++state.group === GROUPS.length) state.group = 0;

  return { groupNum: state.group, key: GROUPS[state.group].key };
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

const flashGroupNum = (groupNum, colors) => {
  let nums = 0;

  const flasherHelper = () => {
    if (nums <= groupNum) {
      nums++;
      pulseMany(colors);
      setTimeout(flasherHelper, 500);
    }
  };

  flasherHelper();
};

const setAdvertisement = () => {
  const key = GROUPS[state.group].key; // eslint-disable-line
  const toggle = state.toggle; // eslint-disable-line
  const brightness = state.brightness; // eslint-disable-line
  const advert = `${key}-${toggle}-${brightness}`;
  info('Setting Advertisement:', advert);
  NRF.setAdvertising( // eslint-disable-line
    {},
    { manufacturer: 0x0590, manufacturerData: [advert] } // eslint-disable-line
  );
};

const handleChangeBrightness = () => {
  pulseMany([RED, GREEN], 400);
  info(`Adjusting brightness in ${GROUPS[state.group].name}`);
  toggleBrightness();
};

const handleChangeGroups = (e) => {
  let groupNum = state.group;
  let prefix = 'Group set';

  if (state.lastGroupTime && (e.time - state.lastGroupTime) < GROUP_DELAY) {
    const groupData = getNextGroup();
    groupNum = groupData.groupNum; // eslint-disable-line
    prefix = 'Switching';
  }

  info(`${prefix} to ${GROUPS[state.group].name}`);
  state.lastGroupTime = e.time;
  flashGroupNum(groupNum, [BLUE, RED]);
};

const handleToggleLights = () => {
  pulseMany([BLUE, GREEN], 400); // eslint-disable-line
  info(`Toggling ${GROUPS[state.group].name}`);
  toggleLights();
};

const handleWatch = (e) => {
  const len = e.time - e.lastTime;

  if (len > 0.6) handleChangeGroups(e);
  else if (len > 0.3) handleToggleLights();
  else handleChangeBrightness();

  setAdvertisement();
};

const init = () => {
  info('__SET_ADVERT__');
  setAdvertisement(); // eslint-disable-next-line
  setWatch(handleWatch, BTN, { edge: 'falling', repeat: true, debounce: 50 }); 
};

init();
