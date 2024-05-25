import { useEffect } from 'react'

import './App.css'

function App() {
  const orcaImageUrls = [...Array(45).keys()]
    .map(x => ++x)
    .map(x => "/orca/"+x+"-removebg-preview.png");
  const orcaImages: {img: HTMLImageElement, id: number}[] = [];

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  const SCALE = 1;

  let canvasPos;
  var mouseX = 0;
  var mouseY = 0;
  var xPos = 0;
  var yPos = 0;
  var dX = 0;
  var dY = 0;

  useEffect(() => {
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    ctx = canvas?.getContext("2d")!;
    
    if (!ctx) {
      alert("An error has occured :( \nPlease reload the site!")
    }

    var sizeWidth = 100 * window.innerWidth / 100;
    var sizeHeight = 100 * window.innerHeight / 100 || 766;

    //Setting the canvas site and width to be responsive 
    canvas.width = sizeWidth;
    canvas.height = sizeHeight;
    
    canvasPos = getPosition(canvas);

      
    loadOrcaImages(ctx, canvas as HTMLCanvasElement);

    canvas.addEventListener("mousemove", setMousePosition, false);

    window.addEventListener("scroll", updatePosition, false);
    window.addEventListener("resize", updatePosition, false);

    animate();
  }, []);

  function animate() {
    dX = mouseX - xPos;
    dY = mouseY - yPos;
   
    xPos += (dX / 40);
    yPos += (dY / 40);
 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
   
    ctx.fillStyle = "white";
    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    renderOrcaPos(ctx, xPos, yPos);
   
    requestAnimationFrame(animate);
  }

  function getPosition(el) {
    var xPos = 0;
    var yPos = 0;
   
    while (el) {
      if (el.tagName == "BODY") {
        // deal with browser quirks with body/window/document and page scroll
        var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
        var yScroll = el.scrollTop || document.documentElement.scrollTop;
   
        xPos += (el.offsetLeft - xScroll + el.clientLeft);
        yPos += (el.offsetTop - yScroll + el.clientTop);
      } else {
        // for all other non-BODY elements
        xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
        yPos += (el.offsetTop - el.scrollTop + el.clientTop);
      }
   
      el = el.offsetParent;
    }
    return {
      x: xPos,
      y: yPos
    };
  }

  const loadOrcaImages = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
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
      const imageWidth = orcaImage.img.naturalWidth * SCALE;
      const imageHeight = orcaImage.img.naturalHeight * SCALE;
      ctx.drawImage(orcaImage.img,
        x - imageWidth / 2,
        y - imageHeight / 2,
        imageWidth,
        imageHeight
      );
    })
  }
 
  function setMousePosition(e: MouseEvent) {
    mouseX = e.clientX - canvasPos.x;
    mouseY = e.clientY - canvasPos.y; 
  }

  function updatePosition() {
    canvasPos = getPosition(canvas);
  }

  return (
    <>
      <canvas id="canvas"></canvas>
    </>
  )
}

export default App
