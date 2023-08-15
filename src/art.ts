import createREGL from "regl";

// define a 16 colors palette
// https://lospec.com/palette-list/taffy-16
const palette = [
  [0x1a, 0x1c, 0x2c],
  [0x5d, 0x27, 0x5d],
  [0xb1, 0x3e, 0x53],
  [0xef, 0x7d, 0x57],
  [0xff, 0xcd, 0x75],
  [0xa7, 0xf0, 0x70],
  [0x38, 0xb7, 0x64],
  [0x25, 0x71, 0x79],
  [0x29, 0x36, 0x6f],
  [0x3b, 0x5d, 0xc9],
  [0x41, 0xa6, 0xf6],
  [0x73, 0xef, 0xf7],
  [0xf4, 0xf4, 0xf4],
  [0x94, 0xb0, 0xc2],
  [0x56, 0x6c, 0x86],
  [0x33, 0x3c, 0x57],
];

const bayerMatrix = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const canvas = document.querySelector("canvas")!;
export const regl = createREGL(canvas);

export const draw = regl({
  frag: `
      precision mediump float;
      #define PI 3.1415926538
      #define SIZE 16.0
      #define BAYER_SIZE 8.0
      varying vec2 uv;
      uniform sampler2D palette; // 16 colors
      uniform sampler2D bayer; // 8x8 bayer matrix
      uniform float time;
      
      void main () {
        float x = floor(uv.x * SIZE);
        float y = floor(-uv.y * SIZE);
        float t = time * 2.;
        float i = x * SIZE * 2. + y;

        float bayerValue = texture2D(bayer, vec2(
          mod(uv.x * 128., BAYER_SIZE) / BAYER_SIZE,
          mod(uv.y * 128., BAYER_SIZE) / BAYER_SIZE
        )).r / 4.;

        float value = mod((x/2.*y/2.+t) / 16. + bayerValue, 1.0);
        gl_FragColor = texture2D(palette, vec2(value, 0.0));
      }
    `,
  vert: `
      precision mediump float;
      attribute vec2 position;
      attribute vec2 uvs;
      varying vec2 uv;
      void main () {
        uv = uvs; // doing this just beacause i lack brain cells
        gl_Position = vec4(position, 0, 1);
      }
    `,
  attributes: {
    // quad vertex positions
    // we pass two triangles to draw a quad
    position: regl.prop("positions"),
    // uv coordinates
    uvs: [
      [-1, -1],
      [-1, 1],
      [1, 1],
      [-1, -1],
      [1, 1],
      [1, -1],
    ],
  },
  uniforms: {
    time: regl.context("time"),
    palette: regl.texture([palette]),
    bayer: regl.texture(bayerMatrix),
  },
  count: 6,
});
