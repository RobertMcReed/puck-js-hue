const GROUPS = [
  { name: 'Bedroom', key: 1 },
  { name: 'Living Room', key: 2 },
  { name: 'Porch', key: 5 },
  { name: 'Basement', key: 4 },
  { name: 'TV Room', key: 3 },
];
// DO NOT ADD ANYTHING ABOVE THIS LINE

const RED = LED1; // eslint-disable-line
const GREEN = LED2; // eslint-disable-line
const BLUE = LED3; // eslint-disable-line

const state = {
  group: 0,
  toggle: 0,
};

function info() {
  const line = arguments.reduce((acc, phrase) => `${acc} ${phrase}`, '[INFO]');
  console.log(line);
}

const getNextGroup = () => {
  if (++state.group === GROUPS.length) state.group = 0;

  return { groupNum: state.group, key: GROUPS[state.group].key };
};

const toggleLightGroup = () => {
  if (++state.toggle > 9) state.toggle = 0;
};

const flashGroupNum = (groupNum, color) => {
  let nums = 0;

  const flasherHelper = () => {
    if (nums <= groupNum) {
      nums++;
      digitalPulse(color, 1, 150); // eslint-disable-line
      setTimeout(flasherHelper, 300);
    }
  };

  flasherHelper();
};

const setAdvertisement = () => {
  const key = GROUPS[state.group].key; // eslint-disable-line
  const toggle = state.toggle; // eslint-disable-line
  const advert = `${key}-${toggle}`;
  NRF.setAdvertising( // eslint-disable-line
    {},
    { manufacturer: 0x0590, manufacturerData: [advert] },
  );
};

const handleWatch = (e) => {
  const len = e.time - e.lastTime;

  if (len > 0.7) { // longest press, identify group
    const groupNum = state.group;
    flashGroupNum(groupNum, RED);
    info(`Currently set to ${GROUPS[state.group].name}`);
  } else if (len > 0.3) { // long press, switch groups
    const groupData = getNextGroup();
    const groupNum = groupData.groupNum; // eslint-disable-line

    flashGroupNum(groupNum, BLUE);
    info(`Switching to ${GROUPS[state.group].name}`);
  } else { // short press, toggle light
    digitalPulse(GREEN, 1, 250); // eslint-disable-line
    toggleLightGroup();
    info(`Toggling ${GROUPS[state.group].name}`);
    info(`Toggle: ${state.toggle}`);
  }
  setAdvertisement();
};

const init = () => {
  info('__SET_ADVERT__');
  setAdvertisement(); // eslint-disable-next-line
  setWatch(handleWatch, BTN, { edge: 'falling', repeat: true, debounce: 50 }); 
};

init();
