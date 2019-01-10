const RED = LED1;
const GREEN = LED2;
const BLUE = LED3;

// START
const GROUPS = [
  { name: 'Bedroom', key: 1 },
  { name: 'Living Room', key: 2 },
  { name: 'Porch', key: 5 },
  { name: 'Basement', key: 4 },
  { name: 'TV Room', key: 3 },
];
// END

const state = {
  group: 0,
  toggle: 0,
};

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
    if (nums > groupNum) return;
    else {
      nums++;
      digitalPulse(color, 1, 150);
      setTimeout(flasherHelper, 300);
    }
  };

  flasherHelper();
};

const setAdvertisement = () => {
  const key = GROUPS[state.group].key;
  const toggle = state.toggle;
  const advert = `${key}-${toggle}`;
  NRF.setAdvertising(
    {},
    { manufacturer: 0x0590, manufacturerData:[advert]}
  );
};

const handleWatch = (e) => {
  let len = e.time - e.lastTime;

  if (len > 0.7) { //longest press, identify group
    const groupNum = state.group;
    flashGroupNum(groupNum, RED);
    console.log(`[INFO] Currently set to ${GROUPS[state.group].name}`);
  } else if (len > 0.3) { // long press, switch groups
    const groupData = getNextGroup();
    const groupNum = groupData.groupNum;

    flashGroupNum(groupNum, BLUE);
    console.log(`[INFO] Switching to ${GROUPS[state.group].name}`);
  } else { // short press, toggle light
    digitalPulse(GREEN, 1, 250);
    toggleLightGroup();
    console.log(`[INFO] Toggling ${GROUPS[state.group].name}`);
    console.log(`[INFO] Toggle: ${state.toggle}`);
  }
  setAdvertisement();
};

const init = () => {
  console.log(`[INFO] __SET_ADVERT__`);
  setAdvertisement();
  setWatch(handleWatch, BTN, { edge: 'falling', repeat: true, debounce: 50 });
};

init();
