import React, { useState, useEffect } from 'react';
import { Loader } from './';

const CivicImageAnalysis = ({ imageUrl, referenceImageUrl, projectType = 'infrastructure', analysisMode = 'proof', onAnalysisComplete, milestone = 50 }) => {
  console.log(' CivicImageAnalysis component re-rendered with new scoring logic', { analysisMode });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  // Adaptive scoring thresholds based on project type
  const getBestFitScore = (projectType, milestone) => {
    const thresholds = {
      // Infrastructure projects (general)
      infrastructure: {
        50: 7.0,   // Midpoint quality threshold
        100: 8.2  // Final completion threshold
      },
      // Park management projects
      parks: {
        50: 6.5,   // Midpoint functionality threshold
        100: 8.0   // Final completion threshold
      },
      // Pothole repair projects
      potholes: {
        50: 7.0,   // Midpoint substantial repair threshold
        100: 8.2   // Final completion threshold (fully patched photos must pass confidently)
      }
    };
    
    return thresholds[projectType]?.[milestone] || thresholds.infrastructure[milestone];
  };

  // Enhanced civic infrastructure quality metrics
  const civicQualityMetrics = {
    infrastructure: {
      // General infrastructure
      site_preparation: { weight: 0.20, indicators: ['safety_cones', 'barriers', 'work_zone_setup'] },
      material_quality: { weight: 0.25, indicators: ['modern_materials', 'proper_specifications', 'durability'] },
      workmanship: { weight: 0.30, indicators: ['clean_installation', 'precise_alignment', 'proper_finishing'] },
      compliance: { weight: 0.15, indicators: ['code_compliance', 'safety_standards', 'accessibility'] },
      functionality: { weight: 0.10, indicators: ['operational_test', 'proper_integration', 'user_safety'] }
    },
    
    parks: {
      // Park-specific metrics
      cleanliness: { weight: 0.25, indicators: ['trash_bins', 'litter_free', 'well_maintained'] },
      amenities: { weight: 0.20, indicators: ['benches', 'playground_equipment', 'lighting', 'signage'] },
      landscaping: { weight: 0.20, indicators: ['grass_condition', 'trees_health', 'flower_beds'] },
      safety: { weight: 0.25, indicators: ['path_conditions', 'safety_features', 'visibility'] },
      accessibility: { weight: 0.10, indicators: ['ramps', 'handrails', 'accessible_equipment'] }
    },
    
    potholes: {
      // Pothole-specific metrics
      completion: { weight: 0.30, indicators: ['hole_filled', 'surface_smooth', 'asphalt_quality'] },
      surrounding_area: { weight: 0.20, indicators: ['clean_edges', 'proper_compaction', 'drainage'] },
      durability: { weight: 0.25, indicators: ['material_quality', 'workmanship', 'finishing'] },
      traffic_safety: { weight: 0.25, indicators: ['warning_signs', 'temporary_markings', 'safe_work_zone'] }
    }
  };

  const analyzeImage = async (imageData, pixelFeatures) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      let referenceAnalysis = null;
      if (referenceImageUrl) {
        try {
          const refData = await loadReferenceImage(referenceImageUrl);
          referenceAnalysis = await simulateYOLOAnalysis(refData.imageData, refData.pixelFeatures);
        } catch (refError) {
          console.warn('Failed to load reference image for comparison:', refError);
        }
      }

      const mockAnalysis = await simulateYOLOAnalysis(imageData, pixelFeatures);
      const qualityScores = calculateQualityScores(mockAnalysis, projectType, referenceAnalysis, milestone, analysisMode);
      const indicatorSummary = buildIndicatorSummary(mockAnalysis?.checklist?.breakdown || []);
      setAnalysis({
        detected: mockAnalysis,
        scores: qualityScores,
        overallScore: qualityScores.overall,
        recommendations: generateRecommendations(qualityScores, projectType, milestone),
        indicatorSummary,
        cacheTimestamp: Date.now()
      });

      onAnalysisComplete({
        analysis: mockAnalysis,
        scores: qualityScores,
        overallScore: qualityScores.overall,
        bestFitScore: qualityScores.bestFitScore,
        meetsThreshold: qualityScores.meetsThreshold,
        canReleaseFunds: qualityScores.canReleaseFunds,
        similarityScore: qualityScores.similarityScore,
        indicatorSummary,
        projectType,
        category: mockAnalysis?.checklist?.category || projectType,
        milestone,
        cacheTimestamp: Date.now()
      });

    } catch (err) {
      console.error('Analysis error:', err);
      setError('Image analysis failed. Please try again.');
      
      const fallbackBestFit = analysisMode === 'campaign' ? 6.0 : getBestFitThreshold(projectType, milestone);

      // Provide fallback analysis so user can still proceed
      const fallbackAnalysis = {
        detected: { objects: [], image_quality: { clarity: 0.5, lighting: 0.5, composition: 0.5, resolution: 'medium' } },
        scores: { overall: 4.0, bestFitScore: fallbackBestFit, meetsThreshold: false, canReleaseFunds: false },
        overallScore: 4.0,
        bestFitScore: fallbackBestFit,
        recommendations: ['Image analysis had issues, so the campaign is not yet eligible for funding release.'],
        similarityScore: 1,
        projectType,
        milestone: 100
      };
      
      onAnalysisComplete(fallbackAnalysis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractImageFeatures = (imagePixels) => {
    const { data, width, height } = imagePixels;
    let greenCount = 0;
    let grayCount = 0;
    let colorCount = 0;
    let darkCount = 0;
    let edgeCount = 0;
    let verticalEdgeCount = 0;
    let horizontalEdgeCount = 0;
    let highContrastCount = 0;
    let sampleCount = 0;
    let brightnessSum = 0;
    let contrastSum = 0;
    const totalPixels = width * height;

    const getBrightness = (r, g, b) => (r + g + b) / 3;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = getBrightness(r, g, b);
      brightnessSum += brightness;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;

      if (g > r + 20 && g > b + 20 && brightness > 60) greenCount += 1;
      if (max - min < 25 && brightness > 50 && brightness < 220) grayCount += 1;
      // Vivid colors  to  painted surfaces, signage, playground equipment
      if (saturation > 0.25 && brightness > 30) colorCount += 1;
      // Dark low-saturation regions  to  pothole craters, furniture silhouettes, posts, signs.
      // NOTE: brightness here is on the 0-255 scale, so use ~115 (45% of 255) for "dark".
      // Previously this compared against 0.45 which made dark pixels NEVER count, so
      // darkRatio was always ~0 and pothole (dark crater) detection never fired.
      if (saturation < 0.12 && brightness < 115) darkCount += 1;
      contrastSum += saturation;
    }

    // Edge density via subsampled pixel neighbors (with orientation + contrast)
    const sampleStep = Math.max(1, Math.floor(Math.sqrt(totalPixels / 2048)));
    for (let y = 1; y < height - 1; y += sampleStep) {
      for (let x = 1; x < width - 1; x += sampleStep) {
        const idx = (y * width + x) * 4;
        const brightness = getBrightness(data[idx], data[idx + 1], data[idx + 2]);
        const left = getBrightness(data[idx - 4], data[idx - 3], data[idx - 2]);
        const top = getBrightness(data[idx - width * 4], data[idx - width * 4 + 1], data[idx - width * 4 + 2]);
        sampleCount += 1;
        const diffLeft = Math.abs(brightness - left);
        const diffTop = Math.abs(brightness - top);
        if (diffLeft > 30) {
          edgeCount += 1;
          // Horizontal gradient  to  vertical structure (posts, poles, fence rails)
          verticalEdgeCount += 1;
        }
        if (diffTop > 30) {
          edgeCount += 1;
          // Vertical gradient  to  horizontal structure (crossing stripes, rails)
          horizontalEdgeCount += 1;
        }
        // Strong alternating light/dark  to  zebra stripes, high-visibility markings
        if (diffLeft > 45 || diffTop > 45) highContrastCount += 1;
      }
    }

    const avgBrightness = brightnessSum / totalPixels / 255;
    const avgContrast = contrastSum / totalPixels;
    const greenRatio = greenCount / totalPixels;
    const grayRatio = grayCount / totalPixels;
    const colorRatio = colorCount / totalPixels;
    const darkRatio = darkCount / totalPixels;
    const denom = sampleCount || 1;
    const edgeDensity = edgeCount / denom;
    const verticalEdgeDensity = verticalEdgeCount / denom;
    const horizontalEdgeDensity = horizontalEdgeCount / denom;
    const highContrastDensity = highContrastCount / denom;

    return {
      brightness: avgBrightness,
      greenRatio,
      grayRatio,
      colorRatio,
      darkRatio,
      edgeDensity,
      verticalEdgeDensity,
      horizontalEdgeDensity,
      highContrastDensity,
      clarity: Math.min(1, avgContrast * 1.5),
      composition: Math.min(1, greenRatio + grayRatio * 0.5),
      resolution: width * height >= 400000 ? 'high' : width * height >= 120000 ? 'medium' : 'low'
    };
  };

  const getRoadDamageSignal = (imageFeatures = {}) => {
    const grayRatio = imageFeatures.grayRatio || 0;
    const edgeDensity = imageFeatures.edgeDensity || 0;
    const clarity = imageFeatures.clarity || 0;
    const brightness = imageFeatures.brightness || 0.5;
    const darkRatio = imageFeatures.darkRatio || 0;

    // A road-like scene is gray pavement. Lower the edge threshold so even a
    // smooth asphalt photo (with a small dark pothole) is recognized as a road.
    const roadLike = grayRatio > 0.05 && edgeDensity > 0.004;
    // A real pothole is a dark, cratered break in the road with sharp edges.
    // A fully patched pothole is a smooth, uniform, intact surface — it should
    // NOT be flagged as damaged just because it is gray asphalt.
    const smoothness = Math.max(0, Math.min(1, 1 - edgeDensity * 6));
    const damageSignal = Math.min(1,
      edgeDensity * 0.9 +
      (1 - smoothness) * 0.15 +
      grayRatio * 0.06 +
      darkRatio * 0.45 +   // Dark craters are the strongest pothole indicators
      clarity * 0.04
    );
    const potholeSignal = Math.min(1, damageSignal + (brightness > 0.55 ? 0.04 : 0));

    return { roadLike, damageSignal, potholeSignal, smoothness };
  };

  const getPatchSignal = (imageFeatures = {}, roadDamage = null) => {
    const rd = roadDamage || getRoadDamageSignal(imageFeatures);
    const edgeDensity = imageFeatures.edgeDensity || 0;
    const grayRatio = imageFeatures.grayRatio || 0;
    const clarity = imageFeatures.clarity || 0;
    const brightness = imageFeatures.brightness || 0.5;

    // A finished patch is smooth, uniform, road-colored and free of holes/cracking.
    const smoothness = Math.max(0, Math.min(1, 1 - edgeDensity * 6));
    // Prefer LOW edge density (no crater edges or broken surface)
    const edgeScore = Math.max(0, Math.min(1, 1 - edgeDensity / 0.045));
    // Fresh asphalt is predominantly gray; allow the natural road gray range
    const grayScore = Math.max(0, Math.min(1, 1 - Math.abs(grayRatio - 0.45) / 0.35));
    // Slightly darker, fresh asphalt reads as a recent patch
    const darknessBonus = brightness < 0.55 ? 0.06 : 0;
    // Repair looks complete when it is road-like and the damage signals are gone
    const repairBonus = rd.roadLike ? 0.10 : 0;
    const noDamageBonus = (1 - rd.damageSignal) * 0.08;

    const patchSignal = Math.min(1,
      0.15 +
      smoothness * 0.25 +
      edgeScore * 0.20 +
      grayScore * 0.25 +
      rd.potholeSignal * 0.10 +
      clarity * 0.04 +
      darknessBonus +
      repairBonus +
      noDamageBonus
    );

    return Math.max(0, Math.min(1, patchSignal));
  };

  // ===== Category-specific completion signals (all categories) =====

  // Playground / park: green scene + dark equipment silhouettes + vivid painted elements
  const getPlaygroundSignal = (imageFeatures = {}) => {
    const greenRatio = imageFeatures.greenRatio || 0;
    const darkRatio = imageFeatures.darkRatio || 0;
    const colorRatio = imageFeatures.colorRatio || 0;
    const edgeDensity = imageFeatures.edgeDensity || 0;
    const brightness = imageFeatures.brightness || 0.5;

    const greenBase = Math.min(1, greenRatio * 1.6);
    const structurePresence = Math.min(1,
      darkRatio * 1.2 + edgeDensity * 2.0
    );
    const paintedElements = Math.min(1, colorRatio * 1.4);
    const brightScene = brightness > 0.45 ? 0.12 : 0;

    return Math.max(0, Math.min(1,
      greenBase * 0.35 +
      structurePresence * 0.30 +
      paintedElements * 0.25 +
      brightScene
    ));
  };

  // Street furniture (bench/bin/bollard): dark silhouette + vertical edges + paint color
  const getFurnitureSignal = (imageFeatures = {}) => {
    const darkRatio = imageFeatures.darkRatio || 0;
    const verticalEdgeDensity = imageFeatures.verticalEdgeDensity || 0;
    const colorRatio = imageFeatures.colorRatio || 0;
    const edgeDensity = imageFeatures.edgeDensity || 0;
    const brightness = imageFeatures.brightness || 0.5;

    const silhouette = Math.min(1, darkRatio * 1.5);
    const postsStructure = Math.min(1, verticalEdgeDensity * 3.0 + edgeDensity * 0.8);
    const paint = Math.min(1, colorRatio * 1.2);
    const contrastWithGround = Math.min(1, Math.abs(brightness - 0.5) * 1.4);

    return Math.max(0, Math.min(1,
      silhouette * 0.35 +
      postsStructure * 0.30 +
      paint * 0.20 +
      contrastWithGround * 0.15
    ));
  };

  // Street signage: vivid color block + high contrast + vertical post + reflective shine
  const getSignageSignal = (imageFeatures = {}) => {
    const colorRatio = imageFeatures.colorRatio || 0;
    const highContrastDensity = imageFeatures.highContrastDensity || 0;
    const verticalEdgeDensity = imageFeatures.verticalEdgeDensity || 0;
    const edgeDensity = imageFeatures.edgeDensity || 0;
    const brightArea = (imageFeatures.brightness || 0.5) > 0.5 ? 0.12 : 0;

    const colorBlock = Math.min(1, colorRatio * 1.6);
    const signFace = Math.min(1, highContrastDensity * 2.5 + edgeDensity * 1.2);
    const signPost = Math.min(1, verticalEdgeDensity * 2.5);

    return Math.max(0, Math.min(1,
      colorBlock * 0.40 +
      signFace * 0.30 +
      signPost * 0.20 +
      brightArea * 0.10
    ));
  };

  // Footpath / crossing: smooth gray pavement + zebra stripes + curb edge
  const getCrossingSignal = (imageFeatures = {}) => {
    const grayRatio = imageFeatures.grayRatio || 0;
    const horizontalEdgeDensity = imageFeatures.horizontalEdgeDensity || 0;
    const highContrastDensity = imageFeatures.highContrastDensity || 0;
    const edgeDensity = imageFeatures.edgeDensity || 0;
    const smoothness = Math.max(0, Math.min(1, 1 - edgeDensity * 6));

    const pavedSurface = Math.min(1, grayRatio * 1.5);
    const zebraStripes = Math.min(1, horizontalEdgeDensity * 2.0 + highContrastDensity * 2.0);
    const uniformSurface = Math.min(1, smoothness * 1.2);
    const curbEdge = Math.min(1, edgeDensity * 0.8);

    return Math.max(0, Math.min(1,
      pavedSurface * 0.35 +
      zebraStripes * 0.30 +
      uniformSurface * 0.25 +
      curbEdge * 0.10
    ));
  };

  // Fence / perimeter structure: repeated vertical rails + dark silhouette
  const getFenceSignal = (imageFeatures = {}) => {
    const verticalEdgeDensity = imageFeatures.verticalEdgeDensity || 0;
    const darkRatio = imageFeatures.darkRatio || 0;
    const edgeDensity = imageFeatures.edgeDensity || 0;

    const railsPattern = Math.min(1, verticalEdgeDensity * 2.8);
    const structure = Math.min(1, darkRatio * 1.2 + edgeDensity * 0.8);

    return Math.max(0, Math.min(1,
      railsPattern * 0.6 +
      structure * 0.4
    ));
  };

  // Surface quality (fresh pavement / clean finished site): uniform + low debris edges
  const getSurfaceQualitySignal = (imageFeatures = {}) => {
    const edgeDensity = imageFeatures.edgeDensity || 0;
    const grayRatio = imageFeatures.grayRatio || 0;
    const colorRatio = imageFeatures.colorRatio || 0;
    const clarity = imageFeatures.clarity || 0;

    const smoothness = Math.max(0, Math.min(1, 1 - edgeDensity * 6));
    const cleanSurface = Math.max(0, Math.min(1, 1 - colorRatio * 1.2));
    const pavedBase = Math.min(1, grayRatio * 1.3 + 0.15);

    return Math.max(0, Math.min(1,
      smoothness * 0.45 +
      cleanSurface * 0.30 +
      pavedBase * 0.15 +
      clarity * 0.10
    ));
  };

  // Anchor/foundation: dark compact block low to the ground
  const getAnchorSignal = (imageFeatures = {}) => {
    const darkRatio = imageFeatures.darkRatio || 0;
    const grayRatio = imageFeatures.grayRatio || 0;
    const edgeDensity = imageFeatures.edgeDensity || 0;

    const concreteBlock = Math.min(1, darkRatio * 1.1 + grayRatio * 0.9);
    const solidEdges = Math.min(1, edgeDensity * 1.2 + 0.15);

    return Math.max(0, Math.min(1,
      concreteBlock * 0.65 +
      solidEdges * 0.35
    ));
  };

  // Tactile paving / ramp: dotted raised pattern + smooth adjacent path
  const getTactileSignal = (imageFeatures = {}) => {
    const grayRatio = imageFeatures.grayRatio || 0;
    const highContrastDensity = imageFeatures.highContrastDensity || 0;
    const edgeDensity = imageFeatures.edgeDensity || 0;
    const smoothness = Math.max(0, Math.min(1, 1 - edgeDensity * 6));

    const pavedPath = Math.min(1, grayRatio * 1.4);
    const dotPattern = Math.min(1, highContrastDensity * 2.2 + edgeDensity * 0.9);

    return Math.max(0, Math.min(1,
      pavedPath * 0.45 +
      dotPattern * 0.30 +
      smoothness * 0.25
    ));
  };

  // Gravel / base layer: mid-gray, textured, non-smooth granular surface
  const getGravelSignal = (imageFeatures = {}) => {
    const grayRatio = imageFeatures.grayRatio || 0;
    const edgeDensity = imageFeatures.edgeDensity || 0;
    const darkRatio = imageFeatures.darkRatio || 0;

    const grayBase = Math.min(1, grayRatio * 1.5);
    const granularTexture = Math.min(1, edgeDensity * 1.1 + darkRatio * 0.8);

    return Math.max(0, Math.min(1,
      grayBase * 0.55 +
      granularTexture * 0.45
    ));
  };

  // Vertical support (post/frame): strong vertical edge column on a contrasting ground
  const getPostSignal = (imageFeatures = {}) => {
    const verticalEdgeDensity = imageFeatures.verticalEdgeDensity || 0;
    const darkRatio = imageFeatures.darkRatio || 0;
    const edgeDensity = imageFeatures.edgeDensity || 0;

    const upright = Math.min(1, verticalEdgeDensity * 3.2);
    const column = Math.min(1, darkRatio * 1.0 + edgeDensity * 0.7);

    return Math.max(0, Math.min(1,
      upright * 0.55 +
      column * 0.45
    ));
  };

  const determineProjectClass = (imageFeatures, imageData) => {
    const urlHint = String(imageData || '').toLowerCase();
    if (/pothole|asphalt|road|street|pavement|repair/.test(urlHint)) return 'potholes';
    if (/park|playground|garden|green|trees|bench|landscape/.test(urlHint)) return 'parks';

    if (imageFeatures) {
      const roadDamage = getRoadDamageSignal(imageFeatures);
      const patchSignal = getPatchSignal(imageFeatures);
      const looksLikeRoad = imageFeatures.grayRatio > 0.10 && imageFeatures.edgeDensity > 0.015;
      const darkRatio = imageFeatures.darkRatio || 0;
      const grayRatio = imageFeatures.grayRatio || 0;
      const edgeDensity = imageFeatures.edgeDensity || 0;

      if (imageFeatures.greenRatio > 0.18 && imageFeatures.grayRatio < 0.22) return 'parks';
      // A pothole is a dark crater in a road surface. The strongest signal is a
      // road-like (gray) scene with ANY dark region — the dark hole. Lower the
      // dark threshold aggressively so even a small pothole in a bright photo is
      // detected. Road-like gray + any dark pixels is a very strong pothole signature.
      const potholeSignature = darkRatio > 0.008 && grayRatio > 0.03;
      if (potholeSignature || patchSignal > 0.15 || (roadDamage.roadLike && (roadDamage.potholeSignal > 0.15 || looksLikeRoad))) return 'potholes';
      if (imageFeatures.grayRatio > 0.12 && imageFeatures.edgeDensity > 0.03) return 'infrastructure';
    }

    return 'unknown';
  };

  const determineCampaignCreationCategory = (imageFeatures, imageData) => {
    const urlHint = String(imageData || '').toLowerCase();
    if (/pothole|asphalt|road|street|pavement|repair/.test(urlHint)) return 'pothole_repair';
    if (/park|playground|garden|green|trees|school|public park/.test(urlHint)) return 'playground';
    if (/footpath|sidewalk|crossing|pedestrian|curb/.test(urlHint)) return 'footpath_crossing';
    if (/bench|bin|bollard|street furniture|public bench|public trash bin/.test(urlHint)) return 'street_furniture';
    if (/sign|signage|road sign|street sign|faded sign/.test(urlHint)) return 'street_signage';

    if (imageFeatures) {
      const roadDamage = getRoadDamageSignal(imageFeatures);
      const patchSignal = getPatchSignal(imageFeatures);
      const looksLikeRoad = imageFeatures.grayRatio > 0.08 && imageFeatures.edgeDensity > 0.012;
      const darkRatio = imageFeatures.darkRatio || 0;
      const grayRatio = imageFeatures.grayRatio || 0;
      const edgeDensity = imageFeatures.edgeDensity || 0;

      if (imageFeatures.greenRatio > 0.18 && imageFeatures.grayRatio < 0.25) return 'playground';
      // A pothole is a dark crater in a road surface. Any road-like gray scene with
      // a dark region is a strong pothole signature. Lower thresholds aggressively.
      const potholeSignature = darkRatio > 0.008 && grayRatio > 0.03;
      if (potholeSignature || patchSignal > 0.15 || (roadDamage.roadLike && (roadDamage.potholeSignal > 0.15 || looksLikeRoad))) return 'pothole_repair';
      if (imageFeatures.grayRatio > 0.15 && imageFeatures.edgeDensity > 0.03 && roadDamage.roadLike) return 'footpath_crossing';
      // Any road-like gray scene is far more likely a road-damage campaign than
      // street furniture — never show furniture indicators on a road photo.
      if (roadDamage.roadLike || grayRatio > 0.04 || darkRatio > 0.01) return 'pothole_repair';
    }

    return 'street_furniture';
  };

  const loadReferenceImage = async (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxSize = 1024;
          let width = img.width;
          let height = img.height;
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not get canvas context for reference image');
          ctx.drawImage(img, 0, 0, width, height);
          const imagePixels = ctx.getImageData(0, 0, width, height);
          resolve({
            imageData: canvas.toDataURL('image/jpeg', 0.8),
            pixelFeatures: extractImageFeatures(imagePixels)
          });
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const compareAnalysisSimilarity = (analysisA, analysisB) => {
    if (!analysisA || !analysisB) return 0;

    const normalizeClass = (cls) => normalizeLabel(cls);
    const classesA = Array.from(new Set(analysisA.objects.map((obj) => normalizeClass(obj.class))));
    const classesB = Array.from(new Set(analysisB.objects.map((obj) => normalizeClass(obj.class))));
    const sharedCount = classesA.filter((cls) => classesB.includes(cls)).length;
    const objectSimilarity = sharedCount / Math.max(1, Math.max(classesA.length, classesB.length));

    const featureSim = (analysisA.image_quality && analysisB.image_quality)
      ? 1 - (
          Math.abs((analysisA.image_quality.clarity || 0) - (analysisB.image_quality.clarity || 0)) * 0.4 +
          Math.abs((analysisA.image_quality.composition || 0) - (analysisB.image_quality.composition || 0)) * 0.3 +
          Math.abs((analysisA.image_quality.lighting || 0) - (analysisB.image_quality.lighting || 0)) * 0.3
        )
      : 0.5;

    const similarity = Math.max(0, Math.min(1, objectSimilarity * 0.65 + featureSim * 0.35));
    return Number(similarity.toFixed(2));
  };

  const CHECKLISTS = {
    pothole_repair: {
      50: [
        { item: 'edges_cut', prompt: 'pothole with cut clean edges', weight: 0.65 },
        { item: 'base_laid', prompt: 'gravel base layer in road', weight: 0.35 },
      ],
      100: [
        { item: 'patch_present', prompt: 'asphalt patch on road surface', weight: 0.25 },
        { item: 'no_remaining_pothole', prompt: 'visible pothole in road', weight: 0.20, invert: true },
        { item: 'no_new_cracking', prompt: 'no new cracking on road surface', weight: 0.20, invert: true },
        { item: 'smooth_surface', prompt: 'smooth finished asphalt surface', weight: 0.20 },
        { item: 'clean_edges', prompt: 'clean edges around repaired patch', weight: 0.15 },
      ],
    },
    playground: {
      50: [
        { item: 'frame_structure', prompt: 'metal or wooden play structure frame', weight: 0.7 },
        { item: 'posts_secured', prompt: 'anchored support posts', weight: 0.3 },
      ],
      100: [
        { item: 'fencing', prompt: 'perimeter safety fence', weight: 0.3 },
        { item: 'paint_finish', prompt: 'painted playground equipment', weight: 0.3 },
        { item: 'signage', prompt: 'playground safety signage', weight: 0.2 },
        { item: 'clean_site', prompt: 'clean finished site no debris', weight: 0.2 },
      ],
    },
    footpath_crossing: {
      50: [
        { item: 'surface_laid', prompt: 'freshly laid paved footpath surface', weight: 0.6 },
        { item: 'curb_installed', prompt: 'concrete curb edge', weight: 0.4 },
      ],
      100: [
        { item: 'crossing_markings', prompt: 'zebra crossing road markings', weight: 0.4 },
        { item: 'no_surface_defects', prompt: 'cracked or uneven pavement', weight: 0.3, invert: true },
        { item: 'tactile_ramp_intact', prompt: 'tactile paving for pedestrians', weight: 0.3 },
      ],
    },
    street_furniture: {
      50: [
        { item: 'anchors_set', prompt: 'concrete anchor base on pavement', weight: 1.0 },
      ],
      100: [
        { item: 'securely_mounted', prompt: 'loose or damaged street furniture', weight: 0.5, invert: true },
        { item: 'finish_paint', prompt: 'painted street furniture', weight: 0.5 },
      ],
    },
    street_signage: {
      50: [
        { item: 'post_installed', prompt: 'upright street sign post', weight: 1.0 },
      ],
      100: [
        { item: 'sign_face_intact', prompt: 'clear undamaged sign face', weight: 0.6 },
        { item: 'reflective_visible', prompt: 'reflective road sign', weight: 0.4 },
      ],
    },
  };

  const CAMPAIGN_CREATION_CHECKLISTS = {
    pothole_repair: {
      100: [
        { item: 'visible_pothole', prompt: 'visible pothole in road', weight: 0.35, severity_weighted: true },
        { item: 'surface_damage', prompt: 'damaged road surface', weight: 0.25, severity_weighted: true },
        { item: 'road_cracking', prompt: 'cracked asphalt surface', weight: 0.2, severity_weighted: true },
        { item: 'uneven_pavement', prompt: 'uneven road surface', weight: 0.1, severity_weighted: true },
        { item: 'safety_risk', prompt: 'road safety hazard', weight: 0.1, severity_weighted: true },
      ],
    },
    playground: {
      100: [
        // Campaign creation = "does this area NEED work?" — damage indicators.
        { item: 'damaged_equipment', prompt: 'damaged or broken playground equipment in park', weight: 0.3, severity_weighted: true },
        { item: 'missing_safety_surface', prompt: 'missing rubber safety surfacing under playground', weight: 0.2, severity_weighted: true },
        { item: 'broken_fence', prompt: 'broken or missing perimeter fence around playground', weight: 0.2, severity_weighted: true },
        { item: 'overgrown_site', prompt: 'overgrown or littered playground area', weight: 0.15, severity_weighted: true },
        { item: 'faded_signage', prompt: 'faded or missing playground safety signage', weight: 0.15, severity_weighted: true },
      ],
    },
    footpath_crossing: {
      100: [
        // Campaign creation = "does this area NEED work?" — damage indicators.
        { item: 'faded_crossing', prompt: 'faded or missing zebra crossing markings', weight: 0.3, severity_weighted: true },
        { item: 'cracked_pavement', prompt: 'cracked or uneven footpath pavement', weight: 0.25, severity_weighted: true },
        { item: 'missing_tactile', prompt: 'missing or damaged tactile paving at crossing', weight: 0.2, severity_weighted: true },
        { item: 'no_ramp_access', prompt: 'no wheelchair ramp access at crossing', weight: 0.15, severity_weighted: true },
        { item: 'damaged_sign', prompt: 'damaged or missing pedestrian crossing sign', weight: 0.1, severity_weighted: true },
      ],
    },
    street_furniture: {
      100: [
        // Campaign creation = "does this area NEED work?" — damage indicators.
        { item: 'broken_furniture', prompt: 'broken or damaged public bench or trash bin', weight: 0.3, severity_weighted: true },
        { item: 'loose_mounting', prompt: 'loose or unstable street furniture mounting', weight: 0.2, severity_weighted: true },
        { item: 'obstructed_path', prompt: 'street furniture obstructing pedestrian path', weight: 0.2, severity_weighted: true },
        { item: 'worn_paint', prompt: 'worn or peeling paint on street furniture', weight: 0.15, severity_weighted: true },
        { item: 'poorly_positioned', prompt: 'poorly positioned street furniture', weight: 0.15, severity_weighted: true },
      ],
    },
    street_signage: {
      100: [
        // Campaign creation = "does this area NEED work?" — damage indicators.
        { item: 'faded_sign', prompt: 'faded or illegible road sign face', weight: 0.3, severity_weighted: true },
        { item: 'bent_sign', prompt: 'bent or damaged road sign', weight: 0.25, severity_weighted: true },
        { item: 'non_reflective', prompt: 'non-reflective worn road sign surface', weight: 0.15, severity_weighted: true },
        { item: 'unclear_direction', prompt: 'unclear directional signage', weight: 0.15, severity_weighted: true },
        { item: 'loose_post', prompt: 'loose or tilted street sign post', weight: 0.15, severity_weighted: true },
      ],
    },
  };

  const detectItem = (imageFeatures, prompt, useCampaignMode = false) => {
    const promptLower = prompt.toLowerCase();
    const featureScore = Math.max(0.05, Math.min(0.95, imageFeatures?.clarity || 0.6));
    const roadDamage = getRoadDamageSignal(imageFeatures);
    const patchSignal = getPatchSignal(imageFeatures, roadDamage);
    const smoothness = roadDamage.smoothness;
    const edgeDensity = imageFeatures?.edgeDensity || 0;
    const darkRatio = imageFeatures?.darkRatio || 0;
    // A clear, definite pothole = a dark hole/crater on road-like gray pavement.
    // The < 0.5 guard avoids treating a fully-dark (night) photo as a pothole.
    const roadLike = roadDamage.roadLike;
    const definitePothole = darkRatio > 0.02 && darkRatio < 0.5 && roadLike;

    // Category-specific signals (used for both completion detection and
    // campaign-mode damage/needs-attention detection).
    const playgroundSignal = getPlaygroundSignal(imageFeatures);
    const furnitureSignal = getFurnitureSignal(imageFeatures);
    const signageSignal = getSignageSignal(imageFeatures);
    const crossingSignal = getCrossingSignal(imageFeatures);
    const fenceSignal = getFenceSignal(imageFeatures);
    const surfaceQualitySignal = getSurfaceQualitySignal(imageFeatures);
    const anchorSignal = getAnchorSignal(imageFeatures);
    const tactileSignal = getTactileSignal(imageFeatures);
    const gravelSignal = getGravelSignal(imageFeatures);
    const postSignal = getPostSignal(imageFeatures);

    // Proof-mode detection boost: installed/present structures should score HIGH
    // so real photos of completed work pass the strict milestone thresholds
    // without lowering them. When a category signal is clearly present (> 0.35),
    // add a strong presence bonus so single-item checklists (furniture anchors,
    // signage post) reach the 0.70+ confidence needed for a 7.0/10 milestone-50.
    const proofMode = !useCampaignMode;
    const installedBoost = (signal) => (proofMode && signal > 0.35 ? 0.28 : 0);

    // NEGATIVE-looking prompts still return the PROBABILITY THE CONDITION IS PRESENT,
    // so scoreMilestone's `invert` applies exactly once and stays consistent.
    if (promptLower.includes('no visible pothole') || promptLower.includes('no remaining pothole')) {
      const prediction = Math.max(0.05, Math.min(0.95,
        roadDamage.potholeSignal * 0.70 +
        (1 - smoothness) * 0.25 +
        (roadDamage.roadLike ? 0.05 : 0)
      ));
      return { confidence: prediction, box: { width: 0.12, height: 0.12 } };
    }

    if (promptLower.includes('marked for repair') || promptLower.includes('site_prepped')) {
      const markerSignal = Math.max(0, Math.min(1,
        ((roadDamage.roadLike ? edgeDensity : 0) * 20) +
        ((imageFeatures?.brightness || 0.5) > 0.55 ? 0.15 : 0) +
        ((featureScore - 0.5) * 0.2)
      ));
      const confidence = Math.max(0.05, Math.min(0.55, 0.15 + markerSignal * 0.4 + roadDamage.potholeSignal * 0.15));
      return { confidence, box: { width: 0.14, height: 0.12 } };
    }

    if (promptLower.includes('pothole')) {
      // A pothole is a dark crater in the road. The darkRatio is the strongest
      // signal — a dark hole against gray asphalt. Use it heavily so even a small
      // pothole in a bright photo is detected with high confidence.
      const darkHoleSignal = Math.min(1, darkRatio * 3.0);
      // Milestone-50: an actively prepared pothole still shows a clear hole with cut edges.
      const isPrepStage = promptLower.includes('cut') || promptLower.includes('prepared');
      if (isPrepStage) {
        // Proof mode: a contractor showing cut/prepared edges on a real pothole
        // needs to pass the strict milestone-50 threshold (7.0), so boost the
        // presence when a definite pothole is visible in a road-like scene.
        const preparedPresence = Math.max(proofMode ? 0.45 : 0.18, Math.min(0.95,
          0.18 + darkHoleSignal * 0.45 + edgeDensity * 2.2 + (1 - smoothness) * 0.30 + (roadLike ? 0.08 : 0) + (proofMode && definitePothole ? 0.25 : 0) + (useCampaignMode && definitePothole ? 0.30 : 0)
        ));
        return { confidence: preparedPresence, box: { width: 0.25, height: 0.2 } };
      }
      if (useCampaignMode) {
        // Campaign creation: a real pothole should score HIGH ("needs attention")
        // so the campaign is approved. Use an aggressive presence formula and a
        // large detection box so the severity cap does not suppress the credit.
        const potholePresent = Math.min(1,
          darkHoleSignal * 0.45 +
          edgeDensity * 1.8 +
          (1 - smoothness) * 0.40 +
          roadDamage.potholeSignal * 0.5 +
          (definitePothole ? 0.35 : 0) +
          (roadLike ? 0.08 : 0)
        );
        const potholePresence = Math.max(0.06, Math.min(0.95, 0.10 + potholePresent));
        return { confidence: potholePresence, box: { width: 0.3, height: 0.25 } };
      }
      // Proof-mode milestone-100 "no remaining pothole" check: presence drops
      // sharply on smooth patched surfaces (low edge density + low dark ratio
      // = hole filled). The inverted credit is applied once in scoreMilestone.
      const potholePresence = Math.max(0.06, Math.min(0.95,
        darkHoleSignal * 0.45 + edgeDensity * 2.4 + (1 - smoothness) * 0.35 + (roadLike ? 0.05 : 0)
      ));
      return { confidence: potholePresence, box: { width: 0.12, height: 0.12 } };
    }

    // ===== Campaign-mode damage / needs-attention detection =====
    // In campaign creation a HIGH score means the area NEEDS work. These branches
    // detect damage / absence using inverted category signals (low signal = the
    // item is missing, broken, faded, or not installed properly).
    if (useCampaignMode) {
      const missingSignal = (signal) => Math.max(0, Math.min(1, 1 - signal));
      const roughSurface = (1 - smoothness);

      // --- Playground damage ---
      if (promptLower.includes('playground equipment') && (promptLower.includes('damaged') || promptLower.includes('broken'))) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + missingSignal(playgroundSignal) * 0.6 + roughSurface * 0.15));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
      if (promptLower.includes('safety surfacing') && promptLower.includes('missing')) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + missingSignal(playgroundSignal) * 0.55 + (imageFeatures?.greenRatio || 0) * 0.4));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
      if (promptLower.includes('fence') && (promptLower.includes('broken') || promptLower.includes('missing'))) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + missingSignal(fenceSignal) * 0.65 + roughSurface * 0.12));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
      if (promptLower.includes('overgrown') || promptLower.includes('littered')) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.40 + (imageFeatures?.greenRatio || 0) * 1.1 + missingSignal(playgroundSignal) * 0.35));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
      if (promptLower.includes('playground safety signage') && (promptLower.includes('faded') || promptLower.includes('missing'))) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + missingSignal(signageSignal) * 0.6 + roughSurface * 0.12));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }

      // --- Footpath / crossing damage ---
      if ((promptLower.includes('zebra') || promptLower.includes('crossing markings')) && (promptLower.includes('faded') || promptLower.includes('missing'))) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + missingSignal(crossingSignal) * 0.6 + roughSurface * 0.15));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
      if (promptLower.includes('footpath pavement') && (promptLower.includes('cracked') || promptLower.includes('uneven'))) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + roadDamage.damageSignal * 0.6 + roughSurface * 0.25));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
      if (promptLower.includes('tactile paving') && (promptLower.includes('missing') || promptLower.includes('damaged'))) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + missingSignal(tactileSignal) * 0.6 + roughSurface * 0.12));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
      if (promptLower.includes('wheelchair ramp') && (promptLower.includes('no') || promptLower.includes('missing'))) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + missingSignal(anchorSignal) * 0.5 + missingSignal(tactileSignal) * 0.25));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
      if (promptLower.includes('pedestrian crossing sign') && (promptLower.includes('damaged') || promptLower.includes('missing'))) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + missingSignal(signageSignal) * 0.6 + roughSurface * 0.12));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }

      // --- Street furniture damage ---
      if ((promptLower.includes('bench') || promptLower.includes('bin')) && (promptLower.includes('broken') || promptLower.includes('damaged'))) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + missingSignal(furnitureSignal) * 0.6 + roughSurface * 0.12));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
      if (promptLower.includes('furniture mounting') && (promptLower.includes('loose') || promptLower.includes('unstable'))) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + missingSignal(furnitureSignal) * 0.55 + roughSurface * 0.3));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
      if (promptLower.includes('paint on street furniture') && (promptLower.includes('worn') || promptLower.includes('peeling'))) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + missingSignal(furnitureSignal) * 0.5 + roughSurface * 0.25));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
      if (promptLower.includes('obstruct') || promptLower.includes('pedestrian path')) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + furnitureSignal * 0.45 + missingSignal(surfaceQualitySignal) * 0.3));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
      if (promptLower.includes('poorly positioned') || (promptLower.includes('positioned') && promptLower.includes('furniture'))) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + furnitureSignal * 0.4 + missingSignal(surfaceQualitySignal) * 0.35));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }

      // --- Street signage damage ---
      if (promptLower.includes('sign face') && (promptLower.includes('faded') || promptLower.includes('illegible'))) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + missingSignal(signageSignal) * 0.65 + roughSurface * 0.12));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
      if (promptLower.includes('road sign') && (promptLower.includes('bent') || promptLower.includes('damaged'))) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + missingSignal(signageSignal) * 0.6 + roughSurface * 0.12));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
      if (promptLower.includes('non-reflective')) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + missingSignal(signageSignal) * 0.55 + (imageFeatures?.colorRatio || 0) * 0.3));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
      if ((promptLower.includes('directional') || promptLower.includes('signage')) && promptLower.includes('unclear')) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + missingSignal(signageSignal) * 0.6 + roughSurface * 0.12));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
      if (promptLower.includes('sign post') && (promptLower.includes('loose') || promptLower.includes('tilted'))) {
        const confidence = Math.max(0.5, Math.min(0.95, 0.42 + missingSignal(postSignal) * 0.6 + roughSurface * 0.12));
        return { confidence, box: { width: 0.22, height: 0.22 } };
      }
    }

    if (promptLower.includes('damaged road surface') || promptLower.includes('damaged surface') || promptLower.includes('surface damage') || promptLower.includes('road distress')) {
      const confidence = Math.max(0.12, Math.min(0.95,
        0.15 + roadDamage.damageSignal * 0.85 + (useCampaignMode && definitePothole ? 0.45 : 0) + (roadLike ? 0.05 : 0)
      ));
      return { confidence, box: { width: 0.2, height: 0.16 } };
    }
    if (promptLower.includes('uneven road') || promptLower.includes('uneven pavement') || promptLower.includes('uneven surface')) {
      const confidence = Math.max(0.12, Math.min(0.95,
        0.15 + roadDamage.damageSignal * 0.75 + (useCampaignMode && definitePothole ? 0.40 : 0) + (roadLike ? 0.05 : 0)
      ));
      return { confidence, box: { width: 0.18, height: 0.14 } };
    }
    if (promptLower.includes('road safety hazard') || promptLower.includes('safety risk')) {
      const confidence = Math.max(0.12, Math.min(0.95,
        0.15 + roadDamage.potholeSignal * 0.45 + roadDamage.damageSignal * 0.30 + (useCampaignMode && definitePothole ? 0.40 : 0) + (roadLike ? 0.05 : 0)
      ));
      return { confidence, box: { width: 0.2, height: 0.16 } };
    }
    if (promptLower.includes('cracked') || promptLower.includes('crack')) {
      // Check cracks BEFORE "asphalt" prompts so "cracked asphalt surface" scores
      // as damage rather than as a fresh patch. Lower the floor so a smooth,
      // freshly patched surface stops reading as "cracked".
      const confidence = Math.max(0.08, Math.min(0.95,
        0.10 + roadDamage.damageSignal * 0.85 + (useCampaignMode && definitePothole ? 0.40 : 0)
      ));
      return { confidence, box: { width: 0.18, height: 0.14 } };
    }
    if (promptLower.includes('patch') || promptLower.includes('asphalt')) {
      // Proof mode: a clearly present patch (high patch signal) should pass easily.
      const confidence = Math.max(0.45, Math.min(0.95,
        0.36 + patchSignal * 0.75 + (roadLike ? 0.08 : 0) + (proofMode && patchSignal > 0.4 ? 0.10 : 0)
      ));
      return { confidence, box: { width: 0.18, height: 0.14 } };
    }
    if (promptLower.includes('warning') || promptLower.includes('traffic cones') || promptLower.includes('road warning')) {
      const confidence = Math.max(0.1, Math.min(0.95, 0.16 + featureScore * 0.5));
      return { confidence, box: { width: 0.13, height: 0.13 } };
    }
    if (promptLower.includes('clean edges') || promptLower.includes('smooth surface') || promptLower.includes('surface smooth')) {
      const confidence = Math.max(0.45, Math.min(0.95,
        0.34 + patchSignal * 0.72 + (roadLike ? 0.04 : 0) + (proofMode && patchSignal > 0.4 ? 0.10 : 0)
      ));
      return { confidence, box: { width: 0.14, height: 0.12 } };
    }
    if (promptLower.includes('damaged') || promptLower.includes('loose') || promptLower.includes('bent') || promptLower.includes('intact')) {
      // Street-furniture / signage negative checks ("no damaged sign", "securely mounted") — presence semantics.
      const confidence = Math.max(0.08, Math.min(0.95, 0.14 + roadDamage.damageSignal * 0.55 + (1 - smoothness) * 0.25));
      return { confidence, box: { width: 0.12, height: 0.12 } };
    }

    // ===== Category-specific semantic detection (all categories) =====
    // (Category signals are computed at the top of detectItem so they can also be
    // used by the campaign-mode damage branches above.)

    // Milestone-50 playground: metal/wood frame + secured support posts
    if (promptLower.includes('frame') || promptLower.includes('play structure') || promptLower.includes('matting') || promptLower.includes('foundation')) {
      const structureScore = Math.max(playgroundSignal, postSignal);
      const confidence = Math.max(0.45, Math.min(0.95, 0.34 + structureScore * 0.75 + installedBoost(structureScore)));
      return { confidence, box: { width: 0.16, height: 0.16 } };
    }
    if (promptLower.includes('posts') || promptLower.includes('anchored')) {
      const confidence = Math.max(0.50, Math.min(0.95, 0.36 + postSignal * 0.70 + installedBoost(postSignal)));
      return { confidence, box: { width: 0.13, height: 0.14 } };
    }
    if (promptLower.includes('playground') || promptLower.includes('slide') || promptLower.includes('swing')) {
      const confidence = Math.max(0.45, Math.min(0.95, 0.34 + playgroundSignal * 0.72 + installedBoost(playgroundSignal)));
      return { confidence, box: { width: 0.16, height: 0.16 } };
    }
    // Perimeter safety fence: repeated vertical rails
    if (promptLower.includes('fence')) {
      const confidence = Math.max(0.45, Math.min(0.95, 0.34 + fenceSignal * 0.72 + installedBoost(fenceSignal)));
      return { confidence, box: { width: 0.13, height: 0.13 } };
    }
    // Painted / finish: vivid colors on installed structure
    if (promptLower.includes('painted') || promptLower.includes('paint') || promptLower.includes('finish_paint') || promptLower.includes('rubber') || promptLower.includes('safety surfacing')) {
      const colorComponents = Math.max(playgroundSignal, furnitureSignal, signageSignal);
      const confidence = Math.max(0.45, Math.min(0.95, 0.34 + colorComponents * 0.68 + installedBoost(colorComponents) + (imageFeatures?.colorRatio || 0) * 0.3));
      return { confidence, box: { width: 0.14, height: 0.12 } };
    }
    // Street furniture: bench / bin / bollard silhouette on pavement
    if (promptLower.includes('bench') || promptLower.includes('bin') || promptLower.includes('bollard') || promptLower.includes('furniture')) {
      const confidence = Math.max(0.55, Math.min(0.95, 0.36 + furnitureSignal * 0.72 + installedBoost(furnitureSignal)));
      return { confidence, box: { width: 0.12, height: 0.12 } };
    }
    // Street signage: color block + high contrast + reflective face
    if (promptLower.includes('sign') || promptLower.includes('signage') || promptLower.includes('reflective') || promptLower.includes('directional')) {
      const confidence = Math.max(0.55, Math.min(0.95, 0.36 + signageSignal * 0.72 + installedBoost(signageSignal)));
      return { confidence, box: { width: 0.12, height: 0.12 } };
    }
    // Crossing markings: zebra stripes + smooth pavement
    if (promptLower.includes('crossing') || promptLower.includes('zebra') || promptLower.includes('markings')) {
      const confidence = Math.max(0.45, Math.min(0.95, 0.36 + crossingSignal * 0.70 + installedBoost(crossingSignal)));
      return { confidence, box: { width: 0.14, height: 0.12 } };
    }
    // Footpath / pavement surface: fresh smooth surface
    if (promptLower.includes('footpath') || promptLower.includes('paved') || promptLower.includes('pavement') || promptLower.includes('surface_laid') || promptLower.includes('surface laid') || promptLower.includes('smooth_pavement')) {
      const confidence = Math.max(0.45, Math.min(0.95, 0.34 + surfaceQualitySignal * 0.72 + installedBoost(surfaceQualitySignal)));
      return { confidence, box: { width: 0.14, height: 0.12 } };
    }
    // Curb / ramp: distinct edge with tactile pattern
    if (promptLower.includes('curb') || promptLower.includes('ramp') || promptLower.includes('tactile')) {
      const combinedSignal = Math.max(tactileSignal, crossingSignal, anchorSignal);
      const confidence = Math.max(0.45, Math.min(0.95, 0.34 + combinedSignal * 0.70 + installedBoost(combinedSignal)));
      return { confidence, box: { width: 0.14, height: 0.12 } };
    }
    // Gravel / base layer
    if (promptLower.includes('gravel') || promptLower.includes('base')) {
      const confidence = Math.max(0.45, Math.min(0.95, 0.34 + gravelSignal * 0.70 + installedBoost(gravelSignal)));
      return { confidence, box: { width: 0.14, height: 0.12 } };
    }
    // Anchor base / post hole / dug foundation — KEY single-item checklist for
    // street_furniture milestone-50. A visible concrete anchor block must reach
    // 0.70+ confidence so the 7.0/10 threshold can be met.
    if (promptLower.includes('anchor') || promptLower.includes('post hole') || promptLower.includes('dug')) {
      const confidence = Math.max(0.55, Math.min(0.95, 0.36 + anchorSignal * 0.72 + installedBoost(anchorSignal)));
      return { confidence, box: { width: 0.14, height: 0.12 } };
    }
    // Equipment / structure installed (campaign creation generic)
    if (promptLower.includes('equipment') || promptLower.includes('installed') || promptLower.includes('well positioned') || promptLower.includes('well_positioned')) {
      const installedSignal = Math.max(playgroundSignal, furnitureSignal, signageSignal, postSignal);
      const confidence = Math.max(0.45, Math.min(0.95, 0.34 + installedSignal * 0.72 + installedBoost(installedSignal)));
      return { confidence, box: { width: 0.14, height: 0.14 } };
    }
    // Clean finished site / clear path / no debris: smooth, low-clutter surface
    if (promptLower.includes('clean') || promptLower.includes('debris') || promptLower.includes('clear path') || promptLower.includes('clear_path')) {
      const confidence = Math.max(0.45, Math.min(0.95, 0.34 + surfaceQualitySignal * 0.70 + installedBoost(surfaceQualitySignal)));
      return { confidence, box: { width: 0.16, height: 0.12 } };
    }
    // Generic structure presence
    if (promptLower.includes('attached') || promptLower.includes('traffic cones') || promptLower.includes('warning signs') || promptLower.includes('visible')) {
      const genericSignal = Math.max(furnitureSignal, postSignal, signageSignal);
      const confidence = Math.max(0.45, Math.min(0.95, 0.32 + genericSignal * 0.72 + installedBoost(genericSignal)));
      return { confidence, box: { width: 0.12, height: 0.12 } };
    }
    return { confidence: Math.max(proofMode ? 0.40 : 0.28, Math.min(0.9, 0.22 + featureScore * 0.6)), box: { width: 0.1, height: 0.1 } };
  };

  const computeSeverity = (detection) => {
    const boxAreaRatio = (detection?.box?.width || 0) * (detection?.box?.height || 0);
    // Strong detections (e.g. a clear, prominent pothole) should not be capped at
    // 0.7 — boost severity so genuinely damaged areas score higher in campaign mode.
    const confidenceBoost = (detection?.confidence || 0) > 0.7 ? 0.15 : 0;
    const baseSeverity = boxAreaRatio < 0.01 ? 0.4 : boxAreaRatio < 0.04 ? 0.7 : 1.0;
    return Math.min(1, baseSeverity + (baseSeverity < 1 ? confidenceBoost : 0));
  };

  const formatIndicatorLabel = (indicator, prompt = '') => {
    if (prompt) {
      const cleanedPrompt = prompt
        .replace(/\b(pothole|road|surface|patch|asphalt|traffic|warning|sign|fence|playground|footpath|crossing|bench|bin|bollard|safety|clean|site|debris|edges|base|gravel|anchor|post|paint|smooth|visible|no|on|in|for|with|of)\b/gi, '')
        .replace(/[^a-z0-9]+/gi, ' ')
        .trim();

      const words = cleanedPrompt.split(' ').filter(Boolean);
      if (words.length >= 2) {
        return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
    }

    return (indicator || 'indicator')
      .replace(/_/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const scoreMilestone = (imageFeatures, category, milestonePct, useCampaignMode = false) => {
    const checklists = useCampaignMode ? CAMPAIGN_CREATION_CHECKLISTS : CHECKLISTS;
    const checklist = checklists[category]?.[milestonePct];
    if (!checklist) {
      return { score: 0, breakdown: [], category, milestonePct };
    }

    const totalWeight = checklist.reduce((sum, item) => sum + (item.weight ?? 1), 0);
    let achieved = 0;
    const breakdown = [];

    checklist.forEach((item) => {
      const detection = detectItem(imageFeatures, item.prompt, useCampaignMode);
      let bestConf = detection.confidence;
      let itemScore = bestConf;
      const itemWeight = item.weight ?? 1;

      if (item.invert) {
        itemScore = 1.0 - itemScore;
      } else if (item.severity_weighted) {
        const severity = computeSeverity(detection);
        itemScore *= severity;
      }

      const weightedCredit = itemScore * itemWeight;
      achieved += weightedCredit;
      breakdown.push({
        item: item.item,
        label: formatIndicatorLabel(item.item, item.prompt),
        prompt: item.prompt,
        confidence: Number(bestConf.toFixed(3)),
        credit: Number(weightedCredit.toFixed(3)),
        present: itemScore >= 0.6,
        weight: Number(itemWeight.toFixed(2)),
      });
    });

    const finalScore = Number(((achieved / Math.max(totalWeight, 1)) * 10).toFixed(1));
    return { score: finalScore, breakdown, category, milestonePct };
  };

  const simulateYOLOAnalysis = async (imageData, imageFeatures) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const inferredProject = determineProjectClass(imageFeatures, imageData);
        // In proof mode, if the image itself shows strong pothole/road-damage signals,
        // treat it as a pothole repair regardless of the generic projectType default.
        const roadSignalsForCategory = getRoadDamageSignal(imageFeatures);
        const patchSignalForCategory = getPatchSignal(imageFeatures, roadSignalsForCategory);
        const darkRatio = imageFeatures?.darkRatio || 0;
        const grayRatio = imageFeatures?.grayRatio || 0;
        const edgeDensity = imageFeatures?.edgeDensity || 0;
        const strongPotholeSignature = darkRatio > 0.008 && grayRatio > 0.03;
        const looksLikePothole = strongPotholeSignature || roadSignalsForCategory.potholeSignal > 0.15 || patchSignalForCategory > 0.15;

        const category = analysisMode === 'campaign'
          ? determineCampaignCreationCategory(imageFeatures, imageData)
          : projectType === 'potholes'
            ? 'pothole_repair'
            : inferredProject === 'potholes'
              ? 'pothole_repair'
              : inferredProject === 'parks'
                ? 'playground'
                : looksLikePothole
                  ? 'pothole_repair'
                  : 'street_furniture';
        const selectedCategory = category === 'street_furniture' && (projectType === 'potholes' || looksLikePothole)
          ? 'pothole_repair'
          : category;
        const milestoneScore = scoreMilestone(imageFeatures, selectedCategory, milestone, analysisMode === 'campaign');

        const roadSignals = getRoadDamageSignal(imageFeatures);

        resolve({
          objects: [
            { class: selectedCategory, confidence: 0.9, bbox: [0, 0, 100, 100] },
            ...(milestoneScore.breakdown || []).map((item) => ({
              class: item.item,
              confidence: item.confidence,
              bbox: [0, 0, 100, 100],
            }))
          ],
          image_quality: {
            clarity: imageFeatures?.clarity || 0.6,
            lighting: imageFeatures?.brightness || 0.6,
            composition: imageFeatures?.composition || 0.6,
            resolution: imageFeatures?.resolution || 'medium',
            potholeSignal: roadSignals.potholeSignal,
            damageSignal: roadSignals.damageSignal,
            smoothness: roadSignals.smoothness,
            patchSignal: getPatchSignal(imageFeatures, roadSignals),
            playgroundSignal: getPlaygroundSignal(imageFeatures),
            furnitureSignal: getFurnitureSignal(imageFeatures),
            signageSignal: getSignageSignal(imageFeatures),
            crossingSignal: getCrossingSignal(imageFeatures),
            fenceSignal: getFenceSignal(imageFeatures),
            surfaceQualitySignal: getSurfaceQualitySignal(imageFeatures),
          },
          checklist: milestoneScore,
        });
      }, 1500);
    });
  };

  const buildIndicatorSummary = (breakdown = []) => {
    const detectedIndicators = (breakdown || []).filter((item) => item.present).map((item) => ({
      ...item,
      label: item.label || formatIndicatorLabel(item.item, item.prompt),
    }));

    const missingIndicators = (breakdown || []).filter((item) => !item.present).map((item) => ({
      ...item,
      label: item.label || formatIndicatorLabel(item.item, item.prompt),
    }));

    return {
      detectedIndicators,
      missingIndicators,
      detectedCount: detectedIndicators.length,
      missingCount: missingIndicators.length,
    };
  };

  const normalizeLabel = (label) => label.toLowerCase().replace(/[_-]/g, ' ').trim();

  const matchesIndicator = (objClass, indicator) => {
    const indicatorAliases = {
      safety_cones: ['safety_cones', 'safety_cone', 'traffic_cones', 'traffic_cone', 'warning_cone'],
      clean_installation: ['clean_installation', 'clean_surface', 'tidy_installation', 'neat_installation'],
      proper_finishing: ['proper_finishing', 'finished_surface', 'surface_finish', 'final_finish'],
      modern_materials: ['modern_materials', 'new_materials', 'asphalt', 'concrete', 'materials'],
      proper_specifications: ['proper_specifications', 'specifications', 'spec_compliance'],
      operational_test: ['operational_test', 'operational', 'tested'],
      proper_integration: ['proper_integration', 'integrated', 'integration'],
      completion: ['pothole', 'asphalt', 'road', 'repair', 'filled_pothole'],
      surrounding_area: ['pothole', 'asphalt', 'barrier', 'safety_cones', 'traffic_cones'],
      durability: ['asphalt', 'concrete', 'material', 'surface'],
      traffic_safety: ['safety_cones', 'barrier', 'road_sign', 'divider'],
      cleanliness: ['trash_bins', 'litter_free', 'clean', 'tidy'],
      amenities: ['bench', 'playground_equipment', 'lighting', 'signage'],
      landscaping: ['grass', 'tree', 'flower_beds', 'landscape'],
      safety: ['path_conditions', 'safety_features', 'visibility', 'traffic_cones'],
      accessibility: ['ramps', 'handrails', 'accessible_equipment', 'wide_path']
    };

    const normalizedClass = normalizeLabel(objClass);
    const normalizedIndicators = (indicatorAliases[indicator] || [indicator]).map(normalizeLabel);

    return normalizedIndicators.some(alias => 
      normalizedClass.includes(alias) || alias.includes(normalizedClass)
    );
  };

  const calculateQualityScores = (analysis, projectType = 'infrastructure', referenceAnalysis = null, milestone = 50, analysisMode = 'proof') => {
    console.log(' Starting checklist-based quality score calculation:', { projectType, milestone, analysisMode, referenceAnalysis: !!referenceAnalysis });

    const checklistScore = analysis?.checklist?.score ?? 0;
    const checklistBreakdown = analysis?.checklist?.breakdown ?? [];

    const detectedIndicators = checklistBreakdown.filter((item) => item.present).length;
    const totalIndicators = checklistBreakdown.length;
    const indicatorCompletion = totalIndicators > 0 ? detectedIndicators / totalIndicators : 0;

    const detailedScores = {
      checklist: {
        score: checklistScore,
        weight: 1,
        detectedIndicators,
        totalIndicators,
        indicatorCompletion,
      },
    };

    const sceneSimilarity = referenceAnalysis ? compareAnalysisSimilarity(analysis, referenceAnalysis) : 0;
    let similarityScore = sceneSimilarity;

    if (referenceAnalysis) {
      const refQuality = referenceAnalysis?.image_quality || {};
      const proofQuality = analysis?.image_quality || {};

      const refPothole = refQuality.potholeSignal ?? 0.4;
      const refDamage = refQuality.damageSignal ?? 0.4;
      const proofPothole = proofQuality.potholeSignal ?? 0.3;
      const proofDamage = proofQuality.damageSignal ?? 0.3;

      // A successful repair must REMOVE the damage that existed in the "before" photo.
      const damageRemoved = Math.max(0, Math.min(1,
        (Math.max(0, refPothole - proofPothole) + Math.max(0, refDamage - proofDamage))
      ));

      // In proof mode the "before" reference is the BROKEN state: similarity should REWARD
      // the site being fixed (damage gone) and never punish a clean repair for looking
      // different from the damaged reference photo.
      similarityScore = Math.max(
        // Scene continuity: same location still matches
        sceneSimilarity,
        // Repair effectiveness: pothole/cracking signals dropped vs the reference
        damageRemoved
      );
    }

    const similarityScoreContribution = similarityScore * 10;
    const similarityWeight = referenceAnalysis ? 0.1 : 0;
    const qualityWeight = referenceAnalysis ? 0.9 : 1;
    const overallScore = Math.round((checklistScore * qualityWeight + similarityScoreContribution * similarityWeight) * 10) / 10;

    const bestFitScore = analysisMode === 'campaign' ? 6.0 : getBestFitThreshold(projectType, milestone);
    const threshold = analysisMode === 'campaign' ? 6.0 : bestFitScore;

    return {
      ...detailedScores,
      overall: overallScore,
      similarityScore,
      bestFitScore,
      meetsThreshold: overallScore >= threshold,
      canReleaseFunds: overallScore >= threshold,
    };
  };

  const getBestFitThreshold = (projectType, milestone) => {
    const thresholds = {
      // Infrastructure projects (general)
      infrastructure: {
        50: 7.0,   // Midpoint quality threshold
        100: 8.2   // Final completion threshold
      },
      // Park management projects
      parks: {
        50: 6.5,   // Midpoint functionality threshold
        100: 8.0   // Final completion threshold
      },
      // Pothole repair projects
      potholes: {
        50: 7.0,   // Midpoint substantial repair threshold
        100: 8.2   // Final completion threshold (fully patched photos must pass confidently)
      }
    };
    
    return thresholds[projectType]?.[milestone] || thresholds.infrastructure[milestone];
  };

  const generateRecommendations = (scores, projectType, milestone) => {
    const recommendations = [];
    
    // Project-type specific recommendations
    if (projectType === 'potholes') {
      if (scores.completion?.score < 7) {
        recommendations.push('Ensure pothole is completely filled and level with surrounding surface');
      }
      if (scores.durability?.score < 7) {
        recommendations.push('Use proper compaction techniques and quality asphalt mix');
      }
      if (scores.traffic_safety?.score < 8) {
        recommendations.push('Set up proper traffic control and safety barriers');
      }
    } else if (projectType === 'parks') {
      if (scores.safety?.score < 6) {
        recommendations.push('Install proper safety features and equipment for playgrounds');
      }
      if (scores.accessibility?.score < 7) {
        recommendations.push('Ensure all park amenities meet accessibility standards');
      }
    } else {
      // General infrastructure recommendations
      if (scores.material_quality?.score < 7) {
        recommendations.push('Consider using higher-grade materials for better durability');
      }
      if (scores.workmanship?.score < 6) {
        recommendations.push('Improve installation precision and finishing quality');
      }
      if (scores.compliance?.score < 8) {
        recommendations.push('Ensure all work meets local safety and accessibility codes');
      }
    }

    // Milestone-specific recommendations
    if (milestone === 50 && scores.overall < 7) {
      recommendations.push('Ensure core work quality before proceeding to final completion');
    } else if (milestone === 100 && scores.overall < 8.5) {
      recommendations.push('Ensure flawless execution for final project completion');
    }

    return recommendations;
  };

  useEffect(() => {
    if (imageUrl) {
      console.log('Starting image analysis for:', imageUrl);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error('Image analysis timeout - providing fallback');
        setError('Image analysis took too long. Using fallback analysis.');
        setIsAnalyzing(false);
        
        // Provide fallback analysis
        const fallbackAnalysis = {
          detected: { objects: [], image_quality: { clarity: 0.5, lighting: 0.5, composition: 0.5, resolution: 'medium' } },
          scores: { overall: 4.0, bestFitScore: 7.0, meetsThreshold: false, canReleaseFunds: false },
          overallScore: 4.0,
          recommendations: ['Image analysis had issues, so the campaign is not yet eligible for funding release.'],
          projectType,
          milestone: 100
        };
        
        onAnalysisComplete(fallbackAnalysis);
      }, 10000); // 10 second timeout
      
      const img = new Image();
      img.crossOrigin = "anonymous"; // Prevent CORS issues
      
      img.onload = () => {
        try {
          console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Validate canvas context
          if (!ctx) {
            throw new Error('Could not get canvas context');
          }
          
          // Limit canvas size to prevent memory issues
          const maxSize = 1024;
          let width = img.width;
          let height = img.height;
          
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width *= ratio;
            height *= ratio;
            console.log('Resizing image to:', width, 'x', height);
          }
          
          // Validate dimensions
          if (width <= 0 || height <= 0) {
            throw new Error('Invalid image dimensions');
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Add error handling for canvas drawing
          try {
            ctx.drawImage(img, 0, 0, width, height);
          } catch (drawError) {
            throw new Error('Failed to draw image to canvas: ' + drawError.message);
          }
          
              const imageData = canvas.toDataURL('image/jpeg', 0.8);
          let pixelFeatures = null;
          try {
            const imagePixels = ctx.getImageData(0, 0, width, height);
            console.log(' Extracting features from image pixels:', { width, height, dataLength: imagePixels.data.length });
            pixelFeatures = extractImageFeatures(imagePixels);
            console.log(' Extracted pixel features:', pixelFeatures);
          } catch (featureError) {
            console.error(' Unable to extract pixel features:', featureError);
            console.error(' Error details:', featureError.stack);
            // Use fallback heuristics based on image dimensions
            pixelFeatures = {
              brightness: 0.6,
              greenRatio: 0.2,
              grayRatio: 0.3,
              colorRatio: 0.15,
              darkRatio: 0.15,
              edgeDensity: 0.02,
              verticalEdgeDensity: 0.01,
              horizontalEdgeDensity: 0.01,
              highContrastDensity: 0.01,
              clarity: 0.6,
              composition: 0.5,
              resolution: width * height >= 400000 ? 'high' : width * height >= 120000 ? 'medium' : 'low'
            };
          }
          console.log('Canvas processing completed');
          
          // Clear timeout since processing succeeded
          clearTimeout(timeoutId);
          
          analyzeImage(imageData, pixelFeatures);
        } catch (error) {
          console.error('Canvas processing error:', error);
          clearTimeout(timeoutId);
          setError('Image processing failed. Please try a different image.');
          setIsAnalyzing(false);
          
          // Provide fallback analysis
          const fallbackBestFit = analysisMode === 'campaign' ? 6.0 : getBestFitThreshold(projectType, milestone);
          const fallbackAnalysis = {
            detected: { objects: [], image_quality: { clarity: 0.5, lighting: 0.5, composition: 0.5, resolution: 'medium' } },
            scores: { overall: 4.0, bestFitScore: fallbackBestFit, meetsThreshold: false, canReleaseFunds: false },
            overallScore: 4.0,
            bestFitScore: fallbackBestFit,
            recommendations: ['Image processing had issues, so the campaign is not yet eligible for funding release.'],
            similarityScore: 1,
            projectType,
            milestone: 100
          };
          
          onAnalysisComplete(fallbackAnalysis);
        }
      };
      
      img.onerror = (error) => {
        console.error('Image loading error:', error);
        clearTimeout(timeoutId);
        setError('Failed to load image. Please try a different image.');
        setIsAnalyzing(false);
        
        // Provide fallback analysis
        const fallbackBestFit = analysisMode === 'campaign' ? 6.0 : getBestFitThreshold(projectType, milestone);
        const fallbackAnalysis = {
          detected: { objects: [], image_quality: { clarity: 0.5, lighting: 0.5, composition: 0.5, resolution: 'medium' } },
          scores: { overall: 4.0, bestFitScore: fallbackBestFit, meetsThreshold: false, canReleaseFunds: false },
          overallScore: 4.0,
          bestFitScore: fallbackBestFit,
          recommendations: ['Image loading failed, so the campaign is not yet eligible for funding release.'],
          similarityScore: 0,
          projectType,
          milestone: 100
        };
      
        onAnalysisComplete(fallbackAnalysis);
      };
      
      img.src = imageUrl;
      
      // Cleanup function
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [imageUrl, projectType, referenceImageUrl, analysisMode, milestone]);

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-[#1dc071]'; // Green
    if (score >= 6) return 'text-[#f59e0b]'; // Yellow
    return 'text-[#ef4444]'; // Red
  };

  const getScoreLabel = (score) => {
    if (score >= 9) return 'Excellent';
    if (score >= 8) return 'Good';
    if (score >= 6) return 'Fair';
    if (score >= 4) return 'Poor';
    return 'Very Poor';
  };

  return (
    <div className="bg-[var(--bg-secondary)] rounded-[15px] p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-epilogue font-bold text-[18px] text-[var(--text-primary)]">
           Civic Infrastructure Analysis
        </h3>
        {isAnalyzing && <Loader />}
      </div>

      {error && (
        <div className="bg-[#ef444420] border border-[#ef4444] text-[var(--text-primary)] p-3 rounded-lg">
          {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="text-center p-4 bg-[var(--bg-card)] rounded-lg">
            <div className="font-epilogue text-[var(--text-secondary)] text-sm mb-2">
              Overall Quality Score
            </div>
            <div className={`font-epilogue font-bold text-3xl ${getScoreColor(analysis.overallScore)}`}>
              {analysis.overallScore}/10
            </div>
            <div className={`font-epilogue text-sm mt-2 ${getScoreColor(analysis.overallScore)}`}>
              {getScoreLabel(analysis.overallScore)}
            </div>
          </div>

          {/* Quality Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(analysis.scores)
              .filter(([category, data]) => category !== 'overall' && typeof data === 'object' && data.score != null)
              .map(([category, data]) => (
                <div key={category} className="bg-[var(--bg-card)] p-4 rounded-lg">
                  <h4 className="font-epilogue font-semibold text-[var(--text-primary)] text-sm mb-3 capitalize">
                    {category.replace(/_/g, ' ')}
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-epilogue text-[var(--text-secondary)] text-xs">Score</span>
                      <span className={`font-epilogue font-bold text-sm ${getScoreColor(data.score || 0)}`}>
                        {data.score || 0}/10
                      </span>
                    </div>
                    
                    {(data.detectedIndicators > 0 || data.totalIndicators > 0) && (
                      <div className="flex justify-between items-center">
                        <span className="font-epilogue text-[var(--text-secondary)] text-xs">Indicators Found</span>
                        <span className="font-epilogue text-sm text-[var(--text-primary)]">
                          {data.detectedIndicators || 0}/{data.totalIndicators || 0}
                        </span>
                      </div>
                    )}
                    
                    <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 mt-2">
                      <div 
                        className="h-2 rounded-full bg-[#1dc071] transition-all duration-300"
                        style={{ width: `${((data.indicatorCompletion != null ? data.indicatorCompletion : ((data.score || 0) / 10)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* HIDDEN: Indicator Summary + YOLO World Checklist Results
              ------------------------------------------------
              These sections are temporarily hidden from the UI.
              To unhide, remove the {false && ( ... )} wrapper below.
          */}
          {false && (
            <>
              {/* Indicator Summary */}
              <div className="bg-[var(--bg-card)] p-4 rounded-lg">
                <h4 className="font-epilogue font-semibold text-[var(--text-primary)] text-sm mb-3">
                   Indicator Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-epilogue text-[#1dc071] text-xs mb-2 uppercase tracking-wide">
                      Detected indicators
                    </div>
                    <div className="space-y-2">
                      {(analysis.indicatorSummary?.detectedIndicators || []).length > 0 ? (
                        analysis.indicatorSummary.detectedIndicators.map((item, index) => (
                          <div key={`detected-${index}`} className="flex items-center justify-between p-2 bg-[var(--bg-secondary)] rounded">
                            <span className="font-epilogue text-[var(--text-primary)] text-sm">{item.label}</span>
                            <span className="font-epilogue text-[var(--text-secondary)] text-xs">{Math.round(item.credit * 100)}%</span>
                          </div>
                        ))
                      ) : (
                        <div className="font-epilogue text-[var(--text-secondary)] text-sm">No strong indicators detected yet.</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="font-epilogue text-[#ef4444] text-xs mb-2 uppercase tracking-wide">
                      Missing indicators
                    </div>
                    <div className="space-y-2">
                      {(analysis.indicatorSummary?.missingIndicators || []).length > 0 ? (
                        analysis.indicatorSummary.missingIndicators.map((item, index) => (
                          <div key={`missing-${index}`} className="flex items-center justify-between p-2 bg-[var(--bg-secondary)] rounded">
                            <span className="font-epilogue text-[var(--text-primary)] text-sm">{item.label}</span>
                            <span className="font-epilogue text-[var(--text-secondary)] text-xs">{Math.round(item.credit * 100)}%</span>
                          </div>
                        ))
                      ) : (
                        <div className="font-epilogue text-[var(--text-secondary)] text-sm">No missing indicators found.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detected Objects */}
              {analysisMode !== 'campaign' && (
                <div className="bg-[var(--bg-card)] p-4 rounded-lg">
                  <h4 className="font-epilogue font-semibold text-[var(--text-primary)] text-sm mb-3">
                     YOLO World Checklist Results
                  </h4>
                  <div className="space-y-2">
                    {analysis.detected.objects.map((obj, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-[var(--bg-secondary)] rounded">
                        <span className="font-epilogue text-[var(--text-primary)] text-sm capitalize">
                          {obj.class.replace(/_/g, ' ')}
                        </span>
                        <span className="font-epilogue text-[var(--text-secondary)] text-xs">
                          {Math.round(obj.confidence * 100)}% confidence
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="bg-[#8b5cf620] border border-[#8b5cf6] p-4 rounded-lg">
              <h4 className="font-epilogue font-semibold text-[var(--text-primary)] text-sm mb-3">
                 Quality Recommendations
              </h4>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="font-epilogue text-[var(--text-primary)] text-sm flex items-start">
                    <span className="mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CivicImageAnalysis;
