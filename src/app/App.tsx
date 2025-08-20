import { useEffect, useRef } from "react";

import {
  calcNextOrcaPosition,
  calcOrcaScale,
  fillLayerPositions,
  loadOrcaLayers,
  sortOrcaLayersTailFirst,
} from "../lib/orcaActions";
import {
  BORDER_WIDTH,
  FPS_INTERVAL,
  MAX_LAYER_TRAVEL_DISTANCE,
  MAX_LAYER_TRAVEL_DISTANCE_SMALL_SCREEN,
  ORCA_X_MIDDLE,
  ORCA_Y_MIDDLE,
  SMALL_SCREEN_WIDTH,
} from "../lib/constants";

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

  let previousTime = performance.now();
  let accumulatorMs = 0;

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
    const now = performance.now();
  const delta = now - previousTime;
    previousTime = now;
    accumulatorMs += delta;

    let didUpdate = false;

    while (accumulatorMs >= FPS_INTERVAL) {
      // fixed update step
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

      accumulatorMs -= FPS_INTERVAL;
      didUpdate = true;
    }

    if (didUpdate) {
      // Respect theme background via CSS variable set on body/html by next-themes
      const bg =
        getComputedStyle(document.body).getPropertyValue("--bg").trim() ||
        "white";
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.current!.width, canvas.current!.height);

      renderOrca(ctx);
    }

    requestAnimationFrame(() => animate(ctx));
  }

  const renderOrca = (ctx: CanvasRenderingContext2D) => {
    orcas.forEach((orca) => {
      orca.layerPositions.forEach((position, index) => {
        const source = orcaLayers[index].img;
        const imageWidth = source.width;
        const imageHeight = source.height;

        ctx.drawImage(
          source,
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
      <canvas id="canvas" ref={canvas}>
        Canvas not supported. Please use a more modern different browser.
      </canvas>
    </>
  );
}

export default App;
