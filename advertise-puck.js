const RED = LED1;
const GREEN = LED2;
const BLUE = LED3;

const rooms = [
  { name: 'Bedroom', key: 1 },
  { name: 'Living Room', key: 2 },
  { name: 'Porch', key: 5 },
  { name: 'Basement', key: 4 },
  { name: 'TV Room', key: 3 },
];

const state = {
  room: 0,
  toggle: 0,
};

const getNextRoom = () => {
  if (++state.room === rooms.length) state.room = 0;
  
  return { roomNum: state.room, key: rooms[state.room].key };
};

const toggleLights = () => {
  if (++state.toggle > 9) state.toggle = 0;
};

const flashRoomNum = (roomNum, color) => {
  let nums = 0;

  const flasherHelper = () => {
    if (nums > roomNum) return;
    else {
      nums++;
      digitalPulse(color, 1, 150);
      setTimeout(flasherHelper, 300);
    }
  };

  flasherHelper();
};

const setAdvertisement = () => {
  const advert = `${rooms[state.room].key}-${state.toggle}`;
  NRF.setAdvertising(
    {},
    { manufacturer: 0x0590, manufacturerData:[advert]}
  );
};

const handleWatch = (e) => {
  let len = e.time - e.lastTime;

  if (len > 0.7) { //longest press, identify room
    const roomNum = state.room;
    flashRoomNum(roomNum, RED);
    console.log(`Currently set to ${rooms[state.room].name}`);
  } else if (len > 0.3) { // long press, switch rooms
    const roomData = getNextRoom();
    const roomNum = roomData.roomNum;
    const key = roomData.key;

    flashRoomNum(roomNum, BLUE);
    setAdvertisement();
    console.log(`Switching to ${rooms[state.room].name}`);
  } else { // short press, toggle light
    digitalPulse(GREEN, 1, 250);
    toggleLights();
    setAdvertisement();
    console.log(`Toggling ${rooms[state.room].name}`);
    console.log(`Toggle: ${state.toggle}`);
  }
};

const init = () => {
  console.log(`__SET_ADVERT__`);
  setAdvertisement();
  setWatch(handleWatch, BTN, { edge: 'falling', repeat: true, debounce: 50 });
};

init();
