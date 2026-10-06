import * as THREE from 'three';
import gsap from 'gsap';

/**
 * LightspeedEffect — Hyperspace light streak engine for Three.js
 * Inspired by React Bits Pro Lightspeed, adapted natively for 60+ FPS performance.
 * Features:
 * - Hyperspace light streak tunnel with Z-depth travel
 * - Dynamic color transitions matching active Infinity Stone
 * - Click interaction: accelerating warp streaks with sub-bass audio pulse
 * - Smooth GSAP acceleration/deceleration transitions on navigation
 */
export class LightspeedEffect {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.isMobile = options.isMobile || false;
    this.streakCount = this.isMobile ? 180 : 420;

    this.tunnelRadiusMin = 3.2;
    this.tunnelRadiusMax = 28.0;
    this.zNear = 12.0;
    this.zFar = -140.0;

    this.baseSpeed = 0.45;
    this.currentSpeed = this.baseSpeed;
    this.baseLength = 1.0;
    this.currentLength = this.baseLength;

    this.activeColor = new THREE.Color(options.initialColor || '#ffd000');
    this.targetColor = new THREE.Color(options.initialColor || '#ffd000');

    this.group = new THREE.Group();
    this.group.name = 'lightspeed-tunnel';
    this.scene.add(this.group);

    this.initStreaks();
  }

  initStreaks() {
    this.positions = new Float32Array(this.streakCount * 2 * 3); // 2 vertices per line, 3 coords
    this.colors = new Float32Array(this.streakCount * 2 * 3);
    this.streakData = [];

    for (let i = 0; i < this.streakCount; i++) {
      // Cylindrical distribution around camera sightline
      const angle = Math.random() * Math.PI * 2;
      const radius = this.tunnelRadiusMin + Math.pow(Math.random(), 1.4) * (this.tunnelRadiusMax - this.tunnelRadiusMin);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = this.zFar + Math.random() * (this.zNear - this.zFar);

      const speedFactor = 0.6 + Math.random() * 0.8;
      const brightness = 0.35 + Math.random() * 0.65;

      this.streakData.push({
        x,
        y,
        z,
        angle,
        radius,
        speedFactor,
        brightness
      });

      const idx = i * 6;
      // Vertex A (Head)
      this.positions[idx] = x;
      this.positions[idx + 1] = y;
      this.positions[idx + 2] = z;
      // Vertex B (Tail)
      this.positions[idx + 3] = x;
      this.positions[idx + 4] = y;
      this.positions[idx + 5] = z - this.baseLength * speedFactor;

      // Color Head (brighter)
      this.colors[idx] = this.activeColor.r * brightness;
      this.colors[idx + 1] = this.activeColor.g * brightness;
      this.colors[idx + 2] = this.activeColor.b * brightness;

      // Color Tail (fade to transparent dark)
      this.colors[idx + 3] = this.activeColor.r * brightness * 0.2;
      this.colors[idx + 4] = this.activeColor.g * brightness * 0.2;
      this.colors[idx + 5] = this.activeColor.b * brightness * 0.2;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      linewidth: 1
    });

    this.lineSegments = new THREE.LineSegments(this.geometry, this.material);
    this.group.add(this.lineSegments);
  }

  /**
   * Trigger hyperspace light streak warp
   * @param {Object} opts - { duration, speedMultiplier, lengthMultiplier, colorHex, onComplete }
   */
  triggerWarp(opts = {}) {
    const duration = opts.duration || 1.1;
    const peakSpeed = this.baseSpeed * (opts.speedMultiplier || 16.0);
    const peakLength = this.baseLength * (opts.lengthMultiplier || 24.0);

    if (opts.colorHex) {
      this.setThemeColor(opts.colorHex, duration * 0.5);
    }

    // Accelerate then smoothly decelerate
    const timeline = gsap.timeline({
      onComplete: opts.onComplete
    });

    timeline.to(this, {
      currentSpeed: peakSpeed,
      currentLength: peakLength,
      duration: duration * 0.35,
      ease: 'power3.in'
    }).to(this, {
      currentSpeed: this.baseSpeed,
      currentLength: this.baseLength,
      duration: duration * 0.65,
      ease: 'power3.out'
    });

    return timeline;
  }

  /**
   * Smoothly shift streak colors to the active stone's hue
   */
  setThemeColor(hex, duration = 0.6) {
    const target = new THREE.Color(hex);
    gsap.to(this.activeColor, {
      r: target.r,
      g: target.g,
      b: target.b,
      duration: duration,
      ease: 'power2.out'
    });
  }

  /**
   * Per-frame animation tick
   */
  update(delta, elapsedTime) {
    if (!this.positions || !this.streakData) return;

    const speed = this.currentSpeed * (delta * 60);
    const length = this.currentLength;
    const r = this.activeColor.r;
    const g = this.activeColor.g;
    const b = this.activeColor.b;

    for (let i = 0; i < this.streakCount; i++) {
      const data = this.streakData[i];
      const idx = i * 6;

      // Move forward along +Z towards camera
      data.z += speed * data.speedFactor;

      // Wrap around when past camera near plane
      if (data.z > this.zNear) {
        data.z = this.zFar + (Math.random() * 8.0);
        // Refresh radial angle slightly for organic swirl
        data.angle += (Math.random() - 0.5) * 0.2;
        data.x = Math.cos(data.angle) * data.radius;
        data.y = Math.sin(data.angle) * data.radius;
      }

      const headZ = data.z;
      const tailZ = data.z - (length * data.speedFactor * 1.6);

      // Update Head position
      this.positions[idx] = data.x;
      this.positions[idx + 1] = data.y;
      this.positions[idx + 2] = headZ;

      // Update Tail position
      this.positions[idx + 3] = data.x;
      this.positions[idx + 4] = data.y;
      this.positions[idx + 5] = tailZ;

      // Dynamic color interpolation
      const br = data.brightness;
      this.colors[idx] = r * br;
      this.colors[idx + 1] = g * br;
      this.colors[idx + 2] = b * br;

      this.colors[idx + 3] = r * br * 0.12;
      this.colors[idx + 4] = g * br * 0.12;
      this.colors[idx + 5] = b * br * 0.12;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;

    // Gentle global rotation
    this.group.rotation.z = elapsedTime * 0.04;
  }

  destroy() {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.group && this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
