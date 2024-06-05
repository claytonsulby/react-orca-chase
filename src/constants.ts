// These variables control the speed of the orca
export const ORCA_X_DEACCELERATION = 40;
export const ORCA_Y_DEACCELERATION = 40;

// These values control how far each layer can travel.
// Higher values result in a more stretched orca
export const MAX_LAYER_TRAVEL_DISTANCE = 300;
export const MAX_LAYER_TRAVEL_DISTANCE_SMALL_SCREEN = 200;
export const MIN_LAYER_TRAVEL_DISTANCE = 50;

// These values change when different orca speeds occur
export const MAX_ACCEPTABLE_TRAVEL_DISTANCE = 15;
export const MIN_ACCEPTABLE_TRAVEL_DISTANCE = 1;

// A higher FPS will result in smoother orca movement i.e. less
// delay between orca layer movement
export const FPS = 35;
export const FPS_INTERVAL = 1000 / FPS;

export const SMALL_SCREEN_WIDTH = 425;
export const MEDIUM_SCREEN_WIDTH = 640;

export const DEFAULT_ORCA_SCALE = 1;
export const SMALL_ORCA_SCALE = 0.6;
export const MEDIUM_ORCA_SCALE = 0.85;

// The middle of the orca is halfway on the x axis
// but 1.7 on the y axis due to its long dorsal fin.
export const ORCA_X_MIDDLE = 2;
export const ORCA_Y_MIDDLE = 1.7;

// Canvas is rendered with a  2px border
export const BORDER_WIDTH = 2;

export const ORCA_LAYERS = 44;

export const ORCA_IMAGE_URLS = [...Array(ORCA_LAYERS).keys()]
  .map((x) => ++x)
  .map((x) => "/orca/" + x + ".png");
