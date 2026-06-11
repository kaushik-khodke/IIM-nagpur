import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeBackgroundProps {
  variant?: "hero" | "auth" | "dashboard";
}

export function ThreeBackground({ variant = "hero" }: ThreeBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const particles: THREE.Points[] = [];
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    if (variant === "hero") {
      // Floating wheat particles
      const particleCount = 120;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 80;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometries.push(geo);
      const mat = new THREE.PointsMaterial({
        color: 0xe8720c,
        size: 0.4,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
      });
      materials.push(mat);
      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      particles.push(pts);

      // Secondary green particles
      const positions2 = new Float32Array(80 * 3);
      for (let i = 0; i < 80; i++) {
        positions2[i * 3] = (Math.random() - 0.5) * 80;
        positions2[i * 3 + 1] = (Math.random() - 0.5) * 60;
        positions2[i * 3 + 2] = (Math.random() - 0.5) * 40;
      }
      const geo2 = new THREE.BufferGeometry();
      geo2.setAttribute("position", new THREE.BufferAttribute(positions2, 3));
      geometries.push(geo2);
      const mat2 = new THREE.PointsMaterial({
        color: 0x15803d,
        size: 0.3,
        transparent: true,
        opacity: 0.4,
        sizeAttenuation: true,
      });
      materials.push(mat2);
      const pts2 = new THREE.Points(geo2, mat2);
      scene.add(pts2);
      particles.push(pts2);

      // Torus rings
      for (let i = 0; i < 3; i++) {
        const torusGeo = new THREE.TorusGeometry(8 + i * 4, 0.05, 16, 100);
        geometries.push(torusGeo);
        const torusMat = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0xe8720c : 0x15803d,
          transparent: true,
          opacity: 0.08 - i * 0.02,
          wireframe: false,
        });
        materials.push(torusMat);
        const torus = new THREE.Mesh(torusGeo, torusMat);
        torus.rotation.x = Math.random() * Math.PI;
        torus.rotation.y = Math.random() * Math.PI;
        scene.add(torus);
      }
    } else if (variant === "auth") {
      const count = 60;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 60;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geometries.push(geo);
      const mat = new THREE.PointsMaterial({
        color: 0xe8720c,
        size: 0.35,
        transparent: true,
        opacity: 0.5,
      });
      materials.push(mat);
      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      particles.push(pts);
    } else {
      const count = 50;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 100;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 80;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geometries.push(geo);
      const mat = new THREE.PointsMaterial({
        color: 0xe8720c,
        size: 0.25,
        transparent: true,
        opacity: 0.3,
      });
      materials.push(mat);
      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      particles.push(pts);
    }

    let animId: number;
    let time = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.005;
      particles.forEach((p, i) => {
        p.rotation.y = time * (0.05 + i * 0.02);
        p.rotation.x = time * 0.02;
      });
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [variant]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
