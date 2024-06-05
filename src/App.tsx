import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet";

import {
  calcNextOrcaPosition,
  calcOrcaScale,
  fillLayerPositions,
  loadOrcaLayers,
  normalisePosition,
  sortOrcaLayersTailFirst,
} from "./orcaActions";
import {
  BORDER_WIDTH,
  FPS_INTERVAL,
  MAX_LAYER_TRAVEL_DISTANCE,
  MAX_LAYER_TRAVEL_DISTANCE_SMALL_SCREEN,
  ORCA_X_MIDDLE,
  ORCA_Y_MIDDLE,
  SMALL_SCREEN_WIDTH,
} from "./constants";
import "./App.css";

function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const canvasPosition: Point = { x: 0, y: 0 };

  const orcas: Orca[] = [
    {
      layerPositions: fillLayerPositions({ x: 0, y: 0 }),
      orca: { x: 0, y: 0 },
      mouseOffset: { x: 0, y: 0 },
    },
  ];

  let orcaLayers: OrcaLayer[] = [];

  let maxLayerTravelDistance = MAX_LAYER_TRAVEL_DISTANCE;

  let previousRenderTime = Date.now();

  let mouseX = 0;
  let mouseY = 0;

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
    setMaxOrcaTravelDistance();

    canvas.current.addEventListener("mousemove", setMousePosition, false);
    canvas.current.addEventListener("touchmove", setTouchPosition, false);

    window.addEventListener("keydown", handleKeyDown, false);
    window.addEventListener("scroll", updatePosition, false);
    window.addEventListener("resize", updatePosition, false);

    loadOrcaLayers(calcOrcaScale(window))
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

  const setMaxOrcaTravelDistance = () => {
    if (
      window.matchMedia(`screen and (max-width: ${SMALL_SCREEN_WIDTH}px)`)
        .matches
    ) {
      maxLayerTravelDistance = MAX_LAYER_TRAVEL_DISTANCE_SMALL_SCREEN;
    }
  };

  const setupMouseAndOcraPositions = () => {
    const sizeWidth = canvasSize().x;
    const sizeHeight = canvasSize().y;

    // Start by rendering the first orca in the middle of the screen
    orcas[0].layerPositions.fill({ x: sizeWidth / 2, y: sizeHeight / 2 });
    orcas[0].orca.x = sizeWidth / 2;
    orcas[0].orca.y = sizeHeight / 2;

    mouseX = sizeWidth / 2;
    mouseY = sizeHeight / 2;
  };

  const calcRandomMousePosition = (): Point => {
    // return Math.random() * (max - min) + min;
    const newMouseX = Math.random() * (canvas.current!.width - 0) + 0;
    const newMouseY = Math.random() * (canvas.current!.height - 0) + 0;

    return {
      x: newMouseX,
      y: newMouseY,
    };
  };

  /**
   * Creates a new orca which follows a randomly generated mouse position
   */
  const createNewOrca = () => {
    const newMousePosition: Point = calcRandomMousePosition();
    const newOrca: Orca = {
      layerPositions: fillLayerPositions({
        x: newMousePosition.x,
        y: newMousePosition.y,
      }),
      orca: { x: newMousePosition.x, y: newMousePosition.y },
      mouseOffset: {
        x: mouseX - newMousePosition.x,
        y: mouseY - newMousePosition.y,
      },
    };

    orcas.push(newOrca);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const upKeys = ["KeyW", "ArrowUp"];
    const downKeys = ["KeyS", "ArrowDown"];
    const leftKeys = ["KeyA", "ArrowLeft"];
    const rightKeys = ["KeyD", "ArrowRight"];
    const spaceKeys = ["Space"];

    const key = event.code;

    if (spaceKeys.includes(key)) {
      createNewOrca();
    }

    if (upKeys.includes(key)) {
      mouseY = 0 + BORDER_WIDTH * 2;
      mouseX = orcas[0].orca.x;
    }

    if (downKeys.includes(key)) {
      mouseY = canvasSize().y - BORDER_WIDTH * 2;
      mouseX = orcas[0].orca.x;

    }

    if (leftKeys.includes(key)) {
      mouseX = 0 + BORDER_WIDTH * 2;
      mouseY = orcas[0].orca.y;

    }

    if (rightKeys.includes(key)) {
      mouseX = canvasSize().x - BORDER_WIDTH * 2;
      mouseY = orcas[0].orca.y;

    }
  };

  const updatePosition = () => {
    canvas.current!.width = canvasSize().x;
    canvas.current!.height = canvasSize().y;
  };

  const canvasSize = (): Point => {
    return {
      x: window.innerWidth - BORDER_WIDTH * 2,
      y: window.innerHeight - BORDER_WIDTH * 2,
    };
  };

  const setMousePosition = (event: MouseEvent) => {
    mouseX = event.clientX - canvasPosition.x;
    mouseY = event.clientY - canvasPosition.y;
  };

  const setTouchPosition = (event: TouchEvent) => {
    mouseX = event.targetTouches[0].clientX - canvasPosition.x;
    mouseY = event.targetTouches[0].clientY - canvasPosition.y;
  };

  function animate(ctx: CanvasRenderingContext2D) {
    const now = Date.now();
    const elapsed = now - previousRenderTime;

    const timeToRender = elapsed > FPS_INTERVAL;
    if (timeToRender) {
      // Get ready for the next frame by setting then=now, but also adjust for the
      // specified FPS_INTERVAL not being a multiple of RAF's interval (16.7ms)
      previousRenderTime = now - (elapsed % FPS_INTERVAL);

      orcas.forEach((orca, index) => {
        const newOrcaPosition = calcNextOrcaPosition(
          { x: mouseX - orca.mouseOffset.x, y: mouseY - orca.mouseOffset.y },
          { x: orca.orca.x, y: orca.orca.y },
          maxLayerTravelDistance
        );

        orcas[index].orca.x += newOrcaPosition.x;
        orcas[index].orca.y += newOrcaPosition.y;

        orca.layerPositions.push({
          x: orcas[index].orca.x,
          y: orcas[index].orca.y,
        });

        orca.layerPositions.shift();
      });

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.current!.width, canvas.current!.height);
    }

    renderOrca(ctx);

    requestAnimationFrame(() => animate(ctx));
  }

  const renderOrca = (ctx: CanvasRenderingContext2D) => {
    orcas.forEach((orca) => {
      orca.layerPositions.forEach((position, index) => {
        const imageWidth = orcaLayers[index].img.width;
        const imageHeight = orcaLayers[index].img.height;

        ctx.drawImage(
          orcaLayers[index].img,
          position.x - imageWidth / ORCA_X_MIDDLE,
          position.y - imageHeight / ORCA_Y_MIDDLE,
          imageWidth,
          imageHeight
        );
      });
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
