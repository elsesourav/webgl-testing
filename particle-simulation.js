/**
 * Particle Simulation Comparison
 * Compares performance between Canvas 2D and WebGL rendering
 */

// Particle class to represent a single particle
class Particle {
   constructor(x, y, canvas) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 4 + 1; // Random size between 1-5
      this.speedX = Math.random() * 3 - 1.5; // Random horizontal velocity
      this.speedY = Math.random() * 3 - 1.5; // Random vertical velocity
      this.color = `hsl(${Math.random() * 360}, 70%, 50%)`; // Random color
      this.canvas = canvas;
   }

   // Update particle position
   update() {
      // Update position based on velocity
      this.x += this.speedX;
      this.y += this.speedY;

      // Bounce off walls
      if (this.x < 0 || this.x > this.canvas.width) {
         this.speedX *= -1;
      }
      if (this.y < 0 || this.y > this.canvas.height) {
         this.speedY *= -1;
      }
   }
}

// Canvas 2D Renderer
class Canvas2DRenderer {
   constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.particles = [];
      this.stats = {
         fps: 0,
         renderTime: 0,
         lastFrameTime: 0,
      };
   }

   // Initialize particles
   initParticles(count) {
      this.particles = [];
      for (let i = 0; i < count; i++) {
         const x = Math.random() * this.canvas.width;
         const y = Math.random() * this.canvas.height;
         this.particles.push(new Particle(x, y, this.canvas));
      }
   }

   // Clear the canvas
   clear() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
   }

   // Render all particles
   render() {
      const startTime = performance.now();

      // Clear canvas
      this.clear();

      // Draw each particle
      for (const particle of this.particles) {
         this.ctx.fillStyle = particle.color;
         this.ctx.beginPath();
         this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
         this.ctx.fill();
      }

      // Calculate render time
      this.stats.renderTime = performance.now() - startTime;

      // Calculate FPS
      const now = performance.now();
      const delta = now - this.stats.lastFrameTime;
      this.stats.lastFrameTime = now;
      this.stats.fps = Math.round(1000 / delta);
   }

   // Update all particles
   update() {
      for (const particle of this.particles) {
         particle.update();
      }
   }
}

// WebGL Renderer
class WebGLParticleRenderer {
   constructor(canvas) {
      this.canvas = canvas;
      this.renderer = new WebGLRenderer(canvas);
      this.particles = [];
      this.stats = {
         fps: 0,
         renderTime: 0,
         lastFrameTime: 0,
      };
   }

   // Initialize particles
   initParticles(count) {
      this.particles = [];
      for (let i = 0; i < count; i++) {
         const x = Math.random() * this.canvas.width;
         const y = Math.random() * this.canvas.height;
         this.particles.push(new Particle(x, y, this.canvas));
      }
   }

   // Clear the canvas
   clear() {
      this.renderer.clear();
   }

   // Render all particles
   render() {
      const startTime = performance.now();

      // Clear canvas
      this.clear();

      // Draw each particle
      for (const particle of this.particles) {
         this.renderer.fillCircle(
            particle.x,
            particle.y,
            particle.size,
            particle.color
         );
      }

      // Calculate render time
      this.stats.renderTime = performance.now() - startTime;

      // Calculate FPS
      const now = performance.now();
      const delta = now - this.stats.lastFrameTime;
      this.stats.lastFrameTime = now;
      this.stats.fps = Math.round(1000 / delta);
   }

   // Update all particles
   update() {
      for (const particle of this.particles) {
         particle.update();
      }
   }
}

