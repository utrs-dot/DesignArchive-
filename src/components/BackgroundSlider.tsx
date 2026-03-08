/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { Pane } from "tweakpane";
import gsap from "gsap";

const SLIDER_CONFIG = {
  settings: {
    transitionDuration: 2.5,
    autoSlideSpeed: 5000,
    currentEffect: "glass",
    currentEffectPreset: "Default",
    globalIntensity: 1.0,
    speedMultiplier: 1.0,
    distortionStrength: 1.0,
    colorEnhancement: 1.0,
    glassRefractionStrength: 1.0,
    glassChromaticAberration: 1.0,
    glassBubbleClarity: 1.0,
    glassEdgeGlow: 1.0,
    glassLiquidFlow: 1.0,
    frostIntensity: 1.5,
    frostCrystalSize: 1.0,
    frostIceCoverage: 1.0,
    frostTemperature: 1.0,
    frostTexture: 1.0,
    rippleFrequency: 25.0,
    rippleAmplitude: 0.08,
    rippleWaveSpeed: 1.0,
    rippleRippleCount: 1.0,
    rippleDecay: 1.0,
    plasmaIntensity: 1.2,
    plasmaSpeed: 0.8,
    plasmaEnergyIntensity: 0.4,
    plasmaContrastBoost: 0.3,
    plasmaTurbulence: 1.0,
    timeshiftDistortion: 1.6,
    timeshiftBlur: 1.5,
    timeshiftFlow: 1.4,
    timeshiftChromatic: 1.5,
    timeshiftTurbulence: 1.4
  }
};

