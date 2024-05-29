import { JamesWattCallingCard } from "james-watt-calling-card/src/james-watt-calling-card.js";

// Web component type implementation from https://coryrylan.com/blog/how-to-use-web-components-in-preact-and-typescript
type CustomElement<T> = Partial<T & { children: JSX.Element; class: string }>;

declare global {
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

  namespace JSX {
    interface IntrinsicElements {
      "james-watt-calling-card": CustomElement<typeof JamesWattCallingCard>;
    }
  }
}