// Main application
document.addEventListener("DOMContentLoaded", () => {
   // Get canvas elements
   const canvas2d = document.getElementById("canvas2d");
   const canvasWebGL = document.getElementById("canvasWebGL");

   // Create renderers
   const renderer2d = new Canvas2DRenderer(canvas2d);
   const rendererWebGL = new WebGLParticleRendererOptimized(canvasWebGL);

   // Get UI elements
   const startBtn = document.getElementById("startBtn");
   const stopBtn = document.getElementById("stopBtn");
   const resetBtn = document.getElementById("resetBtn");
   const particleCountSlider = document.getElementById("particleCount");
   const particleCountValue = document.getElementById("particleCountValue");
   const stats2d = document.getElementById("stats2d");
   const statsWebGL = document.getElementById("statsWebGL");
   const performanceResults = document.getElementById("performanceResults");

   // Add mode selection buttons
   const canvas2dBtn = document.createElement("button");
   canvas2dBtn.id = "canvas2dBtn";
   canvas2dBtn.textContent = "Run Canvas 2D Only";
   canvas2dBtn.classList.add("mode-btn", "active");

   const webglBtn = document.createElement("button");
   webglBtn.id = "webglBtn";
   webglBtn.textContent = "Run WebGL Only";
   webglBtn.classList.add("mode-btn");

   const bothBtn = document.createElement("button");
   bothBtn.id = "bothBtn";
   bothBtn.textContent = "Run Both";
   bothBtn.classList.add("mode-btn");

   // Create a container for mode buttons
   const modeContainer = document.createElement("div");
   modeContainer.classList.add("mode-container");
   modeContainer.appendChild(canvas2dBtn);
   modeContainer.appendChild(webglBtn);
   modeContainer.appendChild(bothBtn);

   // Insert mode container after the existing controls
   const controlsDiv = document.querySelector(".controls");
   controlsDiv.parentNode.insertBefore(modeContainer, controlsDiv.nextSibling);

   // Animation variables
   let animationId = null;
   let isRunning = false;
   let particleCount = parseInt(particleCountSlider.value);

   // Rendering mode (0: Canvas2D only, 1: WebGL only, 2: Both)
   let renderingMode = 0;

   // Performance tracking variables
   let totalFrames = 0;
   let totalRenderTime2D = 0;
   let totalRenderTimeWebGL = 0;

   // Initialize particles
   function initParticles() {
      renderer2d.initParticles(particleCount);
      rendererWebGL.initParticles(particleCount);
   }

   // Animation loop
   function animate() {
      // Update particles based on rendering mode
      if (renderingMode === 0 || renderingMode === 2) {
         renderer2d.update();
      }
      if (renderingMode === 1 || renderingMode === 2) {
         rendererWebGL.update();
      }

      // Render particles based on rendering mode
      if (renderingMode === 0 || renderingMode === 2) {
         renderer2d.render();
         stats2d.textContent = `FPS: ${
            renderer2d.stats.fps
         } | Render Time: ${renderer2d.stats.renderTime.toFixed(2)}ms`;
         totalRenderTime2D += renderer2d.stats.renderTime;
      } else {
         // Clear Canvas 2D when not in use
         renderer2d.clear();
         stats2d.textContent = "Not Active";
      }

      if (renderingMode === 1 || renderingMode === 2) {
         rendererWebGL.render();
         statsWebGL.textContent = `FPS: ${
            rendererWebGL.stats.fps
         } | Render Time: ${rendererWebGL.stats.renderTime.toFixed(2)}ms`;
         totalRenderTimeWebGL += rendererWebGL.stats.renderTime;
      } else {
         // Clear WebGL when not in use
         rendererWebGL.clear();
         statsWebGL.textContent = "Not Active";
      }

      // Track performance metrics
      totalFrames++;

      // Update performance comparison
      if (totalFrames % 30 === 0) {
         // Update every 30 frames
         updatePerformanceComparison();
      }

      // Continue animation loop
      if (isRunning) {
         animationId = requestAnimationFrame(animate);
      }
   }

   // Update performance comparison display
   function updatePerformanceComparison() {
      let comparisonHTML = `
            <p><strong>Particles:</strong> ${particleCount}</p>
            <p><strong>Frames Analyzed:</strong> ${totalFrames}</p>
        `;

      if (renderingMode === 0) {
         const avgRenderTime2D = totalRenderTime2D / totalFrames;
         comparisonHTML += `
                <p><strong>Canvas 2D Avg Render Time:</strong> ${avgRenderTime2D.toFixed(
                   3
                )}ms</p>
                <p><strong>Current Mode:</strong> Canvas 2D Only</p>
            `;
      } else if (renderingMode === 1) {
         const avgRenderTimeWebGL = totalRenderTimeWebGL / totalFrames;
         comparisonHTML += `
                <p><strong>WebGL Avg Render Time:</strong> ${avgRenderTimeWebGL.toFixed(
                   3
                )}ms</p>
                <p><strong>Current Mode:</strong> WebGL Only</p>
            `;
      } else {
         const avgRenderTime2D = totalRenderTime2D / totalFrames;
         const avgRenderTimeWebGL = totalRenderTimeWebGL / totalFrames;
         const speedupFactor = avgRenderTime2D / avgRenderTimeWebGL;
         comparisonHTML += `
                <p><strong>Canvas 2D Avg Render Time:</strong> ${avgRenderTime2D.toFixed(
                   3
                )}ms</p>
                <p><strong>WebGL Avg Render Time:</strong> ${avgRenderTimeWebGL.toFixed(
                   3
                )}ms</p>
                <p><strong>Performance Difference:</strong> WebGL is ${speedupFactor.toFixed(
                   2
                )}x faster</p>
                <p><strong>Current Mode:</strong> Both Renderers</p>
            `;
      }

      performanceResults.innerHTML = comparisonHTML;
   }

   // Event listeners
   startBtn.addEventListener("click", () => {
      if (!isRunning) {
         isRunning = true;
         animationId = requestAnimationFrame(animate);
      }
   });

   // Mode selection event listeners
   canvas2dBtn.addEventListener("click", () => {
      renderingMode = 0;
      updateModeButtons();
      if (isRunning) {
         // Reset performance tracking
         totalFrames = 0;
         totalRenderTime2D = 0;
         totalRenderTimeWebGL = 0;
      }
   });

   webglBtn.addEventListener("click", () => {
      renderingMode = 1;
      updateModeButtons();
      if (isRunning) {
         // Reset performance tracking
         totalFrames = 0;
         totalRenderTime2D = 0;
         totalRenderTimeWebGL = 0;
      }
   });

   bothBtn.addEventListener("click", () => {
      renderingMode = 2;
      updateModeButtons();
      if (isRunning) {
         // Reset performance tracking
         totalFrames = 0;
         totalRenderTime2D = 0;
         totalRenderTimeWebGL = 0;
      }
   });

   // Update mode buttons active state
   function updateModeButtons() {
      canvas2dBtn.classList.remove("active");
      webglBtn.classList.remove("active");
      bothBtn.classList.remove("active");

      if (renderingMode === 0) {
         canvas2dBtn.classList.add("active");
      } else if (renderingMode === 1) {
         webglBtn.classList.add("active");
      } else {
         bothBtn.classList.add("active");
      }
   }

   stopBtn.addEventListener("click", () => {
      isRunning = false;
      if (animationId) {
         cancelAnimationFrame(animationId);
         animationId = null;
      }
   });

   resetBtn.addEventListener("click", () => {
      // Stop animation if running
      isRunning = false;
      if (animationId) {
         cancelAnimationFrame(animationId);
         animationId = null;
      }

      // Reset performance tracking
      totalFrames = 0;
      totalRenderTime2D = 0;
      totalRenderTimeWebGL = 0;

      // Clear canvases
      renderer2d.clear();
      rendererWebGL.clear();

      // Reinitialize particles
      initParticles();

      // Reset stats display
      stats2d.textContent = "FPS: 0 | Render Time: 0ms";
      statsWebGL.textContent = "FPS: 0 | Render Time: 0ms";

      // Reset performance display
      performanceResults.innerHTML =
         "Start the simulation to see performance comparison results.";
   });

   particleCountSlider.addEventListener("input", () => {
      particleCount = parseInt(particleCountSlider.value);
      particleCountValue.textContent = particleCount;
   });

   particleCountSlider.addEventListener("change", () => {
      // Reset with new particle count
      resetBtn.click();
   });

   // Initialize the simulation
   initParticles();
});
