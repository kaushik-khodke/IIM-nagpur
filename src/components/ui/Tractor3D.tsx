import { useRef, useEffect } from "react";
import { useGLTF, Environment, Float, Center, OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

export function TractorModel() {
  const { scene } = useGLTF("/fiat_60-56_tractor_turkfiat/scene.gltf");
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Enable shadows
        child.castShadow = true;
        child.receiveShadow = true;
        
        if (child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          
          // Make the entire tractor dark blue
          mat.color = new THREE.Color("#1A2B5C"); 
          
          mat.roughness = 0.4;
          mat.metalness = 0.2;
          mat.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  return (
    <>
      <Environment preset="studio" />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        target={[0, 0, 0]} 
        autoRotate={true}
        autoRotateSpeed={0.5}
      />
      
      <Center position={[-0.5, -0.2, 0]}>
        <primitive 
          ref={modelRef} 
          object={scene} 
          scale={0.028} 
          rotation={[0, -Math.PI / 3, 0]}
        />
      </Center>
      
      {/* Soft shadow on the floor */}
      <ContactShadows 
        position={[0, -1.2, 0]} 
        opacity={0.6} 
        scale={8} 
        blur={2} 
        far={4.5} 
        color="#172263"
      />
    </>
  );
}

