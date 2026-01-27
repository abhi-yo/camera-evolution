# Camera Evolution App - Technical Specifications

## Authentic Camera Quality Simulation

Each era now simulates the **exact technical limitations** of cameras from that period:

### 📸 Era Specifications

#### 1. Daguerreotype (1839)
- **Resolution**: 480×360 (very low - early optical limitations)
- **Aspect Ratio**: 4:3 (portrait plates)
- **Color Depth**: 2-bit (true monochrome - black/white only)
- **Exposure**: Long (motion blur simulation)
- **Quality**: Pixelated rendering, center sharp/edge soft

#### 2. Wet Plate Collodion (1855)
- **Resolution**: 640×480
- **Aspect Ratio**: 4:3
- **Color Depth**: 4-bit (better grayscale gradation)
- **Exposure**: Medium
- **Quality**: Uneven exposure, hot spots

#### 3. Early Film (1900)
- **Resolution**: 720×540
- **Aspect Ratio**: 4:3
- **Color Depth**: 8-bit (256 shades of gray)
- **Exposure**: Normal
- **Quality**: Heavy grain, scratches, dust

#### 4. Sepia Portrait (1930)
- **Resolution**: 800×600
- **Aspect Ratio**: 4:3
- **Color Depth**: 8-bit
- **Exposure**: Normal
- **Quality**: Soft focus, warm tone

#### 5. Kodachrome (1960)
- **Resolution**: 960×720
- **Aspect Ratio**: 4:3 (35mm standard)
- **Color Depth**: 24-bit (full color)
- **Exposure**: Normal
- **Quality**: Rich colors, film grain

#### 6. Polaroid (1980)
- **Resolution**: 640×640 ⬛ **SQUARE FORMAT**
- **Aspect Ratio**: 1:1 (iconic Polaroid)
- **Color Depth**: 16-bit (limited instant film)
- **Exposure**: Normal
- **Quality**: Soft, dreamy, cyan cast

#### 7. Early Digital (2000)
- **Resolution**: 640×480 (VGA quality)
- **Aspect Ratio**: 4:3
- **Color Depth**: 16-bit (65K colors - posterization)
- **Exposure**: Fast
- **Quality**: Over-sharpening, CCD noise

#### 8. Smartphone HDR (2010)
- **Resolution**: 1280×720 (HD)
- **Aspect Ratio**: 16:9
- **Color Depth**: 24-bit
- **Exposure**: Fast
- **Quality**: Over-processed, halos

#### 9. Modern (2018)
- **Resolution**: 1920×1080 (Full HD)
- **Aspect Ratio**: 16:9
- **Color Depth**: 32-bit
- **Exposure**: Fast
- **Quality**: Clean, natural

## Technical Implementation

### What's Simulated:
✅ **Resolution downsampling** - Images rendered at historically accurate resolutions
✅ **Aspect ratio cropping** - Video cropped to match era formats
✅ **Color bit depth reduction** - Posterization to simulate limited color palettes
✅ **Exposure characteristics** - Motion blur for long exposures
✅ **Optical artifacts** - Grain, scratches, vignettes, chromatic effects

### Live Preview Features:
- Dynamic aspect ratio changes (watch the video window reshape!)
- Pixelated rendering for low-res eras
- Real-time technical specs display (resolution × aspect × bit depth)
- Era-specific filters applied live

This creates an **authentic time-travel experience** through photography history! 📸✨
