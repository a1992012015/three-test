"use client";

import { GizmoHelper, GizmoViewport, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
// import { useState } from "react";

import { PivotControls } from "@/three/pivot-controls";

export default function Home() {
  // const [visible, setVisible] = useState(true);

  return (
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

      <PivotControls
        scale={0.75}
        disableSliders
        // disableScaling
        // visible={visible}
        // anchor={[1, 1, 1]}
        depthTest={false}
        rotation={[Math.PI, -Math.PI / 2, 0]}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 1, 2]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </PivotControls>

      <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
        <GizmoViewport labelColor="white" axisHeadScale={1} />
      </GizmoHelper>

      <OrbitControls makeDefault />
    </Canvas>
  );
}
