/**
 * Demo script for WebGL Drawing Library
 * Shows how to use the WebGL drawing functions
 */

// Initialize the WebGL drawing library when the page loads
document.addEventListener("DOMContentLoaded", () => {
   // Get the canvas element
   const canvas = document.getElementById("glCanvas");

   // Create a new WebGLDraw instance
   const drawer = new WebGLDraw(canvas);

   // Clear the canvas initially
   drawer.clear();

   // Set up button event listeners
   document.getElementById("drawRect").addEventListener("click", () => {
      // Clear the canvas first
      drawer.clear();

      // Draw rectangles with different colors
      drawer.setColor(1, 0, 0, 1); // Red
      drawer.rect(100, 100, 200, 150);

      drawer.setColor(0, 0, 1, 0.5); // Semi-transparent blue
      drawer.rect(200, 150, 200, 150);

      drawer.setColor(0, 0.8, 0, 0.7); // Semi-transparent green
      drawer.rect(300, 200, 150, 150);
   });

   document.getElementById("drawCircle").addEventListener("click", () => {
      // Clear the canvas first
      drawer.clear();

      // Draw circles with different colors and sizes
      drawer.setColor(1, 0, 0, 1); // Red
      drawer.circle(200, 200, 100);

      drawer.setColor(0, 0, 1, 0.5); // Semi-transparent blue
      drawer.circle(400, 300, 150);

      drawer.setColor(0, 0.8, 0, 0.7); // Semi-transparent green
      drawer.circle(300, 400, 80);
   });

   document.getElementById("drawLine").addEventListener("click", () => {
      // Clear the canvas first
      drawer.clear();

      // Draw lines with different colors and widths
      drawer.setColor(1, 0, 0, 1); // Red
      drawer.line(100, 100, 700, 500, 5);

      drawer.setColor(0, 0, 1, 1); // Blue
      drawer.line(100, 500, 700, 100, 10);

      drawer.setColor(0, 0.8, 0, 1); // Green
      drawer.line(400, 100, 400, 500, 15);
   });

   document.getElementById("drawArc").addEventListener("click", () => {
      // Clear the canvas first
      drawer.clear();

      // Draw arcs with different colors and angles
      drawer.setColor(1, 0, 0, 1); // Red
      drawer.arc(200, 200, 100, 0, Math.PI); // Half circle

      drawer.setColor(0, 0, 1, 0.5); // Semi-transparent blue
      drawer.arc(400, 300, 150, Math.PI / 4, (Math.PI * 3) / 4); // Quarter circle

      drawer.setColor(0, 0.8, 0, 0.7); // Semi-transparent green
      drawer.arc(300, 400, 80, Math.PI, Math.PI * 2, true); // Half circle counterclockwise
   });

   document.getElementById("drawCurve").addEventListener("click", () => {
      // Clear the canvas first
      drawer.clear();

      // Draw bezier curves with different colors and control points
      drawer.setColor(1, 0, 0, 1); // Red
      drawer.bezierCurve(100, 100, 200, 50, 300, 300, 400, 100, 5);

      drawer.setColor(0, 0, 1, 0.7); // Semi-transparent blue
      drawer.bezierCurve(100, 300, 250, 100, 350, 500, 600, 300, 8);

      drawer.setColor(0, 0.8, 0, 0.7); // Semi-transparent green
      drawer.bezierCurve(200, 500, 300, 300, 500, 400, 700, 500, 3);
   });

   document.getElementById("drawPolygon").addEventListener("click", () => {
      // Clear the canvas first
      drawer.clear();

      // Draw a filled triangle
      drawer.setColor(1, 0, 0, 0.7); // Semi-transparent red
      drawer.polygon(
         [
            { x: 100, y: 100 },
            { x: 300, y: 100 },
            { x: 200, y: 300 },
         ],
         true
      );

      // Draw a filled pentagon
      drawer.setColor(0, 0, 1, 0.5); // Semi-transparent blue
      const pentagonPoints = [];
      const pentRadius = 100;
      const pentCenter = { x: 500, y: 200 };
      for (let i = 0; i < 5; i++) {
         const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2; // Start at top
         pentagonPoints.push({
            x: pentCenter.x + pentRadius * Math.cos(angle),
            y: pentCenter.y + pentRadius * Math.sin(angle),
         });
      }
      drawer.polygon(pentagonPoints, true);

      // Draw an outlined hexagon
      drawer.setColor(0, 0.8, 0, 1); // Green
      const hexPoints = [];
      const hexRadius = 80;
      const hexCenter = { x: 300, y: 400 };
      for (let i = 0; i < 6; i++) {
         const angle = (i * 2 * Math.PI) / 6;
         hexPoints.push({
            x: hexCenter.x + hexRadius * Math.cos(angle),
            y: hexCenter.y + hexRadius * Math.sin(angle),
         });
      }
      drawer.polygon(hexPoints, false, 3); // Outlined with 3px width
   });

   document.getElementById("drawEllipse").addEventListener("click", () => {
      // Clear the canvas first
      drawer.clear();

      // Draw ellipses with different colors, sizes, and rotations
      drawer.setColor(1, 0, 0, 1); // Red
      drawer.ellipse(200, 200, 150, 80); // Horizontal ellipse

      drawer.setColor(0, 0, 1, 0.5); // Semi-transparent blue
      drawer.ellipse(400, 300, 80, 150); // Vertical ellipse

      drawer.setColor(0, 0.8, 0, 0.7); // Semi-transparent green
      drawer.ellipse(300, 400, 120, 60, Math.PI / 4); // Rotated ellipse
   });

   document.getElementById("clear").addEventListener("click", () => {
      // Clear the canvas
      drawer.clear();
   });

   // Draw a welcome message using our drawing functions
   drawer.setColor(0.2, 0.2, 0.8, 1);
   drawer.rect(250, 250, 300, 100);

   drawer.setColor(0.8, 0.2, 0.2, 1);
   drawer.circle(400, 300, 40);
});
