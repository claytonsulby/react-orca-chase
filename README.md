# 🐋 [orca-chase](https://orcachase.com/)
A website where a orca follows your mouse

![](https://img.shields.io/github/actions/workflow/status/hiccup246/jameswatt/style-check.yml?branch=main&label=Style%20Check)

![](https://img.shields.io/github/license/Hiccup246/jameswatt)
![](https://img.shields.io/github/languages/code-size/Hiccup246/jameswatt)


## Installation + Usage
1. Install node version found in `.nvmrc`
2. Install dependancies with `npm install`
3. Run the project with `npm run dev`

### Other Commands
- Lint project with `npm run lint`
- Fix linting issues with `npm run lint -- --fix`
- Type check with `npm run tsc`

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
