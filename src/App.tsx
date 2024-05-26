import { useEffect } from 'react'

import './App.css'

type Point = {
  x: number;
  y: number;
}

const ORCA_SCALE = 1;
const ORCA_X_DEACCELERATION = 40;
const ORCA_Y_DEACCELERATION = 40;

// https://www.kirupa.com/canvas/mouse_follow_ease.htm
function App() {
  const orcaImageUrls = [...Array(45).keys()]
    .map(x => ++x)
    .map(x => "/orca/"+x+"-removebg-preview.png");
  const orcaImages: {img: HTMLImageElement, id: number}[] = [];

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  let canvasPosition: Point;
  let mouseX = 0;
  let mouseY = 0;
  let orcaXPos = 0;
  let orcaYPos = 0;
  let dX = 0;
  let dY = 0;

  useEffect(() => {
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    ctx = canvas?.getContext("2d")!;
    
    if (!ctx) {
      alert("An error has occured :( \nPlease reload the site!")
    }

    let sizeWidth = 100 * window.innerWidth / 100;
    let sizeHeight = 100 * window.innerHeight / 100 || 766;

    //Setting the canvas site and width to be responsive 
    canvas.width = sizeWidth;
    canvas.height = sizeHeight;
    
    canvasPosition = getPosition(canvas);

      
    loadOrcaImages();

    canvas.addEventListener("mousemove", setMousePosition, false);

    window.addEventListener("scroll", updatePosition, false);
    window.addEventListener("resize", updatePosition, false);

    animate();
  }, []);

  function animate() {
    dX = mouseX - orcaXPos;
    dY = mouseY - orcaYPos;
   
    orcaXPos += (dX / ORCA_X_DEACCELERATION);
    orcaYPos += (dY / ORCA_Y_DEACCELERATION);
 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
   
    ctx.fillStyle = "white";
    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    renderOrcaPos(ctx, orcaXPos, orcaYPos);
   
    requestAnimationFrame(animate);
  }

  function getPosition(canvasElement: HTMLCanvasElement): Point{
    let xPos = 0;
    let yPos = 0;
   
    while (canvasElement) {
      if (canvasElement.tagName == "BODY") {
        // deal with browser quirks with body/window/document and page scroll
        let xScroll = canvasElement.scrollLeft || document.documentElement.scrollLeft;
        let yScroll = canvasElement.scrollTop || document.documentElement.scrollTop;
   
        xPos += (canvasElement.offsetLeft - xScroll + canvasElement.clientLeft);
        yPos += (canvasElement.offsetTop - yScroll + canvasElement.clientTop);
      } else {
        // for all other non-BODY elements
        xPos += (canvasElement.offsetLeft - canvasElement.scrollLeft + canvasElement.clientLeft);
        yPos += (canvasElement.offsetTop - canvasElement.scrollTop + canvasElement.clientTop);
      }
   
      canvasElement = canvasElement.offsetParent as HTMLCanvasElement;
    }

    return {
      x: xPos,
      y: yPos
    };
  }

  const loadOrcaImages = () => {
    orcaImageUrls.forEach(url => {
      const image = new Image();
      
      image.src = url;
  
      image.onload = (ev: Event) => {
        orcaImages.push({img: ev.target as HTMLImageElement, id: Number.parseInt(url.split(".")[0].split("/")[2])})

        if (orcaImages.length == orcaImageUrls.length - 1) {
          orcaImages.sort((a, b) => {
            if (a.id > b.id) {
              return -1
            } else {
              return 1;
            }
          });
        }
      }
    })
  }

  const renderOrcaPos = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    orcaImages.forEach((orcaImage, index) => {
      const imageWidth = orcaImage.img.naturalWidth * ORCA_SCALE;
      const imageHeight = orcaImage.img.naturalHeight * ORCA_SCALE;
      ctx.drawImage(orcaImage.img,
        x - imageWidth / 2,
        y - imageHeight / 2,
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
    canvasPosition = getPosition(canvas);
  }

  return (
    <>
      <canvas id="canvas"></canvas>
    </>
  )
}

export default App
