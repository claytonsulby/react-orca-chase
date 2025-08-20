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

  // --- Autopilot (roaming when pointer is off-screen) ---
  type AutopilotMode = "arc" | "bezier" | "idle";
  let autopilotOn = true; // roam by default until user interacts
  let autoMode: AutopilotMode = "idle";
  let autoClockMs = 0;
  let autoDurationMs = 4000;
  let autoNextSpinMs: number | null = null; // if set, trigger a spin when the clock passes this
  // Arc params
  let arcCx = 0,
    arcCy = 0,
    arcR = 120,
    arcStartAngle = 0,
    arcAngularVel = 0.4 / 1000, // rad per ms
    arcDir = 1; // 1 or -1
  // Bezier params
  let bzP0: Point = { x: 0, y: 0 },
    bzP1: Point = { x: 0, y: 0 },
    bzP2: Point = { x: 0, y: 0 },
    bzP3: Point = { x: 0, y: 0 };

  // Barrel roll state (cascading head -> tail)
  const ROLL_TOTAL_MS = 1200; // duration for each layer's roll
  const ROLL_TURNS = 1; // full rotations per layer
  const CASCADE_DELAY_PER_LAYER_MS = 15; // delay between starting each successive layer
  let isRolling = false;
  let rollClockMs = 0; // global timer since the roll started

  // Idle animation (gentle bob and tilt)
  const IDLE_BOB_AMPLITUDE = 6; // px
  const IDLE_TILT_AMPLITUDE = 0.06; // radians (~3.4deg)
  const IDLE_PERIOD_MS = 2800; // one full bob cycle
  const IDLE_DISTANCE_THRESHOLD = 60; // px within which idle anim engages
  const IDLE_LAYER_PHASE_MS = 10; // slight phase offset per layer for watery feel
  let idleClockMs = 0;

  useEffect(() => {
    if (!canvas.current) {
      alert("An error has occured :(\nPlease reload the site!");

      return;
    }

    const el = canvas.current;
    const ctx = el.getContext("2d");

    if (!ctx) {
      alert("An error has occured :(\nPlease reload the site!");

      return;
    }

    el.width = canvasSize().x;
    el.height = canvasSize().y;

    setupMouseAndOcraPositions();
    setMaxOrcaTravelDistance();

    el.addEventListener("mousemove", setMousePosition, false);
    el.addEventListener("touchmove", setTouchPosition, false);
  el.addEventListener("mouseenter", handlePointerEnter, false);
  el.addEventListener("mouseleave", handlePointerLeave, false);
  el.addEventListener("touchstart", handleTouchStart, false);
  el.addEventListener("touchend", handleTouchEnd, false);
    el.addEventListener("click", handleClick, false);

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

    // Cleanup on unmount
    return () => {
      el.removeEventListener("mousemove", setMousePosition, false);
      el.removeEventListener("touchmove", setTouchPosition, false);
  el.removeEventListener("mouseenter", handlePointerEnter, false);
  el.removeEventListener("mouseleave", handlePointerLeave, false);
  el.removeEventListener("touchstart", handleTouchStart, false);
  el.removeEventListener("touchend", handleTouchEnd, false);
      el.removeEventListener("click", handleClick, false);
      window.removeEventListener("keydown", handleKeyDown, false);
      window.removeEventListener("scroll", updatePosition, false);
      window.removeEventListener("resize", updatePosition, false);
    };
  }, []);

  const setMaxOrcaTravelDistance = () => {
    if (window.matchMedia(`screen and (max-width: ${SMALL_SCREEN_WIDTH}px)`).matches) {
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
    // Any real mouse movement disables autopilot
    autopilotOn = false;
    mouseX = event.clientX - canvasPosition.x;
    mouseY = event.clientY - canvasPosition.y;
  };

  const setTouchPosition = (event: TouchEvent) => {
    // Touch move also disables autopilot
    autopilotOn = false;
    mouseX = event.targetTouches[0].clientX - canvasPosition.x;
    mouseY = event.targetTouches[0].clientY - canvasPosition.y;
  };

  const handlePointerEnter = () => {
    // Back under user control when pointer is over the canvas
    autopilotOn = false;
    autoNextSpinMs = null;
  };

  const handlePointerLeave = () => {
    // Enable roaming when pointer leaves the canvas
    autopilotOn = true;
    startNewAutopilotRoutine();
  };

  const handleTouchStart = () => {
    autopilotOn = false;
    autoNextSpinMs = null;
  };

  const handleTouchEnd = () => {
    autopilotOn = true;
    startNewAutopilotRoutine();
  };

  const handleClick = () => {
    // Start or restart the cascading roll
    isRolling = true;
    rollClockMs = 0;
  };

  function animate(ctx: CanvasRenderingContext2D) {
    const now = performance.now();
    const delta = now - previousTime;
    previousTime = now;
    accumulatorMs += delta;

    let didUpdate = false;

    while (accumulatorMs >= FPS_INTERVAL) {
      // fixed update step
      // If autopilot is active, update the virtual target (mouseX/mouseY)
      if (autopilotOn) {
        updateAutopilot(FPS_INTERVAL);
      }

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
      // Update cascading barrel roll timer
      if (isRolling) {
        const layers = orcaLayers.length || 0;
        const totalLayers = layers > 0 ? layers : 44;
        const totalRollDuration =
          ROLL_TOTAL_MS + (totalLayers - 1) * CASCADE_DELAY_PER_LAYER_MS;
        rollClockMs += Math.min(FPS_INTERVAL, totalRollDuration - rollClockMs);
        if (rollClockMs >= totalRollDuration) {
          // End of cascade
          isRolling = false;
          rollClockMs = 0;
        }
      }
  // Advance idle clock continually
  idleClockMs = (idleClockMs + FPS_INTERVAL) % IDLE_PERIOD_MS;
      didUpdate = true;
    }

    if (didUpdate) {
      // Respect theme background via CSS variable set on body/html by next-themes
      const bg = getComputedStyle(document.body).getPropertyValue("--bg").trim() || "white";
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.current!.width, canvas.current!.height);

      renderOrca(ctx);
    }

    requestAnimationFrame(() => animate(ctx));
  }

  const easeInOutSine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  const renderOrca = (ctx: CanvasRenderingContext2D) => {
    orcas.forEach((orca) => {
      orca.layerPositions.forEach((position, index) => {
        const source = orcaLayers[index].img;
        const imageWidth = source.width;
        const imageHeight = source.height;

        // Compute per-layer rotation for roll (head starts first, tail follows)
        const totalLayers = orcaLayers.length || 44;
        const headFirstIndex = totalLayers - 1 - index; // 0=head, bigger=closer to tail
        const startDelayMs = headFirstIndex * CASCADE_DELAY_PER_LAYER_MS;
        let rollAngle = 0;
        if (isRolling) {
          const tLocal = rollClockMs - startDelayMs;
          if (tLocal > 0) {
            const progress = Math.min(1, tLocal / ROLL_TOTAL_MS);
            const eased = easeInOutSine(progress);
            rollAngle = eased * (2 * Math.PI) * ROLL_TURNS;
          }
        }

        // Idle bob/tilt: active mostly when the orca is near its target
        const targetX = mouseX - orca.mouseOffset.x;
        const targetY = mouseY - orca.mouseOffset.y;
        const dist = Math.hypot(targetX - orca.orca.x, targetY - orca.orca.y);
        const idleStrength = clamp01(1 - dist / IDLE_DISTANCE_THRESHOLD);
        const phasedClock = idleClockMs + index * IDLE_LAYER_PHASE_MS;
        const theta = (2 * Math.PI * (phasedClock % IDLE_PERIOD_MS)) / IDLE_PERIOD_MS;
        const bobOffsetY = IDLE_BOB_AMPLITUDE * idleStrength * Math.sin(theta);
        const idleTilt = IDLE_TILT_AMPLITUDE * idleStrength * Math.sin(theta + Math.PI / 6);

        // Apply rotation around each segment's center to create a barrel roll effect
        ctx.save();
        ctx.translate(position.x, position.y + bobOffsetY);
        const totalAngle = (isRolling ? rollAngle : 0) + (!isRolling ? idleTilt : 0);
        if (totalAngle !== 0) ctx.rotate(totalAngle);
        // Translate so that the image is centered relative to the position without unary negation
        ctx.translate(0 - imageWidth / ORCA_X_MIDDLE, 0 - imageHeight / ORCA_Y_MIDDLE);
        ctx.drawImage(source, 0, 0, imageWidth, imageHeight);
        ctx.restore();
      });
    });
  };

  // --- Autopilot helpers ---
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;
  const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

  const withCanvasMargins = (m = 40) => ({
    minX: m,
    maxX: canvas.current ? canvas.current.width - m : window.innerWidth - m,
    minY: m,
    maxY: canvas.current ? canvas.current.height - m : window.innerHeight - m,
  });

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const choose = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const cubicBezier = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    return {
      x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
    };
  };

  const startNewAutopilotRoutine = () => {
    const { minX, maxX, minY, maxY } = withCanvasMargins(80);
    const current: Point = { x: mouseX, y: mouseY };
    autoClockMs = 0;
    autoNextSpinMs = null;

    // Weight modes: prefer arcs and beziers; sometimes idle
    autoMode = choose(["arc", "bezier", "arc", "bezier", "idle"]);

    if (autoMode === "arc") {
      const cx = rand(minX, maxX);
      const cy = rand(minY, maxY);
      const maxR = Math.min(cx - minX, maxX - cx, cy - minY, maxY - cy);
      arcR = clamp(rand(80, 220), 40, Math.max(60, maxR));
      arcCx = cx;
      arcCy = cy;
      arcStartAngle = Math.atan2(current.y - cy, current.x - cx);
      arcAngularVel = rand(0.25, 0.6) / 1000; // rad/ms
      arcDir = Math.random() < 0.5 ? -1 : 1;
      autoDurationMs = randInt(3500, 9000);
    } else if (autoMode === "bezier") {
      const p0 = current;
      const p3 = { x: rand(minX, maxX), y: rand(minY, maxY) };
      const dx = p3.x - p0.x;
      const dy = p3.y - p0.y;
      // Control points roughly orthogonal for a nice curve
      const c1 = { x: p0.x + dx * 0.3 + rand(-120, 120), y: p0.y + dy * 0.3 + rand(-120, 120) };
      const c2 = { x: p0.x + dx * 0.7 + rand(-120, 120), y: p0.y + dy * 0.7 + rand(-120, 120) };
      bzP0 = p0;
      bzP1 = c1;
      bzP2 = c2;
      bzP3 = p3;
      autoDurationMs = randInt(3000, 6000);
    } else {
      // idle: small circle/ellipse around current
      arcCx = current.x;
      arcCy = current.y;
      arcR = rand(10, 28);
      arcStartAngle = rand(0, Math.PI * 2);
      arcAngularVel = rand(0.15, 0.35) / 1000;
      arcDir = Math.random() < 0.5 ? -1 : 1;
      autoDurationMs = randInt(2000, 4500);
    }

    // 25% chance to trigger a spin sometime mid-routine
    if (Math.random() < 0.25) {
      autoNextSpinMs = randInt(Math.floor(autoDurationMs * 0.25), Math.floor(autoDurationMs * 0.8));
    }
  };

  const updateAutopilot = (dtMs: number) => {
    if (!canvas.current) return;
    if (autoClockMs === 0 && (!autoMode || !["arc", "bezier", "idle"].includes(autoMode))) {
      startNewAutopilotRoutine();
    }

    autoClockMs += dtMs;

    if (autoNextSpinMs !== null && autoClockMs >= autoNextSpinMs) {
      // Trigger a roll and clear the spin schedule for this routine
      isRolling = true;
      rollClockMs = 0;
      autoNextSpinMs = null;
    }

    let target: Point = { x: mouseX, y: mouseY };

    if (autoMode === "arc" || autoMode === "idle") {
      const angle = arcStartAngle + arcDir * arcAngularVel * autoClockMs;
      target = { x: arcCx + arcR * Math.cos(angle), y: arcCy + arcR * Math.sin(angle) };
    } else if (autoMode === "bezier") {
      const t = clamp01(autoClockMs / autoDurationMs);
      const eased = easeInOutSine(t);
      target = cubicBezier(bzP0, bzP1, bzP2, bzP3, eased);
    }

    // Keep target within canvas bounds with small margins
    const { minX, maxX, minY, maxY } = withCanvasMargins(20);
    mouseX = clamp(target.x, minX, maxX);
    mouseY = clamp(target.y, minY, maxY);

    if (autoClockMs >= autoDurationMs) {
      startNewAutopilotRoutine();
    }
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
