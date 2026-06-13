import { useRef, useEffect } from "react";
import { useGLTF, Environment, Float, Center, OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

export function TractorModel() {
  const { scene } = useGLTF("/fiat_60-56_tractor_turkfiat/scene.gltf");
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Apply a stylized material since the original GLTF has no texture files
        child.material = new THREE.MeshStandardMaterial({
          color: child.name === "Object_3" ? "#1A1A1A" : "#172263", // Dark wheels, Navy body
          roughness: child.name === "Object_3" ? 0.8 : 0.3,
          metalness: child.name === "Object_3" ? 0.1 : 0.4,
        });
      }
    });
  }, [scene]);

  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        target={[0, 0, 0]} 
        autoRotate={true}
        autoRotateSpeed={0.5}
      />
      
      <Float
        speed={1.5} // Animation speed
        rotationIntensity={0.2} // XYZ rotation intensity
        floatIntensity={0.5} // Up/down float intensity
      >
        <Center position={[0, -0.4, 0]}>
          <primitive 
            ref={modelRef} 
            object={scene} 
            scale={0.028} 
            rotation={[0, -Math.PI / 4, 0]}
          />
        </Center>
      </Float>
      
      {/* Soft shadow on the floor */}
      <ContactShadows 
        position={[0, -1.5, 0]} 
        opacity={0.6} 
        scale={8} 
        blur={2} 
        far={4.5} 
        color="#172263"
      />
    </>
  );
}

useGLTF.preload("/fiat_60-56_tractor_turkfiat/scene.gltf");
