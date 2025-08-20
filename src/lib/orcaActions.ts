import {
  DEFAULT_ORCA_SCALE,
  MAX_ACCEPTABLE_TRAVEL_DISTANCE,
  MEDIUM_ORCA_SCALE,
  MEDIUM_SCREEN_WIDTH,
  MIN_ACCEPTABLE_TRAVEL_DISTANCE,
  MIN_LAYER_TRAVEL_DISTANCE,
  ORCA_IMAGE_URLS,
  ORCA_LAYERS,
  ORCA_X_DEACCELERATION,
  ORCA_Y_DEACCELERATION,
  SMALL_ORCA_SCALE,
  SMALL_SCREEN_WIDTH,
  ORCA_REFERENCE_HEAD_WIDTH,
} from "./constants";

/** Loads all orca images and scales them. All the images will load and the function promise
 * will resolve, or, a image will fail to load and the function promise will reject.
 *
 * @param imageScale
 * @returns
 */
export const loadOrcaLayers = (imageScale: number): Promise<OrcaLayer[]> => {
  // Load images and pre-scale once into ImageBitmaps to avoid per-frame resampling.
  const rawPromises: Promise<{ img: HTMLImageElement; id: number }>[] = ORCA_IMAGE_URLS.map(
    (src: string, index: number) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";
        img.loading = "eager"; // we want them ready for the first render
        img.crossOrigin = "anonymous"; // safe default if hosted on same origin
  img.onload = () => {
          resolve({ img, id: index });
        };
        img.onerror = () => reject(new Error(`Failed to load orca layer index ${index}`));
        img.src = src;
      })
  );

  // After all images are loaded, compute a normalization factor so the head width matches reference.
  return Promise.all(rawPromises).then(async (rawLayers) => {
    // Find head (id 0 corresponds to 1.webp in your scheme)
    const head = rawLayers.find((l) => l.id === 0)!;
    const desiredHeadWidth = ORCA_REFERENCE_HEAD_WIDTH * imageScale;
    const normalization = desiredHeadWidth / head.img.naturalWidth;

    const scaleTo = (source: HTMLImageElement) => {
      const targetWidth = Math.max(1, Math.floor(source.naturalWidth * normalization));
      const targetHeight = Math.max(1, Math.floor(source.naturalHeight * normalization));

      const doBitmap = async (): Promise<CanvasImageSource & { width: number; height: number }> => {
        if ("createImageBitmap" in window) {
          const opts: ImageBitmapOptions = {
            resizeWidth: targetWidth,
            resizeHeight: targetHeight,
            resizeQuality: "high",
          };
          const bmp = await createImageBitmap(source, opts);
          // ImageBitmap already has width/height attributes
          return bmp as unknown as CanvasImageSource & { width: number; height: number };
        }
        const off = document.createElement("canvas");
        off.width = targetWidth;
        off.height = targetHeight;
        const c2d = off.getContext("2d");
        if (!c2d) throw new Error("Failed to get 2D context for pre-scale");
        c2d.imageSmoothingEnabled = true;
        c2d.imageSmoothingQuality = "high";
        c2d.drawImage(source, 0, 0, targetWidth, targetHeight);
        return off as unknown as CanvasImageSource & { width: number; height: number };
      };

      return doBitmap();
    };

    const scaled = await Promise.all(
      rawLayers.map(async (l) => ({ id: l.id, img: await scaleTo(l.img) }))
    );

    return scaled as OrcaLayer[];
  });
};

/**
 * Sorts the orca layers from tail to nose. Aassumes 1.png is the nose of the orca
 * @param layers
 */
export const sortOrcaLayersTailFirst = (layers: OrcaLayer[]) => {
  layers.sort((a, b) => {
    if (a.id > b.id) {
      return -1;
    } else {
      return 1;
    }
  });
};

/**
 * Calculates the next position of the orca given the current mouse position and current orca position
 * @param mousePosition
 * @param orcaPosition
 * @returns
 */
export const calcNextOrcaPosition = (
  mousePosition: Point,
  orcaPosition: Point,
  maxLayerTravelDistance: number
): Point => {
  const xDelta = mousePosition.x - orcaPosition.x;
  const yDelta = mousePosition.y - orcaPosition.y;

  const radiansBetweenOrcaAndMouse = Math.atan2(yDelta, xDelta);
  const distanceBetweenOrcaAndMouse = Math.sqrt(
    xDelta * xDelta + yDelta * yDelta
  );

  if (distanceBetweenOrcaAndMouse > MAX_ACCEPTABLE_TRAVEL_DISTANCE) {
    const { x, y } = pointFromAngleDistance(
      maxLayerTravelDistance,
      radiansBetweenOrcaAndMouse
    );

    return {
      x: x / ORCA_X_DEACCELERATION,
      y: y / ORCA_Y_DEACCELERATION,
    };
  } else if (radiansBetweenOrcaAndMouse > MIN_ACCEPTABLE_TRAVEL_DISTANCE) {
    const { x, y } = pointFromAngleDistance(
      MIN_LAYER_TRAVEL_DISTANCE,
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

/**
 * Calculate a x,y point given a distance and angle
 * @param distance
 * @param radians
 * @returns
 */
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

/**
 * Returns an array of ORCA_LAYERS length with points at
 * a given position
 * @param pos
 * @returns
 */
export const fillLayerPositions = (pos: Point): Point[] => {
  return [...Array(ORCA_LAYERS).keys()].map(() => {
    return pos;
  });
};

/**
 * Calculates how much orcas should be scaled by given a window
 * @param window
 * @returns
 */
export const calcOrcaScale = (window: Window): number => {
  if (
    window.matchMedia(`screen and (max-width: ${SMALL_SCREEN_WIDTH}px)`).matches
  ) {
    return SMALL_ORCA_SCALE;
  }

  if (
    window.matchMedia(`screen and (max-width: ${MEDIUM_SCREEN_WIDTH}px)`)
      .matches
  ) {
    return MEDIUM_ORCA_SCALE;
  }

  return DEFAULT_ORCA_SCALE;
};
