import { Webgl } from "./webgl"

window.addEventListener('load', () => {
  const webgl = new Webgl();
  webgl.init();
  webgl.render();

  window.addEventListener('resize', () => {
    webgl.onResize();
  })
})