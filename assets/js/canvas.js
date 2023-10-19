import { fragCodeA, fragCodeB } from "./shaders";
// Much of this code is from https://github.com/adam-james-v/sdfx/blob/main/resources/render.js
// MIT License
// Copyright (c) 2023 adam-james

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// Define vertices for a quad. This quad is what the fragment shader result is rendered to
const QUAD = new Float32Array([
  -1.0,
  1.0, // Vertex 1
  -1.0,
  -1.0, // Vertex 2
  1.0,
  1.0, // Vertex 3
  1.0,
  1.0, // Vertex 4 (repeat Vertex 3)
  -1.0,
  -1.0, // Vertex 5 (repeat Vertex 2)
  1.0,
  -1.0, // Vertex 6
]);

const Canvas = {
  mounted() {
    this.rotationAngleZ = 0.0; // in radians
    this.rotationAngleScreenX = 0.0;
    this.translationX = 0.0;
    this.translationY = 0.0;
    this.zoom = 1.0;
    this.mouseDown = false;
    this.ctrlDown = false;
    this.lastMouseX = null;
    this.lastMouseY = null;

    this.animation = null;
    this.shaderProgram = null;
    this.fragmentShader = null;
    this.vertexShader = null;
    this.vertexBuffer = null;

    this.initContext();
    this.initialize();

    this.draw();
  },
  updated() {
    this.redraw();
  },

  redraw() {
    cancelAnimationFrame(this.animation);
    this.initialize();
    this.draw();
  },

  draw() {
    let gl = this.gl;
    let shaderProgram = this.shaderProgram;
    let canvas = this.el;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shaderProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    const position = gl.getAttribLocation(shaderProgram, "coordinates");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const iResolutionUniformLocation = gl.getUniformLocation(
      shaderProgram,
      "iResolution",
    );
    gl.uniform2f(iResolutionUniformLocation, canvas.width, canvas.height);

    // Get the position attribute location
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    // Get the rotation, translation, and zoom uniforms location and set their values
    const rotationAngleZUniformLocation = gl.getUniformLocation(
      shaderProgram,
      "u_rotationAngleZ",
    );
    gl.uniform1f(rotationAngleZUniformLocation, this.rotationAngleZ);
    const rotationAngleScreenXUniformLocation = gl.getUniformLocation(
      shaderProgram,
      "u_rotationAngleScreenX",
    );
    gl.uniform1f(
      rotationAngleScreenXUniformLocation,
      this.rotationAngleScreenX,
    );
    const translationXUniformLocation = gl.getUniformLocation(
      shaderProgram,
      "u_translationX",
    );
    gl.uniform1f(translationXUniformLocation, this.translationX);
    const translationYUniformLocation = gl.getUniformLocation(
      shaderProgram,
      "u_translationY",
    );
    gl.uniform1f(translationYUniformLocation, this.translationY);
    const zoomUniformLocation = gl.getUniformLocation(shaderProgram, "u_zoom");
    gl.uniform1f(zoomUniformLocation, this.zoom);

    // Get the aspect ratio uniform location and set its value
    const aspectRatioUniform = gl.getUniformLocation(
      shaderProgram,
      "aspectRatio",
    );
    gl.uniform1f(aspectRatioUniform, canvas.width / canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    this.animation = requestAnimationFrame(() => this.draw());
  },

  createShader(type, source) {
    let gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(
        "An error occurred compiling the shaders:",
        gl.getShaderInfoLog(shader),
      );
      this.pushEvent("error", { error: gl.getShaderInfoLog(shader) });
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  },

  initialize() {
    let gl = this.gl;
    // If shaderProgram already exists, delete the old program and shaders
    if (this.shaderProgram) {
      gl.deleteProgram(this.shaderProgram);
      this.shaderProgram = null;
    }

    // Create shader program
    this.shaderProgram = gl.createProgram();

    // Create a new vertex buffer if it doesn't exist
    if (!this.vertexBuffer) {
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
    }

    // Define vertex shader with aspect ratio adjustment
    const vertexShaderSource = `#version 300 es
      in vec2 coordinates;
      uniform float aspectRatio;
      void main() {
        gl_Position = vec4(coordinates.x, coordinates.y * aspectRatio, 0.0, 1.0);
      }`;
    const vertexShader = this.createShader(
      gl.VERTEX_SHADER,
      vertexShaderSource,
    );

    // Define fragment shader using source from div
    // let sdfSrcDiv = document.querySelector("#sdf-src");
    let src = this.el.dataset.sdf;
    let { colors, outlines } = this.el.dataset;
    if (src == null || src == "") return;
    let sdfCode = `bool normalCols = ${colors == "normals"};
    bool contourCols = ${colors == "contours"};
    bool outlines = ${outlines};
    float mySdf (in vec3 p) {
      return ${src};
    }
    `;
    let fragCode = `${fragCodeA}${sdfCode}${fragCodeB}`;
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragCode);
    if (fragmentShader == null) return;

    // Attach and link shaders to the program
    gl.attachShader(this.shaderProgram, vertexShader);
    gl.attachShader(this.shaderProgram, fragmentShader);
    gl.linkProgram(this.shaderProgram);

    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
      console.error(
        "Unable to initialize the shader program:",
        gl.getProgramInfoLog(this.shaderProgram),
      );
      return;
    }

    // After linking the shaders to the program, they can be safely deleted.
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    gl.useProgram(this.shaderProgram);
  },

  initContext() {
    let canvas = this.el;
    this.gl = gl = canvas.getContext("webgl2", {
      preserveDrawingBuffer: true,
    });

    if (!gl) {
      alert("WebGL is not available on your browser.");
      return;
    }
    this.ext = gl.getExtension("WEBGL_lose_context");

    // Mouse and Keyboard Events for controlling the SDF render
    window.addEventListener("keydown", (event) => {
      if (event.key == "Shift") {
        this.ctrlDown = true;
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.key == "Shift") {
        this.ctrlDown = false;
      }
    });

    // Add event listeners
    canvas.addEventListener(
      "webglcontextlost",
      (e) => e.preventDefault(),
      false,
    );
    canvas.addEventListener(
      "webglcontextrestored",
      () => this.initContext(),
      false,
    );
    canvas.addEventListener("wheel", (e) => e.preventDefault(), false);
    canvas.addEventListener(
      "mousedown",
      (e) => {
        this.mouseDown = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      },
      false,
    );
    canvas.addEventListener(
      "mouseup",
      (e) => {
        this.mouseDown = false;
      },
      false,
    );
    canvas.addEventListener(
      "wheel",
      (e) => {
        const zoomAmount = e.deltaY * 0.01;
        this.zoom += zoomAmount;
      },
      false,
    );

    canvas.addEventListener(
      "mousemove",
      (e) => {
        if (!this.mouseDown) {
          return;
        }

        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;

        if (this.ctrlDown) {
          this.rotationAngleZ += deltaX * 0.5;
          this.rotationAngleScreenX += deltaY * 0.5;
        } else {
          this.translationX += deltaX * 0.005;
          this.translationY += deltaY * 0.005;
        }

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      },
      false,
    );
    window.addEventListener("unload", () => {
      let gl = this.gl;
      if (this.shaderProgram) {
        gl.deleteProgram(this.shaderProgram);
      }

      if (this.vertexBuffer) {
        gl.deleteBuffer(this.vertexBuffer);
      }
    });
  },
};

export default Canvas;
