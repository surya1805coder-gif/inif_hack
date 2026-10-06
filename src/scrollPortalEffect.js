import * as THREE from 'three';
import gsap from 'gsap';
import { STONES } from './stonesData.js';

/**
 * ScrollPortalEffect — Native Three.js Scroll Portal Engine
 * Inspired by React Bits Pro Scroll Portal.
 * Features:
 * - Nested geometric cosmic portal frames along Z-depth for the 6 Infinity Stones
 * - Camera fly-through across nested frames revealing each stone domain
 * - Hexagonal bevel geometry with glowing neon rim and orbiting quantum sparks
 * - Dynamic expansion & bloom radiance when crossing portal thresholds
 */
export class ScrollPortalEffect {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.isMobile = options.isMobile || false;
    this.portalSpacing = 22.0; // Spacing between nested frames along Z
    this.baseRadius = this.isMobile ? 3.8 : 5.8;

    this.group = new THREE.Group();
    this.group.name = 'scroll-portal-system';
    this.scene.add(this.group);

    this.portals = [];
    this.currentPortalIndex = 0;

    this.initPortals();
  }

  initPortals() {
    STONES.forEach((stone, i) => {
      const portalGroup = new THREE.Group();
      portalGroup.name = `portal-frame-${stone.id}`;

      // Position nested along -Z depth
      const zPos = -i * this.portalSpacing;
      portalGroup.position.set(0, 0, zPos);

      const color = new THREE.Color(stone.colorHex);

      // 1. Primary Hexagonal Bevel Outer Gate (6 segments)
      const outerGeo = new THREE.TorusGeometry(this.baseRadius, 0.045, 12, 6);
      const outerMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending
      });
      const outerMesh = new THREE.Mesh(outerGeo, outerMat);
      outerMesh.rotation.z = Math.PI / 6; // Orient point upwards
      portalGroup.add(outerMesh);

      // 2. Concentric Inner Circuit Ring
      const innerGeo = new THREE.TorusGeometry(this.baseRadius * 0.88, 0.02, 8, 6);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      innerMesh.rotation.z = Math.PI / 6;
      portalGroup.add(innerMesh);

      // 3. Ambient Portal Horizon Membrane (subtle translucent veil)
      const veilGeo = new THREE.CircleGeometry(this.baseRadius * 0.86, 6);
      const veilMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.04,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const veilMesh = new THREE.Mesh(veilGeo, veilMat);
      veilMesh.rotation.z = Math.PI / 6;
      portalGroup.add(veilMesh);

      // 4. Quantum Spark Nodes around Portal Perimeter
      const sparkCount = this.isMobile ? 12 : 24;
      const sparkGeo = new THREE.BufferGeometry();
      const sparkPos = new Float32Array(sparkCount * 3);

      for (let s = 0; s < sparkCount; s++) {
        const angle = (s / sparkCount) * Math.PI * 2;
        sparkPos[s * 3] = Math.cos(angle) * this.baseRadius;
        sparkPos[s * 3 + 1] = Math.sin(angle) * this.baseRadius;
        sparkPos[s * 3 + 2] = (Math.random() - 0.5) * 0.4;
      }
      sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));

      const sparkMat = new THREE.PointsMaterial({
        size: 0.18,
        color: color,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
      portalGroup.add(sparkPoints);

      this.group.add(portalGroup);

      this.portals.push({
        id: stone.id,
        index: i,
        group: portalGroup,
        outerMesh,
        outerMat,
        innerMesh,
        innerMat,
        veilMesh,
        veilMat,
        sparkPoints,
        colorHex: stone.colorHex,
        zTarget: zPos,
        rotationSpeed: (i % 2 === 0 ? 1 : -1) * 0.15
      });
    });
  }

  /**
   * Fly camera through portals to target stone index
   * @param {number} targetIndex - Target stone index (0-5)
   * @param {Function} onPortalPass - Callback fired as camera passes each frame
   */
  flyToPortal(targetIndex, onPortalPass) {
    this.currentPortalIndex = targetIndex;
    const targetZ = targetIndex * this.portalSpacing;

    // Shift portal group along +Z so active portal arrives at origin (stone inspection locus)
    gsap.to(this.group.position, {
      z: targetZ,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => {
        // Dynamic opacity based on proximity to origin
        this.portals.forEach(p => {
          const worldZ = p.group.position.z + this.group.position.z;
          // As portal approaches origin and passes camera, expand & dissolve
          if (worldZ > 2.0) {
            const passedDist = worldZ - 2.0;
            const dissolve = Math.max(0, 1 - passedDist / 12.0);
            p.outerMat.opacity = 0.65 * dissolve;
            p.innerMat.opacity = 0.35 * dissolve;
            p.group.scale.setScalar(1.0 + passedDist * 0.08);
          } else if (worldZ > -25.0) {
            p.outerMat.opacity = 0.65;
            p.innerMat.opacity = 0.35;
            p.group.scale.setScalar(1.0);
          } else {
            // Far ahead in distance
            p.outerMat.opacity = 0.25;
            p.innerMat.opacity = 0.15;
            p.group.scale.setScalar(1.0);
          }
        });
      },
      onComplete: () => {
        if (onPortalPass) onPortalPass(targetIndex);
      }
    });

    // Pulse active portal frame
    const active = this.portals[targetIndex];
    if (active) {
      gsap.fromTo(active.outerMat, { opacity: 1.0 }, { opacity: 0.65, duration: 0.8, ease: 'power2.out' });
      gsap.fromTo(active.innerMesh.scale, { x: 1.15, y: 1.15, z: 1.15 }, { x: 1.0, y: 1.0, z: 1.0, duration: 0.8, ease: 'elastic.out(1, 0.6)' });
    }
  }

  /**
   * Per-frame animation tick
   */
  update(delta, elapsedTime) {
    this.portals.forEach((p, idx) => {
      // Slow hypnotic rotation of nested portal frames
      p.outerMesh.rotation.z += p.rotationSpeed * delta;
      p.innerMesh.rotation.z -= p.rotationSpeed * delta * 1.2;
      p.sparkPoints.rotation.z += p.rotationSpeed * delta * 0.8;

      // Gentle floating pulse
      const breathe = Math.sin(elapsedTime * 1.8 + idx * 0.9) * 0.03;
      p.innerMesh.scale.set(1 + breathe, 1 + breathe, 1);
    });
  }

  destroy() {
    this.portals.forEach(p => {
      p.outerMesh.geometry.dispose();
      p.outerMat.dispose();
      p.innerMesh.geometry.dispose();
      p.innerMat.dispose();
      p.veilMesh.geometry.dispose();
      p.veilMat.dispose();
      p.sparkPoints.geometry.dispose();
      p.sparkPoints.material.dispose();
    });
    if (this.group && this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