const slides = [
  {
    title: "Modern Minimalist",
    media: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Contemporary Interior",
    media: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop"
  },
  {
    title: "Architectural Lines",
    media: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Luxury Living",
    media: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop"
  }
];

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec2 uTexture1Size;
  uniform vec2 uTexture2Size;
  uniform int uEffectType;
  
  uniform float uGlobalIntensity;
  uniform float uSpeedMultiplier;
  uniform float uDistortionStrength;
  uniform float uColorEnhancement;
  
  uniform float uGlassRefractionStrength;
  uniform float uGlassChromaticAberration;
  uniform float uGlassBubbleClarity;
  uniform float uGlassEdgeGlow;
  uniform float uGlassLiquidFlow;
  
  uniform float uFrostIntensity;
  uniform float uFrostCrystalSize;
  uniform float uFrostIceCoverage;
  uniform float uFrostTemperature;
  uniform float uFrostTexture;
  
  uniform float uRippleFrequency;
  uniform float uRippleAmplitude;
  uniform float uRippleWaveSpeed;
  uniform float uRippleRippleCount;
  uniform float uRippleDecay;
  
  uniform float uPlasmaIntensity;
  uniform float uPlasmaSpeed;
  uniform float uPlasmaEnergyIntensity;
  uniform float uPlasmaContrastBoost;
  uniform float uPlasmaTurbulence;
  
  uniform float uTimeshiftDistortion;
  uniform float uTimeshiftBlur;
  uniform float uTimeshiftFlow;
  uniform float uTimeshiftChromatic;
  uniform float uTimeshiftTurbulence;
  
  varying vec2 vUv;

  vec2 getCoverUV(vec2 uv, vec2 textureSize) {
    vec2 s = uResolution / textureSize;
    float scale = max(s.x, s.y);
    vec2 scaledSize = textureSize * scale;
    vec2 offset = (uResolution - scaledSize) * 0.5;
    return (uv * uResolution - offset) / scaledSize;
  }

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(noise(i), noise(i + vec2(1.0, 0.0)), f.x),
      mix(noise(i + vec2(0.0, 1.0)), noise(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  vec4 glassEffect(vec2 uv, float progress) {
    float glassStrength = 0.08 * uGlassRefractionStrength * uDistortionStrength * uGlobalIntensity;
    float chromaticAberration = 0.02 * uGlassChromaticAberration * uGlobalIntensity;
    float waveDistortion = 0.025 * uDistortionStrength;
    float clearCenterSize = 0.3 * uGlassBubbleClarity;
    float surfaceRipples = 0.004 * uDistortionStrength;
    float liquidFlow = 0.015 * uGlassLiquidFlow * uSpeedMultiplier;
    float rimLightIntensity = 0.08 * uGlassEdgeGlow * uGlobalIntensity;

    vec2 center = vec2(0.5, 0.5);
    vec2 p = uv * uResolution;
    vec2 uv1 = getCoverUV(uv, uTexture1Size);
    vec2 uv2_base = getCoverUV(uv, uTexture2Size);
    
    float maxRadius = length(uResolution) * 0.85;
    float bubbleRadius = progress * maxRadius;
    vec2 sphereCenter = center * uResolution;
    
    float dist = length(p - sphereCenter);
    float normalizedDist = dist / max(bubbleRadius, 0.001);
    vec2 direction = (dist > 0.0) ? (p - sphereCenter) / dist : vec2(0.0);
    float inside = smoothstep(bubbleRadius + 3.0, bubbleRadius - 3.0, dist);
    
    float distanceFactor = smoothstep(clearCenterSize, 1.0, normalizedDist);
    float time = progress * 5.0 * uSpeedMultiplier;
    
    vec2 distortedUV = uv2_base;
    if (inside > 0.0) {
      float refractionOffset = glassStrength * pow(distanceFactor, 1.5);
      vec2 flowDirection = normalize(direction + vec2(sin(time), cos(time * 0.7)) * 0.3);
      distortedUV -= flowDirection * refractionOffset;
      distortedUV -= direction * sin(normalizedDist * 22.0 - time * 3.5) * waveDistortion * distanceFactor;
    }

    vec4 newImg;
    if (inside > 0.0) {
      float aberrationOffset = chromaticAberration * pow(distanceFactor, 1.2);
      float r = texture2D(uTexture2, distortedUV + direction * aberrationOffset * 1.2).r;
      float g = texture2D(uTexture2, distortedUV + direction * aberrationOffset * 0.2).g;
      float b = texture2D(uTexture2, distortedUV - direction * aberrationOffset * 0.8).b;
      newImg = vec4(r, g, b, 1.0);
      newImg.rgb += smoothstep(0.95, 1.0, normalizedDist) * rimLightIntensity;
    } else {
      newImg = texture2D(uTexture2, uv2_base);
    }

    vec4 currentImg = texture2D(uTexture1, uv1);
    return mix(currentImg, newImg, inside);
  }

  vec4 frostEffect(vec2 uv, float progress) {
    vec4 currentImg = texture2D(uTexture1, getCoverUV(uv, uTexture1Size));
    vec4 newImg = texture2D(uTexture2, getCoverUV(uv, uTexture2Size));
    float frost = smoothNoise(uv * 80.0 / uFrostCrystalSize);
    float dist = distance(uv, vec2(0.5));
    float vignette = pow(1.0 - smoothstep(progress * 0.5, progress * 1.5, dist), 2.0);
    vec2 rnd = vec2(noise(uv + frost * 0.1), noise(uv + frost * 0.1 + 0.5));
    vec4 frozen = texture2D(uTexture2, getCoverUV(uv + rnd * 0.06 * uFrostIntensity * vignette, uTexture2Size));
    return mix(currentImg, frozen, smoothstep(0.0, 1.0, progress));
  }

  vec4 rippleEffect(vec2 uv, float progress) {
    vec4 currentImg = texture2D(uTexture1, getCoverUV(uv, uTexture1Size));
    vec2 center = vec2(0.5);
    float dist = distance(uv, center);
    float ripple = sin((dist - progress * 1.2) * uRippleFrequency) * exp(-abs(dist - progress * 1.2) * 8.0 * uRippleDecay);
    vec2 distortedUV = getCoverUV(uv + normalize(uv - center) * ripple * uRippleAmplitude * uGlobalIntensity, uTexture2Size);
    vec4 newImg = texture2D(uTexture2, distortedUV);
    return mix(currentImg, newImg, smoothstep(0.0, 1.0, progress));
  }

  void main() {
    if (uEffectType == 0) gl_FragColor = glassEffect(vUv, uProgress);
    else if (uEffectType == 1) gl_FragColor = frostEffect(vUv, uProgress);
    else if (uEffectType == 2) gl_FragColor = rippleEffect(vUv, uProgress);
    else gl_FragColor = texture2D(uTexture2, getCoverUV(vUv, uTexture2Size));
  }
`;

export default function BackgroundSlider() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const shaderMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const currentSlideIndexRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const slideTexturesRef = useRef<THREE.Texture[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false,
      alpha: false
    });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture1: { value: null },
        uTexture2: { value: null },
        uProgress: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uTexture1Size: { value: new THREE.Vector2(1, 1) },
        uTexture2Size: { value: new THREE.Vector2(1, 1) },
        uEffectType: { value: 0 },
        uGlobalIntensity: { value: SLIDER_CONFIG.settings.globalIntensity },
        uSpeedMultiplier: { value: SLIDER_CONFIG.settings.speedMultiplier },
        uDistortionStrength: { value: SLIDER_CONFIG.settings.distortionStrength },
        uColorEnhancement: { value: SLIDER_CONFIG.settings.colorEnhancement },
        uGlassRefractionStrength: { value: SLIDER_CONFIG.settings.glassRefractionStrength },
        uGlassChromaticAberration: { value: SLIDER_CONFIG.settings.glassChromaticAberration },
        uGlassBubbleClarity: { value: SLIDER_CONFIG.settings.glassBubbleClarity },
        uGlassEdgeGlow: { value: SLIDER_CONFIG.settings.glassEdgeGlow },
        uGlassLiquidFlow: { value: SLIDER_CONFIG.settings.glassLiquidFlow },
        uFrostIntensity: { value: SLIDER_CONFIG.settings.frostIntensity },
        uFrostCrystalSize: { value: SLIDER_CONFIG.settings.frostCrystalSize },
        uFrostIceCoverage: { value: SLIDER_CONFIG.settings.frostIceCoverage },
        uFrostTemperature: { value: SLIDER_CONFIG.settings.frostTemperature },
        uFrostTexture: { value: SLIDER_CONFIG.settings.frostTexture },
        uRippleFrequency: { value: SLIDER_CONFIG.settings.rippleFrequency },
        uRippleAmplitude: { value: SLIDER_CONFIG.settings.rippleAmplitude },
        uRippleWaveSpeed: { value: SLIDER_CONFIG.settings.rippleWaveSpeed },
        uRippleRippleCount: { value: SLIDER_CONFIG.settings.rippleRippleCount },
        uRippleDecay: { value: SLIDER_CONFIG.settings.rippleDecay }
      },
      vertexShader,
      fragmentShader
    });
    shaderMaterialRef.current = shaderMaterial;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, shaderMaterial);
    scene.add(mesh);

    const textureLoader = new THREE.TextureLoader();
    const loadTextures = async () => {
      const loadedTextures = await Promise.all(
        slides.map((slide) =>
          new Promise<THREE.Texture>((resolve) => {
            textureLoader.load(slide.media, (texture) => {
              texture.minFilter = texture.magFilter = THREE.LinearFilter;
              texture.userData = { size: new THREE.Vector2(texture.image.width, texture.image.height) };
              resolve(texture);
            });
          })
        )
      );
      slideTexturesRef.current = loadedTextures;
      if (loadedTextures.length >= 2) {
        shaderMaterial.uniforms.uTexture1.value = loadedTextures[0];
        shaderMaterial.uniforms.uTexture2.value = loadedTextures[1];
        shaderMaterial.uniforms.uTexture1Size.value = loadedTextures[0].userData.size;
        shaderMaterial.uniforms.uTexture2Size.value = loadedTextures[1].userData.size;
      }
    };

    loadTextures();

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const autoSlide = setInterval(() => {
      if (isTransitioningRef.current || slideTexturesRef.current.length < 2) return;
      
      const nextIndex = (currentSlideIndexRef.current + 1) % slides.length;
      const currentTexture = slideTexturesRef.current[currentSlideIndexRef.current];
      const nextTexture = slideTexturesRef.current[nextIndex];

      isTransitioningRef.current = true;
      shaderMaterial.uniforms.uTexture1.value = currentTexture;
      shaderMaterial.uniforms.uTexture2.value = nextTexture;
      shaderMaterial.uniforms.uTexture1Size.value = currentTexture.userData.size;
      shaderMaterial.uniforms.uTexture2Size.value = nextTexture.userData.size;
      
      // Randomize effect for variety
      shaderMaterial.uniforms.uEffectType.value = Math.floor(Math.random() * 3);

      gsap.to(shaderMaterial.uniforms.uProgress, {
        value: 1,
        duration: 2.5,
        ease: "power2.inOut",
        onComplete: () => {
          shaderMaterial.uniforms.uProgress.value = 0;
          shaderMaterial.uniforms.uTexture1.value = nextTexture;
          shaderMaterial.uniforms.uTexture1Size.value = nextTexture.userData.size;
          currentSlideIndexRef.current = nextIndex;
          isTransitioningRef.current = false;
        }
      });
    }, SLIDER_CONFIG.settings.autoSlideSpeed);

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      shaderMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(autoSlide);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />;
}
