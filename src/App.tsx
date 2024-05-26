import { useEffect, useRef, useState } from 'react'

import './App.css'

type Point = {
  x: number;
  y: number;
}

const ORCA_SCALE = 1;
const ORCA_X_DEACCELERATION = 40;
const ORCA_Y_DEACCELERATION = 40;
const ORCA_X_MIDDLE = 2;
const ORCA_Y_MIDDLE = 1.7;
const BORDER_WIDTH = 2;

// https://www.kirupa.com/canvas/mouse_follow_ease.htm
function App() {
  const orcaImageUrls = [...Array(45).keys()]
    .map(x => ++x)
    .map(x => "/orca/" + x + ".png");
  const orcaImages: {img: HTMLImageElement, id: number}[] = [];

  const canvas = useRef<HTMLCanvasElement>(null);
  const [canvasPosition, setCanvasPosition] = useState<Point>({x: 0, y: 0});

  let mouseX = 0;
  let mouseY = 0;
  let orcaXPos = 0;
  let orcaYPos = 0;
  let xDelta = 0;
  let yDelta = 0;

  const mousePositions: Point[] = [...Array(45)];

  useEffect(() => {    
    if (!canvas.current) {
      alert("An error has occured :( \nPlease reload the site!");

      return;
    }

    const ctx = canvas.current.getContext("2d");

    if (!ctx) {
      alert("An error has occured :( \nPlease reload the site!");

      return;
    }

    const sizeWidth = canvasSize().x;
    const sizeHeight = canvasSize().y;

    canvas.current.width = sizeWidth;
    canvas.current.height = sizeHeight;

    // Start by rendering the whale in the middle of the screen
    mousePositions.fill({x: sizeWidth / 2, y: sizeHeight / 2});

    mouseX = sizeWidth / 2;
    mouseY = sizeHeight / 2;
    orcaXPos = sizeWidth / 2;
    orcaYPos =  sizeHeight / 2;

    setCanvasPosition(getPosition());
    
    canvas.current!.addEventListener("mousemove", setMousePosition, false);
    // window.addEventListener("scroll", updatePosition, false);
    window.addEventListener("resize", updatePosition, false);

    animate(ctx);
  }, []);

  function animate(ctx: CanvasRenderingContext2D) {
    xDelta = mouseX - orcaXPos;
    yDelta = mouseY - orcaYPos;

    // const distance = Math.sqrt(((xDelta*xDelta) + (yDelta*yDelta)))

    // The list is the last 44 places the mouse was. Here, it calculates the distance
    // to its assigned spot (layer 3 to x 3, etc.) If the distance is greater than 15,
    // it moves 7 steps. If it's between 15 and 1, it moves 1/3 of the distance to its point.
    // And if the distance is 1 it goes straight to its point.
    const distanceToMoveX = ORCA_X_DEACCELERATION;
    const distanceToMoveY = ORCA_Y_DEACCELERATION;

    // if (distance >= 15) {
    //   distanceToMoveX = 0.07;
    //   distanceToMoveY = 0.07;
    // } else if (distance > 1 && distance < 15) {
    //   distanceToMoveX = 0.3333333;
    //   distanceToMoveY = 0.3333333;
    // } else {
    //   distanceToMoveX = 1;
    //   distanceToMoveY = 1; 
    // }
   
    // For the orca to go straigh to the mouse we would increment by the delta.
    // For the orca to incrementally go toward the mouse we move by a fraction of the total distance.
    // In this case the orca moves by an increment of OCRA_X_DEACCELERATION
    orcaXPos += (xDelta / distanceToMoveX);
    orcaYPos += (yDelta / distanceToMoveY);
    
    ctx!.fillStyle = "white";
    ctx!.fillRect(
      0,
      0,
      canvas.current!.width,
      canvas.current!.height
    );

    mousePositions.push({x: orcaXPos, y: orcaYPos});
    mousePositions.shift();

    renderOrcaPos(ctx);
   
    requestAnimationFrame(() => animate(ctx));
  }

  function getPosition(): Point{
    const xPos = 0;
    const yPos = 0;

    return {
      x: xPos,
      y: yPos
    };
  }

  const loadOrcaImages = () => {
    orcaImageUrls.forEach(url => {
      const image = new Image();
      
      image.src = url;
  
      // Orca images are named 1.png - 44.png etc from the nose to the tail of the orca
      const imageLayer = url.split(".")[0];

      image.onload = (event: Event) => {
        orcaImages.push({
          img: event.target as HTMLImageElement,
          id: Number.parseInt(imageLayer)
        })

        const allImagesLoaded = orcaImages.length == orcaImageUrls.length - 1;

        if (allImagesLoaded) {
          sortOrcaImagesNoseFirst();
        }
      }
    })
  }

  const sortOrcaImagesNoseFirst = () => {
    orcaImages.sort((a, b) => {
      if (a.id > b.id) {
        return 1
      } else {
        return -1;
      }
    });
  }

  // This method is called 60 times a second and renders the entire orca. Currently
  // the entire orca travels toward the mouse in small increments. What we want is for the
  // the different layers of the orca to move one at a time with a slight delay

  // Possible approaches
  // 1. Array of 44 items for each layer where each layer renders at that position
  // and the incremental updates stagger throughout the array
  // 2. Store last 44 positions of the mouse and render each layer at that position?
  // 3. Set an interval and render each layer on a 250ms delay
  const renderOrcaPos = (ctx: CanvasRenderingContext2D) => {
    orcaImages.forEach((orcaImage, index) => {
      const imageWidth = orcaImage.img.naturalWidth * ORCA_SCALE;
      const imageHeight = orcaImage.img.naturalHeight * ORCA_SCALE;

      ctx.drawImage(orcaImage.img,
        mousePositions[index].x - imageWidth / ORCA_X_MIDDLE,
        mousePositions[index].y - imageHeight / ORCA_Y_MIDDLE,
        imageWidth,
        imageHeight
      );
    })
  }
 
  function setMousePosition(event: MouseEvent) {
    mouseX = event.clientX - canvasPosition.x;
    mouseY = event.clientY - canvasPosition.y;
  }

  function updatePosition() {
    setCanvasPosition(getPosition());

    canvas.current!.width = canvasSize().x;
    canvas.current!.height = canvasSize().y;
  }

  const canvasSize = (): Point => {
    return {
      x: document.body.clientWidth - BORDER_WIDTH * 2,
      y: document.body.clientHeight - BORDER_WIDTH * 2
    }
  }

  loadOrcaImages();

  return (
    <>
      <canvas id="canvas" ref={canvas}></canvas>
    </>
  )
}

export default App
