export const ORCA_SCALE = 1;
export const ORCA_X_DEACCELERATION = 40;
export const ORCA_Y_DEACCELERATION = 40;
export const MAX_TRAVEL_DISTANCE = 300;
export const LONG_TRAVEL_DISTANCE = 15;
export const SHORT_DISTANCE_MULTIPLIER = 0.3333;
export const FPS = 35;

// The middle of the orca is halfway on the x axis
// but 1.7 on the y axis due to its long dorsal fin.
export const ORCA_X_MIDDLE = 2;
export const ORCA_Y_MIDDLE = 1.7;

// Canvas is rendered with a  2px border
export const BORDER_WIDTH = 2;

export const ORCA_IMAGE_URLS = [...Array(44).keys()]
  .map((x) => ++x)
  .map((x) => "/orca/" + x + ".png");
