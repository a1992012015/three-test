import { FC, RefObject, useCallback, useContext, useMemo, useRef, useState } from "react";
import { ThreeEvent, useThree } from "@react-three/fiber";
import * as THREE from "three";

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
  childrenRef?: RefObject<THREE.Group>;
  directions: [THREE.Vector3, THREE.Vector3, THREE.Vector3]; // 可选，默认使用 XYZ
}

export const AxisPointer: FC<Props> = ({ color, point, directions, childrenRef }) => {
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
  } = useContext(context);

  const size = useThree((state) => state.size);
  const camControls = useThree((state) => state.controls) as unknown as
    | { enabled: boolean }
    | undefined;
  const divRef = useRef<HTMLDivElement>(null!);
  const objRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const scale0X = useRef<number>(0);
  const scaleCurX = useRef<number>(0);
  const scale0Y = useRef<number>(0);
  const scaleCurY = useRef<number>(0);
  const scale0Z = useRef<number>(0);
  const scaleCurZ = useRef<number>(0);
  const clickInfo = useRef<ClickInfo | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  console.log({ scale, fixed });
  // console.log(point.clone());

  const position = fixed ? 1.2 : 1.2 * scale;

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (annotations) {
        divRef.current.innerText = `${scaleCurX.current.toFixed(2)}`;
        divRef.current.style.display = "block";
      }
      e.stopPropagation();

      const main = new THREE.Vector3().setFromMatrixPosition(childrenRef!.current.matrixWorld);
      const p = objRef.current.position.clone();

      const relative = new THREE.Vector3().subVectors(
        main,
        new THREE.Vector3().subVectors(p, main),
      );
      const relativeMatrix = new THREE.Matrix4().makeTranslation(
        relative.x,
        relative.y,
        relative.z,
      );

      // console.log(objRef.current.matrixWorld);
      // const rotation = new THREE.Matrix4().extractRotation(objRef.current.matrixWorld);
      // console.log("rotation", rotation);
      const rotation = new THREE.Matrix4().extractRotation(relativeMatrix);
      const clickPoint = e.point.clone();
      const origin = new THREE.Vector3().setFromMatrixPosition(relativeMatrix);

      const [xBasis, yBasis, zBasis] = directions;
      const xDir = xBasis.clone().applyMatrix4(rotation).normalize();
      const yDir = yBasis.clone().applyMatrix4(rotation).normalize();
      const zDir = zBasis.clone().applyMatrix4(rotation).normalize();

      const mPLG = relativeMatrix.clone();
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
    [annotations, childrenRef, directions, fixed, scale, size, onDragStart, camControls],
  );

  const onPointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!isHovered) setIsHovered(true);

      if (clickInfo.current) {
        const { clickPoint, xDir, yDir, zDir, mPLG, mPLGInv, offsetMultiplier } = clickInfo.current;

        const currentPoint = clickPoint.clone();

        const offsetXW = calculateOffset(currentPoint, xDir, e.ray.origin, e.ray.direction);
        const offsetXL = offsetXW * offsetMultiplier;
        const offsetXH = fixed ? offsetXL : offsetXL / scale;
        const upscaleX = Math.pow(2, offsetXH * 0.2);

        currentPoint.setComponent(0, upscaleX);

        const offsetYW = calculateOffset(currentPoint, yDir, e.ray.origin, e.ray.direction);
        const offsetYL = offsetYW * offsetMultiplier;
        const offsetYH = fixed ? offsetYL : offsetYL / scale;
        const upscaleY = Math.pow(2, offsetYH * 0.2);

        currentPoint.setComponent(1, upscaleY);

        const offsetZW = calculateOffset(currentPoint, zDir, e.ray.origin, e.ray.direction);
        const offsetZL = offsetZW * offsetMultiplier;
        const offsetZH = fixed ? offsetZL : offsetZL / scale;
        const upscaleZ = Math.pow(2, offsetZH * 0.2);

        currentPoint.setComponent(2, upscaleZ);

        // if (e.shiftKey) {
        //   upscaleX = Math.round(upscaleX * 10) / 10;
        //   upscaleY = Math.round(upscaleY * 10) / 10;
        //   upscaleZ = Math.round(upscaleZ * 10) / 10;
        // }
        //
        // upscaleX = Math.max(upscaleX, min / scale0X.current);
        // upscaleY = Math.max(upscaleY, min / scale0Y.current);
        // upscaleZ = Math.max(upscaleZ, min / scale0Z.current);
        //
        // if (max !== undefined) {
        //   upscaleX = Math.min(upscaleX, max / scale0X.current);
        //   upscaleY = Math.min(upscaleY, max / scale0Y.current);
        //   upscaleZ = Math.min(upscaleZ, max / scale0Z.current);
        // }

        scaleCurX.current = (scale0X.current || 1) * upscaleX;
        scaleCurY.current = (scale0Y.current || 1) * upscaleY;
        scaleCurZ.current = (scale0Z.current || 1) * upscaleZ;
        // meshRef.current.position.set(scaleCurX.current, scaleCurY.current, scaleCurZ.current);
        if (annotations) {
          divRef.current.innerText = `${scaleCurX.current.toFixed(2)}`;
        }
        scaleV.set(upscaleX, upscaleY, upscaleZ);
        // scaleV.setComponent(0, upscaleX);
        // scaleV.setComponent(1, upscaleY);
        scaleMatrix
          .makeScale(currentPoint.x, currentPoint.y, currentPoint.z)
          .premultiply(mPLG)
          .multiply(mPLGInv);
        onDrag(scaleMatrix);
      }
    },
    [isHovered, fixed, scale, annotations, onDrag],
  );

  const onPointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (annotations) {
        divRef.current.style.display = "none";
      }
      console.log("onPointerUp");
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

  const onPointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(false);
  }, []);

  const { radius } = useMemo(() => {
    const radius = fixed ? (lineWidth / scale) * 1.8 : scale / 22.5;

    return { radius };
  }, [scale, lineWidth, fixed]);

  const color_ = isHovered ? hoveredColor : (color ?? axisColors[0]);

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
