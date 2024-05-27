import { ORCA_IMAGE_URLS } from "./constants";

export const loadOrcaLayers = (): Promise<OrcaLayer[]> => {
  const orcaImages = ORCA_IMAGE_URLS.map(() => new Image());

  const loadingPromises: Promise<OrcaLayer>[] = orcaImages.map(
    (image, index) => {
      return new Promise<OrcaLayer>((res, rej) => {
        image.onload = () => res({ img: image, id: index });
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
