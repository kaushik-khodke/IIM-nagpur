import { useRef, useEffect, useMemo } from "react";
import { useGLTF, Environment, OrbitControls, ContactShadows } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { KTX2Loader } from "three-stdlib";
import * as THREE from "three";

// Singleton KTX2Loader (shared across all instances)
let ktx2LoaderInstance: KTX2Loader | null = null;

/**
 * Loads the paddyHarvester GLB model (meshopt-compressed + KTX2/Basis textures)
 * using MeshoptDecoder and KTX2Loader, and scales it to match the original
 * tractor model's visual footprint.
 */
const HARVESTER_SCALE = 0.26;

export function TractorModel() {
  const { gl } = useThree();

  // Set up KTX2Loader singleton for KHR_texture_basisu extension
  const ktx2Loader = useMemo(() => {
    if (!ktx2LoaderInstance) {
      ktx2LoaderInstance = new KTX2Loader();
      ktx2LoaderInstance.setTranscoderPath("/basis/");
      ktx2LoaderInstance.detectSupport(gl);
    }
    return ktx2LoaderInstance;
  }, [gl]);

  // Load the harvester model with MeshoptDecoder + KTX2Loader
  const { scene } = useGLTF(
    "/paddyHarvester-fast-normal.glb",
    true,   // useDraco
    true,   // useMeshopt  → sets MeshoptDecoder on the GLTFLoader
    (loader) => {
      loader.setKTX2Loader(ktx2Loader);
    }
  );

  const modelRef = useRef<THREE.Group>(null);

  // ── Enable shadows on all meshes (keep original colors/textures) ──
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
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
        target={[0, -0.2, 0]}
        autoRotate={true}
        autoRotateSpeed={1}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
      />

      <group
        position={[0, -0.2, 0]}
        scale={HARVESTER_SCALE}
        rotation={[0, -Math.PI / 3, 0]}
      >
        <primitive
          ref={modelRef}
          object={scene}
          position={[1.7110, 0, 1.1106]}
          
        />
      </group>

      {/* Soft shadow on the floor */}
      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.7}
        scale={8}
        blur={2}
        far={4.5}
        color="#172263"
      />
    </>
  );
}
