import * as React from "react";
import * as THREE from "three";
import { ThreeEvent, useThree } from "@react-three/fiber";

import { Html } from "../Html";
import { context } from "./context";
import { calculateScaleFactor } from "../core/calculate-scale-factor";

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

const scaleV = /* @__PURE__ */ new THREE.Vector3();
const scaleMatrix = /* @__PURE__ */ new THREE.Matrix4();

interface ClickInfo {
  clickPoint: THREE.Vector3;
  xDir: THREE.Vector3;
  yDir: THREE.Vector3;
  zDir: THREE.Vector3;
  mPLG: THREE.Matrix4;
  mPLGInv: THREE.Matrix4;
  offsetMultiplier: number;
}

interface Props {
  color?: string;
  point: THREE.Vector3;
  directions: [THREE.Vector3, THREE.Vector3, THREE.Vector3]; // 可选，默认使用 XYZ
}

export const AxisPointer: React.FC<Props> = ({ color, point, directions }) => {
  const {
    annotations,
    annotationsClass,
    depthTest,
    scale,
    lineWidth,
    fixed,
    axisColors,
    hoveredColor,
    opacity,
    onDragStart,
    onDrag,
    onDragEnd,
    userData,
  } = React.useContext(context);

  const size = useThree((state) => state.size);
  const camControls = useThree((state) => state.controls) as unknown as
    | { enabled: boolean }
    | undefined;
  const divRef = React.useRef<HTMLDivElement>(null!);
  const objRef = React.useRef<THREE.Group>(null!);
  const meshRef = React.useRef<THREE.Mesh>(null!);
  const scale0X = React.useRef<number>(1);
  const scaleCurX = React.useRef<number>(1);
  const scale0Y = React.useRef<number>(1);
  const scaleCurY = React.useRef<number>(1);
  const scale0Z = React.useRef<number>(1);
  const scaleCurZ = React.useRef<number>(1);
  const clickInfo = React.useRef<ClickInfo | null>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isDrag, setIsDrag] = React.useState(false);

  // console.log({ scale, fixed });
  // console.log(point.clone());

  const position = fixed ? 1.2 : 1.2 * scale;

  const onPointerDown = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (annotations) {
        divRef.current.innerText = `${scaleCurX.current.toFixed(2)}`;
        divRef.current.style.display = "block";
      }
      e.stopPropagation();

      console.log(objRef.current.matrixWorld);
      const rotation = new THREE.Matrix4().extractRotation(objRef.current.matrixWorld);
      console.log("rotation", rotation);
      const clickPoint = e.point.clone();
      const origin = new THREE.Vector3().setFromMatrixPosition(objRef.current.matrixWorld);

      const [xBasis, yBasis, zBasis] = directions;
      const xDir = xBasis.clone().applyMatrix4(rotation).normalize();
      const yDir = yBasis.clone().applyMatrix4(rotation).normalize();
      const zDir = zBasis.clone().applyMatrix4(rotation).normalize();

      const mPLG = objRef.current.matrixWorld.clone();
      const mPLGInv = mPLG.clone().invert();
      const offsetMultiplier = fixed
        ? 1 / calculateScaleFactor(objRef.current.getWorldPosition(vec1), scale, e.camera, size)
        : 1;
      clickInfo.current = {
        xDir,
        yDir,
        zDir,
        mPLG,
        mPLGInv,
        clickPoint,
        offsetMultiplier,
      };

      onDragStart({ component: "Sphere", axis: 0, origin, directions: [xDir] });
      if (camControls) {
        camControls.enabled = false;
      }
      // @ts-expect-error - setPointerCapture is not in the type definition
      e.target.setPointerCapture(e.pointerId);
    },
    [annotations, directions, fixed, scale, size, onDragStart, camControls],
  );

  const onPointerMove = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!isHovered) setIsHovered(true);
      if (!isDrag) setIsDrag(true);

      if (clickInfo.current) {
        const { clickPoint, xDir, yDir, zDir, mPLG, mPLGInv, offsetMultiplier } = clickInfo.current;
        const [min, max] = [1e-5, undefined]; // always limit the minimal value, since setting it very low might break the transform

        const offsetXW = calculateOffset(clickPoint, xDir, e.ray.origin, e.ray.direction);
        const offsetXL = offsetXW * offsetMultiplier;
        const offsetXH = fixed ? offsetXL : offsetXL / scale;
        let upscaleX = Math.pow(2, offsetXH * 0.2);

        const offsetYW = calculateOffset(clickPoint, yDir, e.ray.origin, e.ray.direction);
        const offsetYL = offsetYW * offsetMultiplier;
        const offsetYH = fixed ? offsetYL : offsetYL / scale;
        let upscaleY = Math.pow(2, offsetYH * 0.2);

        const offsetZW = calculateOffset(clickPoint, zDir, e.ray.origin, e.ray.direction);
        const offsetZL = offsetZW * offsetMultiplier;
        const offsetZH = fixed ? offsetZL : offsetZL / scale;
        let upscaleZ = Math.pow(2, offsetZH * 0.2);

        if (e.shiftKey) {
          upscaleX = Math.round(upscaleX * 10) / 10;
          upscaleY = Math.round(upscaleY * 10) / 10;
          upscaleZ = Math.round(upscaleZ * 10) / 10;
        }

        upscaleX = Math.max(upscaleX, min / scale0X.current);
        upscaleY = Math.max(upscaleY, min / scale0Y.current);
        upscaleZ = Math.max(upscaleZ, min / scale0Z.current);
        if (max !== undefined) {
          upscaleX = Math.min(upscaleX, max / scale0X.current);
          upscaleY = Math.min(upscaleY, max / scale0Y.current);
          upscaleZ = Math.min(upscaleZ, max / scale0Z.current);
        }

        scaleCurX.current = scale0X.current * upscaleX;
        scaleCurY.current = scale0Y.current * upscaleY;
        scaleCurZ.current = scale0Z.current * upscaleZ;
        meshRef.current.position.set(scaleCurX.current, scaleCurY.current, scaleCurZ.current);
        if (annotations) {
          divRef.current.innerText = `${scaleCurX.current.toFixed(2)}`;
        }
        scaleV.set(upscaleX, upscaleY, upscaleZ);
        // scaleV.setComponent(0, upscaleX);
        // scaleV.setComponent(1, upscaleY);
        scaleMatrix.makeScale(scaleV.x, scaleV.y, scaleV.z).premultiply(mPLG).multiply(mPLGInv);
        onDrag(scaleMatrix);
      }
    },
    [isHovered, fixed, scale, annotations, onDrag],
  );

  const onPointerUp = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (annotations) {
        divRef.current.style.display = "none";
      }
      e.stopPropagation();
      scale0X.current = scaleCurX.current;
      scale0Y.current = scaleCurY.current;
      scale0Z.current = scaleCurZ.current;
      clickInfo.current = null;
      onDragEnd();
      if (camControls) {
        camControls.enabled = true;
      }
      // @ts-expect-error - releasePointerCapture & PointerEvent#pointerId is not in the type definition
      e.target.releasePointerCapture(e.pointerId);
    },
    [annotations, camControls, onDragEnd],
  );

  const onPointerOut = React.useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDrag(false);
    setIsHovered(false);
  }, []);

  const { radius } = React.useMemo(() => {
    const radius = fixed ? (lineWidth / scale) * 1.8 : scale / 22.5;

    return { radius };
  }, [scale, lineWidth, fixed]);

  const color_ = isHovered ? hoveredColor : (color ?? axisColors[0]);

  console.log(getPosition(point));

  return (
    <group ref={objRef} position={point}>
      <group
        matrixAutoUpdate={false}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOut={onPointerOut}
      >
        {annotations && (
          <Html position={[0, position / 2, 0]}>
            <div
              style={{
                display: "none",
                background: "#151520",
                color: "white",
                padding: "6px 8px",
                borderRadius: 7,
                whiteSpace: "nowrap",
              }}
              className={annotationsClass}
              ref={divRef}
            />
          </Html>
        )}

        <mesh ref={meshRef} renderOrder={500} userData={userData}>
          <sphereGeometry args={[radius, 12, 12]} />
          <meshBasicMaterial
            transparent
            depthTest={depthTest}
            color={color_}
            opacity={opacity}
            polygonOffset
            polygonOffsetFactor={-10}
          />
        </mesh>
      </group>
    </group>
  );
};

const getPosition = (p: THREE.Vector3) => {
  return new THREE.Vector3(p.x === 1 ? 0 : 1, p.y === 1 ? 0 : 1, p.z === 1 ? 0 : 1);
};
