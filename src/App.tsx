import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet";

import { loadOrcaLayers, sortOrcaLayersTailFirst } from "./orcaActions";
import {
  BORDER_WIDTH,
  FPS,
  LONG_TRAVEL_DISTANCE,
  MAX_TRAVEL_DISTANCE,
  MIN_TRAVEL_DISTANCE,
  ORCA_SCALE,
  ORCA_X_DEACCELERATION,
  ORCA_X_MIDDLE,
  ORCA_Y_DEACCELERATION,
  ORCA_Y_MIDDLE,
  SHORT_TRAVEL_DISTANCE,
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
  let xDelta = 0;
  let yDelta = 0;

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

    setupPositionData();

    canvas.current.addEventListener("mousemove", setMousePosition, false);
    canvas.current.addEventListener("touchmove", setTouchPosition, false);
    window.addEventListener("scroll", updatePosition, false);
    window.addEventListener("resize", updatePosition, false);

    loadOrcaLayers()
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

  const setupPositionData = () => {
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

      xDelta = mouseX - orcaXPos;
      yDelta = mouseY - orcaYPos;

      const distanceToMoveX = ORCA_X_DEACCELERATION;
      const distanceToMoveY = ORCA_Y_DEACCELERATION;

      const theta_radians = Math.atan2(mouseY - orcaYPos, mouseX - orcaXPos);
      const distance = Math.sqrt(xDelta * xDelta + yDelta * yDelta);

      if (distance > LONG_TRAVEL_DISTANCE) {
        const p = pointFromAngleDistance(MAX_TRAVEL_DISTANCE, theta_radians);

        orcaXPos += p.x / distanceToMoveX;
        orcaYPos += p.y / distanceToMoveY;
      } else if (distance > SHORT_TRAVEL_DISTANCE) {
        const p = pointFromAngleDistance(MIN_TRAVEL_DISTANCE, theta_radians);

        orcaXPos += p.x / distanceToMoveX;
        orcaYPos += p.y / distanceToMoveY;
      } else {
        orcaXPos += xDelta;
        orcaYPos += yDelta;
      }

      mousePositions.push({ x: orcaXPos, y: orcaYPos });
      mousePositions.shift();

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.current!.width, canvas.current!.height);
    }

    renderOrca(ctx);

    requestAnimationFrame(() => animate(ctx));
  }

  const renderOrca = (ctx: CanvasRenderingContext2D) => {
    orcaLayers.forEach((layer, index) => {
      const imageWidth = layer.img.naturalWidth * ORCA_SCALE;
      const imageHeight = layer.img.naturalHeight * ORCA_SCALE;

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
