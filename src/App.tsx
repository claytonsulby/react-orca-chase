import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet";

import { loadOrcaLayers, sortOrcaLayersTailFirst } from "./orcaActions";
import {
  BORDER_WIDTH,
  DEFAULT_ORCA_SCALE,
  FPS,
  LONG_TRAVEL_DISTANCE,
  MAX_TRAVEL_DISTANCE,
  MEDIUM_ORCA_SCALE,
  MEDIUM_SCREEN_WIDTH,
  MIN_TRAVEL_DISTANCE,
  ORCA_X_DEACCELERATION,
  ORCA_X_MIDDLE,
  ORCA_Y_DEACCELERATION,
  ORCA_Y_MIDDLE,
  SHORT_TRAVEL_DISTANCE,
  SMALL_ORCA_SCALE,
} from "./constants";
import "./App.css";

function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const canvasPosition = { x: 0, y: 0 };

  const mousePositions: Point[] = [...Array(44).keys()].map(() => {
    return { x: 0, y: 0 };
  });

  let orcaLayers: OrcaLayer[] = [];

  let mouseX = 0;
  let mouseY = 0;
  let orcaXPos = 0;
  let orcaYPos = 0;

  let now;
  let then = Date.now();
  const interval = 1000 / FPS;
  let delta;

  useEffect(() => {
    if (!canvas.current) {
      alert("An error has occured :(\nPlease reload the site!");

      return;
    }

    const ctx = canvas.current.getContext("2d");

    if (!ctx) {
      alert("An error has occured :(\nPlease reload the site!");

      return;
    }

    canvas.current.width = canvasSize().x;
    canvas.current.height = canvasSize().y;

    setupMouseAndOcraPositions();

    canvas.current.addEventListener("mousemove", setMousePosition, false);
    canvas.current.addEventListener("touchmove", setTouchPosition, false);
    window.addEventListener("scroll", updatePosition, false);
    window.addEventListener("resize", updatePosition, false);

    loadOrcaLayers(calcOrcaScale())
      .then((layers) => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        orcaLayers = layers;
        sortOrcaLayersTailFirst(orcaLayers);
        animate(ctx);
      })
      .catch(() => {
        alert("Failed to load orca :(\nPlease reload the site!");
      });
  }, []);

  const calcOrcaScale = (): number => {
    if (
      window.matchMedia(`screen and (max-width: ${MEDIUM_SCREEN_WIDTH}px)`)
        .matches
    ) {
      return MEDIUM_ORCA_SCALE;
    }

    if (
      window.matchMedia(`screen and (max-width: ${SMALL_ORCA_SCALE}px)`).matches
    ) {
      return SMALL_ORCA_SCALE;
    }

    return DEFAULT_ORCA_SCALE;
  };

  const calcNextOrcaPosition = (
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

  const setupMouseAndOcraPositions = () => {
    const sizeWidth = canvasSize().x;
    const sizeHeight = canvasSize().y;

    // Start by rendering the orca in the middle of the screen
    mousePositions.fill({ x: sizeWidth / 2, y: sizeHeight / 2 });

    mouseX = sizeWidth / 2;
    mouseY = sizeHeight / 2;
    orcaXPos = sizeWidth / 2;
    orcaYPos = sizeHeight / 2;
  };

  const setMousePosition = (event: MouseEvent) => {
    mouseX = event.clientX - canvasPosition.x;
    mouseY = event.clientY - canvasPosition.y;
  };

  const setTouchPosition = (event: TouchEvent) => {
    mouseX = event.targetTouches[0].clientX - canvasPosition.x;
    mouseY = event.targetTouches[0].clientY - canvasPosition.y;
  };

  const updatePosition = () => {
    canvas.current!.width = canvasSize().x;
    canvas.current!.height = canvasSize().y;
  };

  const pointFromAngleDistance = (distance: number, radians: number): Point => {
    const x = distance * Math.cos(radians);
    const y = distance * Math.sin(radians);

    return {
      x,
      y,
    };
  };

  const canvasSize = (): Point => {
    return {
      x: window.innerWidth - BORDER_WIDTH * 2,
      y: window.innerHeight - BORDER_WIDTH * 2,
    };
  };

  function animate(ctx: CanvasRenderingContext2D) {
    now = Date.now();
    delta = now - then;

    const timeToRender = delta > interval;
    if (timeToRender) {
      then = now - (delta % interval);

      const orcaPosition = calcNextOrcaPosition(
        { x: mouseX, y: mouseY },
        { x: orcaXPos, y: orcaYPos }
      );

      orcaXPos += orcaPosition.x;
      orcaYPos += orcaPosition.y;

      mousePositions.push({ x: orcaPosition.x, y: orcaPosition.y });
      mousePositions.shift();

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.current!.width, canvas.current!.height);
    }

    renderOrca(ctx);

    requestAnimationFrame(() => animate(ctx));
  }

  const renderOrca = (ctx: CanvasRenderingContext2D) => {
    orcaLayers.forEach((layer, index) => {
      const imageWidth = layer.img.width;
      const imageHeight = layer.img.height;

      ctx.drawImage(
        layer.img,
        mousePositions[index].x - imageWidth / ORCA_X_MIDDLE,
        mousePositions[index].y - imageHeight / ORCA_Y_MIDDLE,
        imageWidth,
        imageHeight
      );
    });
  };

  return (
    <>
      <Helmet>
        <script
          defer
          src={import.meta.env.VITE_UMAMI_WEBSITE_URL}
          data-website-id={import.meta.env.VITE_UMAMI_WEBSITE_ID}
        ></script>
      </Helmet>

      <canvas id="canvas" ref={canvas}>
        Canvas not supported. Please use a more modern different browser.
      </canvas>

      <div className="message">
        <james-watt-calling-card
          modal-bg-color="#FFFFFF"
          modal-border-color="#ff0000"
        >
          <p>Soooo mesmerizing!</p>
        </james-watt-calling-card>
      </div>
    </>
  );
}

export default App;
