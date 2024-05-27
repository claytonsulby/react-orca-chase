import { useEffect, useRef } from 'react'
import { Helmet } from "react-helmet";

import { loadOrcaLayers, sortOrcaLayersTailFirst } from './orcaActions';
import { 
  BORDER_WIDTH,
  ORCA_SCALE,
  ORCA_X_DEACCELERATION,
  ORCA_X_MIDDLE,
  ORCA_Y_DEACCELERATION,
  ORCA_Y_MIDDLE
} from './constants';
import './App.css'

function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const canvasPosition = { x: 0, y: 0 };
  const mousePositions: Point[] = [...Array(44).keys()]
    .map(() => {
      return { x: 0, y: 0 }
    });

  let orcaLayers: OrcaLayer[] = [];

  let mouseX = 0;
  let mouseY = 0;
  let orcaXPos = 0;
  let orcaYPos = 0;
  let xDelta = 0;
  let yDelta = 0;

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
    window.addEventListener("scroll", updatePosition, false);
    window.addEventListener("resize", updatePosition, false);

    loadOrcaLayers()
      .then(layers => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        orcaLayers = layers;
        sortOrcaLayersTailFirst(orcaLayers);
        animate(ctx);
      })
      .catch(() => {
        alert("Failed to load orca :(\nPlease reload the site!")
      })
  }, []);

  const setupPositionData = () => {
    const sizeWidth = canvasSize().x;
    const sizeHeight = canvasSize().y;

    // Start by rendering the orca in the middle of the screen
    mousePositions.fill({ x: sizeWidth / 2, y: sizeHeight / 2 });

    mouseX = sizeWidth / 2;
    mouseY = sizeHeight / 2;
    orcaXPos = sizeWidth / 2;
    orcaYPos =  sizeHeight / 2;
  }

  function setMousePosition(event: MouseEvent) {
    mouseX = event.clientX - canvasPosition.x;
    mouseY = event.clientY - canvasPosition.y;
  }

  function updatePosition() {
    canvas.current!.width = canvasSize().x;
    canvas.current!.height = canvasSize().y;
  }

  const canvasSize = (): Point => {
    return {
      x: document.body.clientWidth - BORDER_WIDTH * 2,
      y: document.body.clientHeight - BORDER_WIDTH * 2
    }
  }

  function animate(ctx: CanvasRenderingContext2D) {
    xDelta = mouseX - orcaXPos;
    yDelta = mouseY - orcaYPos;

    const distanceToMoveX = ORCA_X_DEACCELERATION;
    const distanceToMoveY = ORCA_Y_DEACCELERATION;
   
    // For the orca to go straight to the mouse we increment by the delta.
    // For the orca to incrementally go toward the mouse we increment by a fraction of the delta.
    orcaXPos += (xDelta / distanceToMoveX);
    orcaYPos += (yDelta / distanceToMoveY);
    
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.current!.width, canvas.current!.height);

    mousePositions.push({ x: orcaXPos, y: orcaYPos });
    mousePositions.shift();

    renderOrca(ctx);
   
    requestAnimationFrame(() => animate(ctx));
  }

  const renderOrca = (ctx: CanvasRenderingContext2D) => {
    orcaLayers.forEach((layer, index) => {
      const imageWidth = layer.img.naturalWidth * ORCA_SCALE;
      const imageHeight = layer.img.naturalHeight * ORCA_SCALE;

      ctx.drawImage(layer.img,
        mousePositions[index].x - imageWidth / ORCA_X_MIDDLE,
        mousePositions[index].y - imageHeight / ORCA_Y_MIDDLE,
        imageWidth,
        imageHeight
      );
    })
  }

  return (
    <>
      <Helmet>
        <script 
          defer
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          src={import.meta.env.VITE_UMAMI_WEBSITE_URL}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data-website-id={import.meta.env.VITE_UMAMI_WEBSITE_ID}>
        </script>
      </Helmet>
      
      <canvas id="canvas" ref={canvas}>
        Canvas not supported. Please use a more modern different browser.
      </canvas>
    </>
  )
}

export default App
