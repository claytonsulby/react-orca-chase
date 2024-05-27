# <img style="vertical-align: bottom" src="https://raw.githubusercontent.com/Hiccup246/orca-chase/main/public/orca.png" width="35" height="35" alt="site-screenshot"> [orca-chase](https://orcachase.com/)

A website where an orca follows your mouse

![](https://img.shields.io/github/actions/workflow/status/hiccup246/orca-chase/style-check.yml?branch=main&label=Style%20Check)
![](https://img.shields.io/github/license/Hiccup246/orca-chase)
![](https://img.shields.io/github/languages/code-size/Hiccup246/orca-chase)

![site-screenshot](https://raw.githubusercontent.com/Hiccup246/orca-chase/main/public/site-screenshot.webp)

## Installation + Usage

1. Install node version found in `.nvmrc`
2. Install dependencies with `npm install`
3. Run the project with `npm run dev`

### Other Commands

- Lint project with `npm run lint`
- Fix linting issues with `npm run lint -- --fix`
- Type check with `npm run tsc`

## How the orca is rendered

The orca is made up of 44 images found within `public/orca/`. Each image is numbered like `1.png` - `44.png` from nose to tail and represents a "layer" of the orca that you see.

The application renders these images starting from `44.png` to `1.png` onto a [HTML canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) and together they form the orca you see.

To make the orca move the application tracks the last 44 mouse positions, determines how far each layer should move toward the mouse, and re-renders the screen using [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame).

## Inspiration

Special thanks to [NickyNouse](https://scratch.mit.edu/users/NickyNouse/) whose original [whale game](https://scratch.mit.edu/projects/16795490/) on scratch inspired this project.
