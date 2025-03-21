# foot-pressure-analysis
Made by Nitin Gandhi : https://www.linkedin.com/in/nitingandhi29/

The core goal of this project is to analyze an inked foot stamp image (a photograph or scan of someone’s footprint on paper) and generate a color‐coded “pressure map.” This map visually indicates which parts of the foot apply greater or lesser pressure.

Key steps typically include:

Why It’s Used
Orthopedic Assessments: Clinicians (e.g. podiatrists, orthopedic specialists) can use the footprint pressure map to evaluate arch shape, detect uneven weight distribution, or identify areas prone to injury or ulceration (especially for diabetic patients).
Gait & Posture Analysis: By examining pressure patterns, specialists can see if a patient is over‐pronating, supinating, or has other biomechanical issues.
Custom Insoles or Orthotics: The pressure data can inform where extra support or cushioning is needed in a shoe insole or orthotic device.
Sports Performance: Athletes and trainers sometimes use foot pressure mappings to refine running mechanics or shoe selection.
Overall, foot pressure mapping offers an accessible, noninvasive way to see how a person’s body weight is distributed across the foot, aiding in diagnostics, treatment planning, and research.

How it's made : 
I'll explain the key logic and algorithms used in the foot pressure analysis:

Pressure Level Definition:

Defined 5 distinct pressure levels with specific thresholds and colors
Red (65%+): Highest pressure areas
Orange (45-65%): High pressure
Yellow (35-45%): Medium pressure
Green (20-35%): Low pressure
White (0-20%): Minimal pressure
Image Processing Pipeline:


Raw Image → Edge Detection → Grid Pattern Detection → Pressure Mapping → 
Smoothing → Color Clustering → Final Rendering
Edge Detection:

Uses Sobel-like operator for gradient calculation
Computes both horizontal and vertical gradients
Combines gradients using sqrt(dx² + dy²)
Applies EDGE_THRESHOLD to identify significant edges
Grid Pattern Detection:

Searches for grid lines in 8 directions (π/8 intervals)
Uses GRID_SEARCH_RADIUS to look for nearby edges
Calculates grid confidence based on number of lines found
Requires MIN_GRID_LINES (2) for positive detection
Pressure Value Calculation:

Converts RGB to grayscale using weighted formula (0.3R + 0.59G + 0.11B)
Inverts intensity (255 - value) so darker = higher pressure
Multiplies by grid confidence to reduce noise
Uses percentiles (2nd and 98th) to remove outliers
Color Clustering Algorithm:

Uses CLUSTER_RADIUS (16 pixels) for neighborhood analysis
Weighted average of pressure values within radius
Weight decreases linearly with distance from center
Preserves foot edges by operating within bounding box
Maintains pressure gradients while reducing color fragmentation
Smoothing and Interpolation:

Gaussian smoothing with SMOOTHING_RADIUS (4)
Color interpolation between pressure levels
Linear interpolation for smooth transitions
Maintains continuous color gradients
Rendering Optimization:

Uses step size of GRID_SIZE/2 for efficiency
Draws pressure points with fade at edges
Normalizes pressure values to [0,1] range
Clips values to prevent overflow
This creates a continuous, visually meaningful representation of foot pressure while maintaining accuracy and reducing noise.


[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/nitin94/foot-pressure-analysis)
