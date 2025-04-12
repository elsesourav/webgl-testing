/**
 * WebGL Drawing Library
 * A simple drawing library that provides Canvas-like drawing functions using WebGL
 */

class WebGLDraw {
    /**
     * Initialize WebGL context and set up the drawing environment
     * @param {HTMLCanvasElement} canvas - The canvas element to draw on
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }
        
        // Initialize shaders and buffers
        this.initShaders();
        this.initBuffers();
        
        // Set clear color to white
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        // Default drawing color
        this.setColor(0, 0, 0, 1);
    }
    
    /**
     * Initialize WebGL shaders
     */
    initShaders() {
        // Vertex shader program
        const vsSource = `
            attribute vec4 aVertexPosition;
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            
            void main() {
                gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
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
        
        // Create shader program
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);
        
        this.shaderProgram = this.gl.createProgram();
        this.gl.attachShader(this.shaderProgram, vertexShader);
        this.gl.attachShader(this.shaderProgram, fragmentShader);
        this.gl.linkProgram(this.shaderProgram);
        
        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(this.shaderProgram));
            return;
        }
        
        // Get shader attributes and uniforms
        this.programInfo = {
            program: this.shaderProgram,
            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix'),
                color: this.gl.getUniformLocation(this.shaderProgram, 'uColor'),
            },
        };
    }
    
    /**
     * Compile a shader
     * @param {number} type - The type of shader
     * @param {string} source - The source code of the shader
     * @returns {WebGLShader} The compiled shader
     */
    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    /**
     * Initialize WebGL buffers
     */
    initBuffers() {
        // Create a buffer for the vertex positions
        this.positionBuffer = this.gl.createBuffer();
    }
    
    /**
     * Set the drawing color
     * @param {number} r - Red component (0-1)
     * @param {number} g - Green component (0-1)
     * @param {number} b - Blue component (0-1)
     * @param {number} a - Alpha component (0-1)
     */
    setColor(r, g, b, a = 1.0) {
        this.color = [r, g, b, a];
    }
    
    /**
     * Clear the canvas
     */
    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    
    /**
     * Draw a rectangle
     * @param {number} x - X coordinate of the top-left corner
     * @param {number} y - Y coordinate of the top-left corner
     * @param {number} width - Width of the rectangle
     * @param {number} height - Height of the rectangle
     */
    rect(x, y, width, height) {
        // Convert canvas coordinates to WebGL coordinates (0,0 at center, -1 to 1 range)
        const x1 = (x / this.canvas.width) * 2 - 1;
        const y1 = -((y / this.canvas.height) * 2 - 1); // Flip Y axis
        const x2 = ((x + width) / this.canvas.width) * 2 - 1;
        const y2 = -(((y + height) / this.canvas.height) * 2 - 1);
        
        // Define vertices for the rectangle
        const positions = [
            x1, y1,
            x2, y1,
            x1, y2,
            x2, y2,
        ];
        
        // Bind position buffer and set data
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        
        // Set up shader program
        this.gl.useProgram(this.programInfo.program);
        
        // Set up vertex attribute
        this.gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexPosition,
            2, // 2 components per vertex
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        
        // Set up matrices
        const projectionMatrix = mat4.create();
        const modelViewMatrix = mat4.create();
        
        // Set uniforms
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix
        );
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix
        );
        this.gl.uniform4fv(this.programInfo.uniformLocations.color, this.color);
        
        // Draw the rectangle
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    
    /**
     * Draw a circle
     * @param {number} x - X coordinate of the center
     * @param {number} y - Y coordinate of the center
     * @param {number} radius - Radius of the circle
     */
    circle(x, y, radius) {
        const segments = 36; // Number of segments to approximate the circle
        const positions = [];
        
        // Convert canvas coordinates to WebGL coordinates
        const centerX = (x / this.canvas.width) * 2 - 1;
        const centerY = -((y / this.canvas.height) * 2 - 1); // Flip Y axis
        const radiusX = (radius / this.canvas.width) * 2;
        const radiusY = (radius / this.canvas.height) * 2;
        
        // Add center point
        positions.push(centerX, centerY);
        
        // Generate vertices for the circle
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const vertX = centerX + Math.cos(theta) * radiusX;
            const vertY = centerY + Math.sin(theta) * radiusY;
            positions.push(vertX, vertY);
        }
        
        // Bind position buffer and set data
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        
        // Set up shader program
        this.gl.useProgram(this.programInfo.program);
        
        // Set up vertex attribute
        this.gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexPosition,
            2, // 2 components per vertex
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        
        // Set up matrices
        const projectionMatrix = mat4.create();
        const modelViewMatrix = mat4.create();
        
        // Set uniforms
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix
        );
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix
        );
        this.gl.uniform4fv(this.programInfo.uniformLocations.color, this.color);
        
        // Draw the circle as a triangle fan
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, segments + 2);
    }
    
    /**
     * Draw a line
     * @param {number} x1 - X coordinate of the start point
     * @param {number} y1 - Y coordinate of the start point
     * @param {number} x2 - X coordinate of the end point
     * @param {number} y2 - Y coordinate of the end point
     * @param {number} lineWidth - Width of the line
     */
    line(x1, y1, x2, y2, lineWidth = 1) {
        // Convert canvas coordinates to WebGL coordinates
        const glX1 = (x1 / this.canvas.width) * 2 - 1;
        const glY1 = -((y1 / this.canvas.height) * 2 - 1); // Flip Y axis
        const glX2 = (x2 / this.canvas.width) * 2 - 1;
        const glY2 = -((y2 / this.canvas.height) * 2 - 1);
        
        // Calculate the direction vector of the line
        const dirX = glX2 - glX1;
        const dirY = glY2 - glY1;
        
        // Normalize the direction vector
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        const normDirX = dirX / length;
        const normDirY = dirY / length;
        
        // Calculate the perpendicular vector
        const perpX = -normDirY;
        const perpY = normDirX;
        
        // Calculate the half width in WebGL coordinates
        const halfWidth = (lineWidth / 2) / Math.min(this.canvas.width, this.canvas.height) * 2;
        
        // Calculate the four corners of the line segment
        const positions = [
            glX1 + perpX * halfWidth, glY1 + perpY * halfWidth,
            glX1 - perpX * halfWidth, glY1 - perpY * halfWidth,
            glX2 + perpX * halfWidth, glY2 + perpY * halfWidth,
            glX2 - perpX * halfWidth, glY2 - perpY * halfWidth,
        ];
        
        // Bind position buffer and set data
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        
        // Set up shader program
        this.gl.useProgram(this.programInfo.program);
        
        // Set up vertex attribute
        this.gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexPosition,
            2, // 2 components per vertex
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        
        // Set up matrices
        const projectionMatrix = mat4.create();
        const modelViewMatrix = mat4.create();
        
        // Set uniforms
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix
        );
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix
        );
        this.gl.uniform4fv(this.programInfo.uniformLocations.color, this.color);
        
        // Draw the line as a triangle strip
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    
    /**
     * Draw an arc
     * @param {number} x - X coordinate of the center
     * @param {number} y - Y coordinate of the center
     * @param {number} radius - Radius of the arc
     * @param {number} startAngle - Starting angle in radians
     * @param {number} endAngle - Ending angle in radians
     * @param {boolean} counterclockwise - Whether to draw counterclockwise
     */
    arc(x, y, radius, startAngle, endAngle, counterclockwise = false) {
        // Ensure proper angle direction
        if (counterclockwise) {
            if (startAngle < endAngle) {
                startAngle += Math.PI * 2;
            }
        } else {
            if (endAngle < startAngle) {
                endAngle += Math.PI * 2;
            }
        }
        
        const segments = 36; // Number of segments to approximate the arc
        const angleRange = Math.abs(endAngle - startAngle);
        const segmentCount = Math.max(2, Math.floor((angleRange / (Math.PI * 2)) * segments));
        const positions = [];
        
        // Convert canvas coordinates to WebGL coordinates
        const centerX = (x / this.canvas.width) * 2 - 1;
        const centerY = -((y / this.canvas.height) * 2 - 1); // Flip Y axis
        const radiusX = (radius / this.canvas.width) * 2;
        const radiusY = (radius / this.canvas.height) * 2;
        
        // Add center point
        positions.push(centerX, centerY);
        
        // Generate vertices for the arc
        for (let i = 0; i <= segmentCount; i++) {
            const theta = startAngle + (i / segmentCount) * (endAngle - startAngle);
            const vertX = centerX + Math.cos(theta) * radiusX;
            const vertY = centerY + Math.sin(theta) * radiusY;
            positions.push(vertX, vertY);
        }
        
        // Bind position buffer and set data
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        
        // Set up shader program
        this.gl.useProgram(this.programInfo.program);
        
        // Set up vertex attribute
        this.gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexPosition,
            2, // 2 components per vertex
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        
        // Set up matrices
        const projectionMatrix = mat4.create();
        const modelViewMatrix = mat4.create();
        
        // Set uniforms
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix
        );
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix
        );
        this.gl.uniform4fv(this.programInfo.uniformLocations.color, this.color);
        
        // Draw the arc as a triangle fan
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, segmentCount + 2);
    }
    
    /**
     * Draw a bezier curve
     * @param {number} x1 - X coordinate of the start point
     * @param {number} y1 - Y coordinate of the start point
     * @param {number} cpx1 - X coordinate of the first control point
     * @param {number} cpy1 - Y coordinate of the first control point
     * @param {number} cpx2 - X coordinate of the second control point
     * @param {number} cpy2 - Y coordinate of the second control point
     * @param {number} x2 - X coordinate of the end point
     * @param {number} y2 - Y coordinate of the end point
     * @param {number} lineWidth - Width of the curve
     */
    bezierCurve(x1, y1, cpx1, cpy1, cpx2, cpy2, x2, y2, lineWidth = 1) {
        const segments = 30; // Number of segments to approximate the curve
        const positions = [];
        
        // Calculate points along the bezier curve
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const u = 1 - t;
            const tt = t * t;
            const uu = u * u;
            const uuu = uu * u;
            const ttt = tt * t;
            
            // Cubic Bezier formula
            const x = uuu * x1 + 3 * uu * t * cpx1 + 3 * u * tt * cpx2 + ttt * x2;
            const y = uuu * y1 + 3 * uu * t * cpy1 + 3 * u * tt * cpy2 + ttt * y2;
            
            points.push({ x, y });
        }
        
        // Create a line strip with width from the bezier points
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            
            // Convert canvas coordinates to WebGL coordinates
            const glX1 = (p1.x / this.canvas.width) * 2 - 1;
            const glY1 = -((p1.y / this.canvas.height) * 2 - 1); // Flip Y axis
            const glX2 = (p2.x / this.canvas.width) * 2 - 1;
            const glY2 = -((p2.y / this.canvas.height) * 2 - 1);
            
            // Calculate the direction vector of the line segment
            const dirX = glX2 - glX1;
            const dirY = glY2 - glY1;
            
            // Normalize the direction vector
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            const normDirX = dirX / length;
            const normDirY = dirY / length;
            
            // Calculate the perpendicular vector
            const perpX = -normDirY;
            const perpY = normDirX;
            
            // Calculate the half width in WebGL coordinates
            const halfWidth = (lineWidth / 2) / Math.min(this.canvas.width, this.canvas.height) * 2;
            
            // Add the four corners of this line segment
            if (i === 0) {
                positions.push(
                    glX1 + perpX * halfWidth, glY1 + perpY * halfWidth,
                    glX1 - perpX * halfWidth, glY1 - perpY * halfWidth
                );
            }
            
            positions.push(
                glX2 + perpX * halfWidth, glY2 + perpY * halfWidth,
                glX2 - perpX * halfWidth, glY2 - perpY * halfWidth
            );
        }
        
        // Bind position buffer and set data
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        
        // Set up shader program
        this.gl.useProgram(this.programInfo.program);
        
        // Set up vertex attribute
        this.gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexPosition,
            2, // 2 components per vertex
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        
        // Set up matrices
        const projectionMatrix = mat4.create();
        const modelViewMatrix = mat4.create();
        
        // Set uniforms
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix
        );
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix
        );
        this.gl.uniform4fv(this.programInfo.uniformLocations.color, this.color);
        
        // Draw the curve as a triangle strip
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, positions.length / 2);
    }
    
    /**
     * Draw a polygon
     * @param {Array} points - Array of {x, y} points defining the polygon
     * @param {boolean} fill - Whether to fill the polygon (true) or draw outline (false)
     * @param {number} lineWidth - Width of the outline if fill is false
     */
    polygon(points, fill = true, lineWidth = 1) {
        if (points.length < 3) {
            console.error('Polygon requires at least 3 points');
            return;
        }
        
        if (fill) {
            // For filled polygon, use triangle fan
            const positions = [];
            
            // Calculate center point (average of all points)
            let centerX = 0;
            let centerY = 0;
            for (const point of points) {
                centerX += point.x;
                centerY += point.y;
            }
            centerX /= points.length;
            centerY /= points.length;
            
            // Convert center to WebGL coordinates
            const glCenterX = (centerX / this.canvas.width) * 2 - 1;
            const glCenterY = -((centerY / this.canvas.height) * 2 - 1); // Flip Y axis
            
            // Add center point
            positions.push(glCenterX, glCenterY);
            
            // Add all vertices
            for (let i = 0; i <= points.length; i++) {
                const point = points[i % points.length];
                const glX = (point.x / this.canvas.width) * 2 - 1;
                const glY = -((point.y / this.canvas.height) * 2 - 1); // Flip Y axis
                positions.push(glX, glY);
            }
            
            // Bind position buffer and set data
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
            
            // Set up shader program
            this.gl.useProgram(this.programInfo.program);
            
            // Set up vertex attribute
            this.gl.vertexAttribPointer(
                this.programInfo.attribLocations.vertexPosition,
                2, // 2 components per vertex
                this.gl.FLOAT,
                false,
                0,
                0
            );
            this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
            
            // Set up matrices
            const projectionMatrix = mat4.create();
            const modelViewMatrix = mat4.create();
            
            // Set uniforms
            this.gl.uniformMatrix4fv(
                this.programInfo.uniformLocations.projectionMatrix,
                false,
                projectionMatrix
            );
            this.gl.uniformMatrix4fv(
                this.programInfo.uniformLocations.modelViewMatrix,
                false,
                modelViewMatrix
            );
            this.gl.uniform4fv(this.programInfo.uniformLocations.color, this.color);
            
            // Draw the polygon as a triangle fan
            this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, positions.length / 2);
        } else {
            // For outline, draw lines between each pair of points
            for (let i = 0; i < points.length; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];
                this.line(p1.x, p1.y, p2.x, p2.y, lineWidth);
            }
        }
    }
    
    /**
     * Draw an ellipse
     * @param {number} x - X coordinate of the center
     * @param {number} y - Y coordinate of the center
     * @param {number} radiusX - Horizontal radius
     * @param {number} radiusY - Vertical radius
     * @param {number} rotation - Rotation angle in radians
     */
    ellipse(x, y, radiusX, radiusY, rotation = 0) {
        const segments = 36; // Number of segments to approximate the ellipse
        const positions = [];
        
        // Convert canvas coordinates to WebGL coordinates
        const centerX = (x / this.canvas.width) * 2 - 1;
        const centerY = -((y / this.canvas.height) * 2 - 1); // Flip Y axis
        const glRadiusX = (radiusX / this.canvas.width) * 2;
        const glRadiusY = (radiusY / this.canvas.height) * 2;
        
        // Add center point
        positions.push(centerX, centerY);
        
        // Calculate sin and cos of rotation once
        const cosRotation = Math.cos(rotation);
        const sinRotation = Math.sin(rotation);
        
        // Generate vertices for the ellipse
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const cosTheta = Math.cos(theta);
            const sinTheta = Math.sin(theta);
            
            // Calculate point on unrotated ellipse
            const x = cosTheta * glRadiusX;
            const y = sinTheta * glRadiusY;
            
            // Apply rotation
            const rotatedX = x * cosRotation - y * sinRotation;
            const rotatedY = x * sinRotation + y * cosRotation;
            
            // Translate to center
            const vertX = centerX + rotatedX;
            const vertY = centerY + rotatedY;
            
            positions.push(vertX, vertY);
        }
        
        // Bind position buffer and set data
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        
        // Set up shader program
        this.gl.useProgram(this.programInfo.program);
        
        // Set up vertex attribute
        this.gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexPosition,
            2, // 2 components per vertex
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        
        // Set up matrices
        const projectionMatrix = mat4.create();
        const modelViewMatrix = mat4.create();
        
        // Set uniforms
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix
        );
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix
        );
        this.gl.uniform4fv(this.programInfo.uniformLocations.color, this.color);
        
        // Draw the ellipse as a triangle fan
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, segments + 2);
    }
}

// Add gl-matrix library for matrix operations
// Source: https://github.com/toji/gl-matrix
(function(){var shim={exports:{}};
(function(undefined) {
  'use strict';

  var EPSILON = 0.000001;

  /**
   * Common utilities
   * @module glMatrix
   */
  var glMatrix = {};

  /**
   * Sets the type of array used when creating new vectors and matrices
   *
   * @param {Type} type Array type, such as Float32Array or Array
   */
  glMatrix.setMatrixArrayType = function(type) {
    glMatrix.ARRAY_TYPE = type;
  };

  glMatrix.ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;

  var degree = Math.PI / 180;

  /**
   * Convert Degree To Radian
   *
   * @param {Number} a Angle in Degrees
   */
  glMatrix.toRadian = function(a){
     return a * degree;
  };

  /**
   * 4x4 Matrix
   * @module mat4
   */
  var mat4 = {};

  /**
   * Creates a new identity mat4
   *
   * @returns {mat4} a new 4x4 matrix
   */
  mat4.create = function() {
    var out = new glMatrix.ARRAY_TYPE(16);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  };

  // Export to global
  window.mat4 = mat4;
  window.glMatrix = glMatrix;
})();
})();