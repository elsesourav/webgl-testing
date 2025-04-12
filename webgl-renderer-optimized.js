/**
 * Optimized WebGL Renderer for Particle Simulation
 * Uses instanced rendering for better performance
 */

class OptimizedWebGLRenderer {
   constructor(canvas) {
      this.canvas = canvas;
      this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

      if (!this.gl) {
         console.error("WebGL not supported, falling back to Canvas 2D");
         return;
      }

      // Check for extension support
      this.instancedArraysExt = this.gl.getExtension('ANGLE_instanced_arrays');
      if (!this.instancedArraysExt) {
         console.warn("ANGLE_instanced_arrays not supported, falling back to standard rendering");
      }

      // Initialize shaders
      this.initShaders();

      // Initialize buffers for instanced rendering
      this.initBuffers();

      // Set clear color
      this.gl.clearColor(0.0, 0.0, 0.0, 1.0); // #000

      // Enable alpha blending
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
   }

   initShaders() {
      // Vertex shader program with instancing support
      const vsSource = `
            attribute vec2 aVertexPosition;
            attribute vec2 aInstancePosition;
            attribute float aInstanceSize;
            attribute vec4 aInstanceColor;
            uniform vec2 uResolution;
            
            varying vec4 vColor;
            
            void main() {
                // Scale the vertex by the instance size
                vec2 position = aVertexPosition * aInstanceSize + aInstancePosition;
                
                // Convert from pixels to clip space
                vec2 clipSpace = (position / uResolution) * 2.0 - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                
                // Pass color to fragment shader
                vColor = aInstanceColor;
            }
        `;

      // Fragment shader program
      const fsSource = `
            precision mediump float;
            varying vec4 vColor;
            
            void main() {
                gl_FragColor = vColor;
            }
        `;

      // Create the shader program
      const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
      const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);

      this.shaderProgram = this.gl.createProgram();
      this.gl.attachShader(this.shaderProgram, vertexShader);
      this.gl.attachShader(this.shaderProgram, fragmentShader);
      this.gl.linkProgram(this.shaderProgram);

