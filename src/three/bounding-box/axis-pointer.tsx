"use client";

import { useCallback, useContext, useRef, useState } from "react";
import { ThreeEvent, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { BoundingBoxContext } from "@/three/bounding-box/context";

type Controls = THREE.EventDispatcher & {
  enabled: boolean;
};

type ClickInfo = {
  clickPoint: THREE.Vector3;
  dir: THREE.Vector3;
  mPLG: THREE.Matrix4;
  mPLGInv: THREE.Matrix4;
  offsetMultiplier: number;
};

interface Props {
  scale?: number;
  point: THREE.Vector3;
  direction: THREE.Vector3;
}

const scaleMatrix = new THREE.Matrix4();
const scaleV = /* @__PURE__ */ new THREE.Vector3();

export function AxisPointer(props: Props) {
  const { point, direction, scale = 1 } = props;

  const objRef = useRef<THREE.Group>(null!);
  const clickInfo = useRef<ClickInfo | null>(null);
  const scale0 = useRef<number>(1);
  const scaleCur = useRef<number>(1);
  const meshRef = useRef<THREE.Mesh>(null!);

  const [isHovered, setIsHovered] = useState(false);

  const camControls = useThree((state) => state.controls) as Controls;
  const { onDragStart, onDrag, onDragEnd } = useContext(BoundingBoxContext);

  console.log("direction", direction);

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      console.log("onPointerDown");
      e.stopPropagation();

      const rotation = new THREE.Matrix4().extractRotation(objRef.current.matrixWorld);
      const clickPoint = e.point.clone();
      const origin = new THREE.Vector3().setFromMatrixPosition(objRef.current.matrixWorld);
      const dir = direction.clone().applyMatrix4(rotation).normalize();
      const mPLG = objRef.current.matrixWorld.clone();
      const mPLGInv = mPLG.clone().invert();
      const offsetMultiplier = 1;
      clickInfo.current = { clickPoint, dir, mPLG, mPLGInv, offsetMultiplier };
      console.log(clickInfo.current);
      onDragStart({ origin, directions: [dir] });

      if (camControls) {
        camControls.enabled = false;
      }
      // @ts-expect-error - setPointerCapture is not in the type definition
      e.target.setPointerCapture(e.pointerId);
    },
    [camControls, direction, onDragStart],
  );

  const onPointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      console.log("onPointerMove");
      if (!isHovered) {
        setIsHovered(true);
      }

      if (clickInfo.current) {
        const { clickPoint, dir, mPLG, mPLGInv, offsetMultiplier } = clickInfo.current;
        const [min, max] = [1e-5, undefined]; // always limit the minimal value, since setting it very low might break the transform

        const offsetW = calculateOffset(clickPoint, dir, e.ray.origin, e.ray.direction);
        const offsetL = offsetW * offsetMultiplier;
        const offsetH = offsetL / scale;
        let upscale = Math.pow(2, offsetH * 0.2);

        if (e.shiftKey) {
          upscale = Math.round(upscale * 10) / 10;
        }

        upscale = Math.max(upscale, min / scale0.current);
        if (max !== undefined) {
          upscale = Math.min(upscale, max / scale0.current);
        }
        scaleCur.current = scale0.current * upscale;
        scaleV.set(1, 1, 1);

        console.log("dir", dir);
        scaleV.setComponent(0, upscale);
        scaleMatrix.makeScale(scaleV.x, scaleV.y, scaleV.z).premultiply(mPLG).multiply(mPLGInv);
        onDrag(scaleMatrix);
      }
    },
    [isHovered, onDrag, scale],
  );

  const onPointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      console.log("onPointerUp");
      scale0.current = scaleCur.current;
      clickInfo.current = null;
      onDragEnd();

      if (camControls) {
        camControls.enabled = true;
      }
      // @ts-expect-error - releasePointerCapture & PointerEvent#pointerId is not in the type definition
      e.target.releasePointerCapture(e.pointerId);
    },
    [camControls, onDragEnd],
  );

  const onPointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    console.log("onPointerOut");
    setIsHovered(false);
  }, []);

  const color_ = isHovered ? "blue" : "orange";

  return (
    <group ref={objRef}>
      <group
        matrixAutoUpdate={false}
        onPointerMove={onPointerMove}
        onPointerOut={onPointerOut}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <mesh ref={meshRef} position={point}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color={color_} transparent polygonOffset />
        </mesh>
      </group>
    </group>
  );
}

const vec1 = /* @__PURE__ */ new THREE.Vector3();
const vec2 = /* @__PURE__ */ new THREE.Vector3();

export const calculateOffset = (
  clickPoint: THREE.Vector3,
  normal: THREE.Vector3,
  rayStart: THREE.Vector3,
  rayDir: THREE.Vector3,
) => {
  const e1 = normal.dot(normal);
  const e2 = normal.dot(clickPoint) - normal.dot(rayStart);
  const e3 = normal.dot(rayDir);

  if (e3 === 0) {
    return -e2 / e1;
  }

  vec1
    .copy(rayDir)
    .multiplyScalar(e1 / e3)
    .sub(normal);
  vec2
    .copy(rayDir)
    .multiplyScalar(e2 / e3)
    .add(rayStart)
    .sub(clickPoint);

  return -vec1.dot(vec2) / vec1.dot(vec1);
};
