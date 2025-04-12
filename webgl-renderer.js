/**
 * WebGL Renderer for Snake Game
 * Provides basic shape drawing functions using WebGL
 */

class WebGLRenderer {
   constructor(canvas) {
      this.canvas = canvas;
      this.gl =
         canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

      if (!this.gl) {
         console.error("WebGL not supported, falling back to Canvas 2D");
         return;
      }

      // Initialize shaders
      this.initShaders();

      // Set clear color
      this.gl.clearColor(0.133, 0.133, 0.133, 1.0); // #222222

      // Enable alpha blending
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
   }

   initShaders() {
      // Vertex shader program
      const vsSource = `
            attribute vec4 aVertexPosition;
            uniform vec2 uResolution;
            
            void main() {
                // Convert from pixels to clip space
                vec2 clipSpace = (aVertexPosition.xy / uResolution) * 2.0 - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            }
        `;

      // Fragment shader program
      const fsSource = `
            precision mediump float;
            uniform vec4 uColor;
            
            void main() {
                gl_FragColor = uColor;
            }
        `;

      // Create the shader program
      const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
      const fragmentShader = this.compileShader(
         this.gl.FRAGMENT_SHADER,
         fsSource
      );

      this.shaderProgram = this.gl.createProgram();
      this.gl.attachShader(this.shaderProgram, vertexShader);
      this.gl.attachShader(this.shaderProgram, fragmentShader);
      this.gl.linkProgram(this.shaderProgram);

      if (
         !this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)
      ) {
         console.error(
            "Unable to initialize the shader program: " +
               this.gl.getProgramInfoLog(this.shaderProgram)
         );
         return;
      }

      // Get the attribute and uniform locations
      this.programInfo = {
         program: this.shaderProgram,
         attribLocations: {
            vertexPosition: this.gl.getAttribLocation(
               this.shaderProgram,
               "aVertexPosition"
            ),
         },
         uniformLocations: {
            resolution: this.gl.getUniformLocation(
               this.shaderProgram,
               "uResolution"
            ),
            color: this.gl.getUniformLocation(this.shaderProgram, "uColor"),
         },
      };
   }

   compileShader(type, source) {
      const shader = this.gl.createShader(type);
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);

      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
         console.error(
            "An error occurred compiling the shaders: " +
               this.gl.getShaderInfoLog(shader)
         );
         this.gl.deleteShader(shader);
         return null;
      }

      return shader;
   }

   clear() {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
   }

   // Convert color from hex to normalized rgba
   colorToRGBA(color) {
      if (color.startsWith("#")) {
         const r = parseInt(color.slice(1, 3), 16) / 255;
         const g = parseInt(color.slice(3, 5), 16) / 255;
         const b = parseInt(color.slice(5, 7), 16) / 255;
         return [r, g, b, 1.0];
      }
      return [0, 0, 0, 1.0]; // Default black
   }

   // Draw a filled rectangle
   fillRect(x, y, width, height, color) {
      const rgba = this.colorToRGBA(color);

      // Create buffer and bind it
      const positionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

      // Define vertices for the rectangle
      const positions = [
         x,
         y,
         x + width,
         y,
         x,
         y + height,
         x + width,
         y + height,
      ];

      // Pass the positions to WebGL
      this.gl.bufferData(
         this.gl.ARRAY_BUFFER,
         new Float32Array(positions),
         this.gl.STATIC_DRAW
      );

      // Use the shader program
      this.gl.useProgram(this.programInfo.program);

      // Set the attributes and uniforms
      this.gl.enableVertexAttribArray(
         this.programInfo.attribLocations.vertexPosition
      );
      this.gl.vertexAttribPointer(
         this.programInfo.attribLocations.vertexPosition,
         2, // 2 components per vertex
         this.gl.FLOAT,
         false,
         0,
         0
      );

      // Set the resolution
      this.gl.uniform2f(
         this.programInfo.uniformLocations.resolution,
         this.canvas.width,
         this.canvas.height
      );

      // Set the color
      this.gl.uniform4fv(this.programInfo.uniformLocations.color, rgba);

      // Draw the rectangle
      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

      // Clean up
      this.gl.disableVertexAttribArray(
         this.programInfo.attribLocations.vertexPosition
      );
      this.gl.deleteBuffer(positionBuffer);
   }

   // Draw a rounded rectangle
   fillRoundRect(x, y, width, height, radius, color) {
      // For simplicity, we'll draw a regular rectangle for now
      // In a more complete implementation, we would create a more complex shape with rounded corners
      this.fillRect(x, y, width, height, color);
   }

   // Draw a circle
   fillCircle(x, y, radius, color) {
      const rgba = this.colorToRGBA(color);

      // Create buffer and bind it
      const positionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

      // Define vertices for the circle
      const segments = 30; // Number of segments to approximate the circle
      const positions = [x, y]; // Center point

      for (let i = 0; i <= segments; i++) {
         const theta = (i / segments) * Math.PI * 2;
         positions.push(
            x + radius * Math.cos(theta),
            y + radius * Math.sin(theta)
         );
      }

      // Pass the positions to WebGL
      this.gl.bufferData(
         this.gl.ARRAY_BUFFER,
         new Float32Array(positions),
         this.gl.STATIC_DRAW
      );

      // Use the shader program
      this.gl.useProgram(this.programInfo.program);

      // Set the attributes and uniforms
      this.gl.enableVertexAttribArray(
         this.programInfo.attribLocations.vertexPosition
      );
      this.gl.vertexAttribPointer(
         this.programInfo.attribLocations.vertexPosition,
         2, // 2 components per vertex
         this.gl.FLOAT,
         false,
         0,
         0
      );

      // Set the resolution
      this.gl.uniform2f(
         this.programInfo.uniformLocations.resolution,
         this.canvas.width,
         this.canvas.height
      );

      // Set the color
      this.gl.uniform4fv(this.programInfo.uniformLocations.color, rgba);

      // Draw the circle as a triangle fan
      this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, segments + 2);

      // Clean up
      this.gl.disableVertexAttribArray(
         this.programInfo.attribLocations.vertexPosition
      );
      this.gl.deleteBuffer(positionBuffer);
   }

   // Draw a line
   drawLine(x1, y1, x2, y2, width, color) {
      const rgba = this.colorToRGBA(color);

      // Create buffer and bind it
      const positionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

      // Define vertices for the line
      const positions = [x1, y1, x2, y2];

      // Pass the positions to WebGL
      this.gl.bufferData(
         this.gl.ARRAY_BUFFER,
         new Float32Array(positions),
         this.gl.STATIC_DRAW
      );

      // Use the shader program
      this.gl.useProgram(this.programInfo.program);

      // Set the attributes and uniforms
      this.gl.enableVertexAttribArray(
         this.programInfo.attribLocations.vertexPosition
      );
      this.gl.vertexAttribPointer(
         this.programInfo.attribLocations.vertexPosition,
         2, // 2 components per vertex
         this.gl.FLOAT,
         false,
         0,
         0
      );

      // Set the resolution
      this.gl.uniform2f(
         this.programInfo.uniformLocations.resolution,
         this.canvas.width,
         this.canvas.height
      );

      // Set the color
      this.gl.uniform4fv(this.programInfo.uniformLocations.color, rgba);

      // Set line width
      this.gl.lineWidth(width);

      // Draw the line
      this.gl.drawArrays(this.gl.LINES, 0, 2);

      // Clean up
      this.gl.disableVertexAttribArray(
         this.programInfo.attribLocations.vertexPosition
      );
      this.gl.deleteBuffer(positionBuffer);
   }
}
