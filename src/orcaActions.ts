import {
  LONG_TRAVEL_DISTANCE,
  MAX_TRAVEL_DISTANCE,
  MIN_TRAVEL_DISTANCE,
  ORCA_IMAGE_URLS,
  ORCA_X_DEACCELERATION,
  ORCA_Y_DEACCELERATION,
  SHORT_TRAVEL_DISTANCE,
} from "./constants";

export const loadOrcaLayers = (imageScale: number): Promise<OrcaLayer[]> => {
  const orcaImages = ORCA_IMAGE_URLS.map(() => new Image());

  const loadingPromises: Promise<OrcaLayer>[] = orcaImages.map(
    (image, index) => {
      return new Promise<OrcaLayer>((res, rej) => {
        image.onload = () => {
          image.width = image.naturalWidth * imageScale;
          image.height = image.naturalHeight * imageScale;

          res({ img: image, id: index });
        };
        image.onerror = () => rej({ img: image, id: index });
      });
    }
  );

  orcaImages.forEach((image, index) => {
    image.src = ORCA_IMAGE_URLS[index];
  });

  return Promise.all(loadingPromises);
};

// assuming 1.png is nose
export const sortOrcaLayersTailFirst = (layers: OrcaLayer[]) => {
  layers.sort((a, b) => {
    if (a.id > b.id) {
      return -1;
    } else {
      return 1;
    }
  });
};

export const pointFromAngleDistance = (
  distance: number,
  radians: number
): Point => {
  const x = distance * Math.cos(radians);
  const y = distance * Math.sin(radians);

  return {
    x,
    y,
  };
};

export const calcNextOrcaPosition = (
  mousePosition: Point,
  orcaPosition: Point
): Point => {
  const xDelta = mousePosition.x - orcaPosition.x;
  const yDelta = mousePosition.y - orcaPosition.y;

  const radiansBetweenOrcaAndMouse = Math.atan2(yDelta, xDelta);
  const distanceBetweenOrcaAndMouse = Math.sqrt(
    xDelta * xDelta + yDelta * yDelta
  );

  if (distanceBetweenOrcaAndMouse > LONG_TRAVEL_DISTANCE) {
    const { x, y } = pointFromAngleDistance(
      MAX_TRAVEL_DISTANCE,
      radiansBetweenOrcaAndMouse
    );

    return {
      x: x / ORCA_X_DEACCELERATION,
      y: y / ORCA_Y_DEACCELERATION,
    };
  } else if (radiansBetweenOrcaAndMouse > SHORT_TRAVEL_DISTANCE) {
    const { x, y } = pointFromAngleDistance(
      MIN_TRAVEL_DISTANCE,
      radiansBetweenOrcaAndMouse
    );

    return {
      x: x / ORCA_X_DEACCELERATION,
      y: y / ORCA_Y_DEACCELERATION,
    };
  }

  return {
    x: xDelta,
    y: yDelta,
  };
};
