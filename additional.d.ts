interface Point {
  x: number;
  y: number;
}

interface OrcaLayer {
  img: HTMLImageElement;
  id: number;
}

interface ImportMetaEnv extends Readonly<Record<string, string>> {
  readonly VITE_UMAMI_WEBSITE_ID: string;
  readonly VITE_UMAMI_WEBSITE_URL: string;
}