      if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
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
            vertexPosition: this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition"),
            instancePosition: this.gl.getAttribLocation(this.shaderProgram, "aInstancePosition"),
            instanceSize: this.gl.getAttribLocation(this.shaderProgram, "aInstanceSize"),
            instanceColor: this.gl.getAttribLocation(this.shaderProgram, "aInstanceColor"),
         },
         uniformLocations: {
            resolution: this.gl.getUniformLocation(this.shaderProgram, "uResolution"),
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

   initBuffers() {
      // Create a buffer for the circle vertices
      this.circleBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.circleBuffer);

      const segments = 12;
      const vertices = [];
      
      // Center vertex
      vertices.push(0, 0);
      
      // Outer vertices
      for (let i = 0; i <= segments; i++) {
         const theta = (i / segments) * Math.PI * 2;
         vertices.push(Math.cos(theta), Math.sin(theta));
      }
      
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
      this.circleVertexCount = segments + 2; // Center + outer vertices
      
      // Create buffers for instance data
      this.instancePositionBuffer = this.gl.createBuffer();
      this.instanceSizeBuffer = this.gl.createBuffer();
      this.instanceColorBuffer = this.gl.createBuffer();
   }

   // Parse color string to RGBA array
   parseColor(color) {
      // Handle HSL format
      if (color.startsWith('hsl')) {
         const match = color.match(/hsl\(([\d.]+)\s*,\s*(\d+)%\s*,\s*(\d+)%\)/);
         if (match) {
            const h = parseFloat(match[1]) / 360;
            const s = parseInt(match[2]) / 100;
            const l = parseInt(match[3]) / 100;
            
            // Convert HSL to RGB
            let r, g, b;
            
            if (s === 0) {
               r = g = b = l; // achromatic
            } else {
               const hue2rgb = (p, q, t) => {
                  if (t < 0) t += 1;
                  if (t > 1) t -= 1;
                  if (t < 1/6) return p + (q - p) * 6 * t;
                  if (t < 1/2) return q;
                  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                  return p;
               };
               
               const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
               const p = 2 * l - q;
               
               r = hue2rgb(p, q, h + 1/3);
               g = hue2rgb(p, q, h);
               b = hue2rgb(p, q, h - 1/3);
            }
            
            return [r, g, b, 1.0];
         }
      }
      
      // Handle hex format
      if (color.startsWith("#")) {
         const r = parseInt(color.slice(1, 3), 16) / 255;
         const g = parseInt(color.slice(3, 5), 16) / 255;
         const b = parseInt(color.slice(5, 7), 16) / 255;
         return [r, g, b, 1.0];
      }
      
      return [0, 0, 0, 1.0]; // Default black
   }

   clear() {
      // Set viewport to match canvas dimensions
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      // Enable depth testing for proper clearing
      this.gl.enable(this.gl.DEPTH_TEST);
      // Clear both color and depth buffers
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
   }

   // Draw multiple particles efficiently using instanced rendering
   drawParticles(particles) {
      if (!particles || particles.length === 0) return;
      
      // Extract particle data for instanced rendering
      const positions = new Float32Array(particles.length * 2);
      const sizes = new Float32Array(particles.length);
      const colors = new Float32Array(particles.length * 4);
      
      for (let i = 0; i < particles.length; i++) {
         const particle = particles[i];
         positions[i * 2] = particle.x;
         positions[i * 2 + 1] = particle.y;
         sizes[i] = particle.size;
         
         const color = this.parseColor(particle.color);
         colors[i * 4] = color[0];
         colors[i * 4 + 1] = color[1];
         colors[i * 4 + 2] = color[2];
         colors[i * 4 + 3] = color[3];
      }
      
      // Use the shader program
      this.gl.useProgram(this.programInfo.program);
      
      // Set the resolution uniform
      this.gl.uniform2f(
         this.programInfo.uniformLocations.resolution,
         this.canvas.width,
         this.canvas.height
      );
      
      // Set up the circle vertex positions
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.circleBuffer);
      this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
      this.gl.vertexAttribPointer(
         this.programInfo.attribLocations.vertexPosition,
         2, // 2 components per vertex
         this.gl.FLOAT,
         false,
         0,
         0
      );
      
      // Set up instance positions
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instancePositionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.DYNAMIC_DRAW);
      this.gl.enableVertexAttribArray(this.programInfo.attribLocations.instancePosition);
      this.gl.vertexAttribPointer(
         this.programInfo.attribLocations.instancePosition,
         2, // 2 components per position
         this.gl.FLOAT,
         false,
         0,
         0
      );
      
      // Set up instance sizes
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceSizeBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, sizes, this.gl.DYNAMIC_DRAW);
      this.gl.enableVertexAttribArray(this.programInfo.attribLocations.instanceSize);
      this.gl.vertexAttribPointer(
         this.programInfo.attribLocations.instanceSize,
         1, // 1 component per size
         this.gl.FLOAT,
         false,
         0,
         0
      );
      
      // Set up instance colors
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceColorBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, colors, this.gl.DYNAMIC_DRAW);
      this.gl.enableVertexAttribArray(this.programInfo.attribLocations.instanceColor);
      this.gl.vertexAttribPointer(
         this.programInfo.attribLocations.instanceColor,
         4, // 4 components per color (RGBA)
         this.gl.FLOAT,
         false,
         0,
         0
      );
      
      if (this.instancedArraysExt) {
         // Set up instanced attributes
         this.instancedArraysExt.vertexAttribDivisorANGLE(this.programInfo.attribLocations.instancePosition, 1);
         this.instancedArraysExt.vertexAttribDivisorANGLE(this.programInfo.attribLocations.instanceSize, 1);
         this.instancedArraysExt.vertexAttribDivisorANGLE(this.programInfo.attribLocations.instanceColor, 1);
         
         // Draw all particles in one instanced call
         this.instancedArraysExt.drawArraysInstancedANGLE(
            this.gl.TRIANGLE_FAN,
            0,
            this.circleVertexCount,
            particles.length
         );
         
         // Reset attribute divisors
         this.instancedArraysExt.vertexAttribDivisorANGLE(this.programInfo.attribLocations.instancePosition, 0);
         this.instancedArraysExt.vertexAttribDivisorANGLE(this.programInfo.attribLocations.instanceSize, 0);
         this.instancedArraysExt.vertexAttribDivisorANGLE(this.programInfo.attribLocations.instanceColor, 0);
      } else {
         // Fallback for browsers without instanced arrays support
         // This is less efficient but will still work
         for (let i = 0; i < particles.length; i++) {
            // Update instance position
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instancePositionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([positions[i*2], positions[i*2+1]]), this.gl.DYNAMIC_DRAW);
            
            // Update instance size
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceSizeBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([sizes[i]]), this.gl.DYNAMIC_DRAW);
            
            // Update instance color
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceColorBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([colors[i*4], colors[i*4+1], colors[i*4+2], colors[i*4+3]]), this.gl.DYNAMIC_DRAW);
            
            // Draw one particle
            this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, this.circleVertexCount);
         }
      }
      
      // Clean up
      this.gl.disableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
      this.gl.disableVertexAttribArray(this.programInfo.attribLocations.instancePosition);
      this.gl.disableVertexAttribArray(this.programInfo.attribLocations.instanceSize);
      this.gl.disableVertexAttribArray(this.programInfo.attribLocations.instanceColor);
   }

   // Legacy method for compatibility
   fillCircle(x, y, radius, color) {
      const rgba = this.parseColor(color);

      // Create buffer and bind it
      const positionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

      // Define vertices for the circle
      const segments = 12; // Reduced from 30 for better performance
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

   // Other methods from the original renderer can be added here if needed
}