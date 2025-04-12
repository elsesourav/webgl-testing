/**
 * Optimized WebGL Particle Renderer
 * Uses instanced rendering for better performance
 */

class WebGLParticleRendererOptimized {
   constructor(canvas) {
      this.canvas = canvas;
      this.renderer = new OptimizedWebGLRenderer(canvas);
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

   // Render all particles in a single draw call
   render() {
      const startTime = performance.now();

      // Clear canvas
      this.clear();

      // Draw all particles in a single call
      this.renderer.drawParticles(this.particles);

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
