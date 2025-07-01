"use client";

import { GizmoHelper, GizmoViewport, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import { PivotControls } from "@/components/pivot-controls";

export default function Home() {
  return (
    <div className="flex h-screen items-center justify-items-center p-8">
      <Canvas shadows camera={{ position: [-10, 10, 10], fov: 20 }}>
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[2.5, 5, 5]}
          intensity={1.5}
          shadow-mapSize={[1024, 1024]}
        >
          <orthographicCamera attach="shadow-camera" args={[-5, 5, 5, -5, 1, 50]} />
        </directionalLight>

        <PivotControls anchor={[1, 1, 1]} rotation={[Math.PI, -Math.PI / 2, 0]} scale={0.75}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </PivotControls>

        <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
          <GizmoViewport labelColor="white" axisHeadScale={1} />
        </GizmoHelper>

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
