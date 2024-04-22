import texture1 from '../img/texture1.jpg'

export const PARAMS = {
  WINDOW: {
    W: window.innerWidth,
    H: window.innerHeight,
    PIXEL_RATIO: window.devicePixelRatio,
  },
  CAMERA: {
    FOV: 60,
    ASPECT: window.innerWidth / window.innerHeight,
    NEAR: 1,
    FAR: 1000,
    POSITION: {
      X: 0,
      Y: 0,
      Z: 3,
    },
  },
  PLANE_GEOMETRY: {
    X: 1,
    Y: 1,
    X_SEGMENTS: 1,
    Y_SEGMENTS: 1,
  },
  TEXTURE: [ texture1, ]
};
