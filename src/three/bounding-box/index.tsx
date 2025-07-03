"use client";

import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { forwardRef, ReactNode, RefObject, useEffect, useMemo, useRef, useState } from "react";

import { AxisPointer } from "@/three/bounding-box/axis-pointer";
import { BoundingBoxContext, OnDragStartProps } from "@/three/bounding-box/context";
import { composeRefs } from "@/three/core/compose-refs";

const mL0 = new THREE.Matrix4();
const mW0 = new THREE.Matrix4();
const mP = new THREE.Matrix4();
const mPInv = new THREE.Matrix4();
const mW = new THREE.Matrix4();
const mL = new THREE.Matrix4();
const mL0Inv = new THREE.Matrix4();
const mdL = new THREE.Matrix4();

interface Props {
  color?: string;
  children: ReactNode;
  /** Drag start event */
  onDragStart?: (props: OnDragStartProps) => void;
  /** Drag event */
  onDrag?: (
    local: THREE.Matrix4,
    deltaL: THREE.Matrix4,
    world: THREE.Matrix4,
    deltaW: THREE.Matrix4,
  ) => void;
  /** Drag end event */
  onDragEnd?: () => void;
  pivotRef: RefObject<THREE.Group>;
}

export const BoundingBox = forwardRef<THREE.Group, Readonly<Props>>(function WithBoundingBox(
  { onDrag, onDragEnd, onDragStart, children, pivotRef, color = "red" },
  ref,
) {
  const invalidate = useThree((state) => state.invalidate);

  const childrenRef = useRef<THREE.Group>(null!);

  const [points, setPoints] = useState<Array<THREE.Vector3>>([]);

  useEffect(() => {
    const current = childrenRef.current;
    if (current) {
      const boxHelper = new THREE.BoxHelper(current, color);

      current.add(boxHelper);

      const box = new THREE.Box3().setFromObject(current);
      const { min, max } = box;

      setPoints([
        new THREE.Vector3(min.x, min.y, min.z),
        new THREE.Vector3(min.x, min.y, max.z),
        new THREE.Vector3(min.x, max.y, min.z),
        new THREE.Vector3(min.x, max.y, max.z),
        new THREE.Vector3(max.x, min.y, min.z),
        new THREE.Vector3(max.x, min.y, max.z),
        new THREE.Vector3(max.x, max.y, min.z),
        new THREE.Vector3(max.x, max.y, max.z),
      ]);

      return () => {
        current.remove(boxHelper);
      };
    }
  }, [color, pivotRef]);

  // React.useLayoutEffect(() => {
  //   if (!anchor) return
  //   childrenRef.current.updateWorldMatrix(true, true)
  //
  //   mPInv.copy(childrenRef.current.matrixWorld).invert()
  //   bb.makeEmpty()
  //   childrenRef.current.traverse((obj: any) => {
  //     if (!obj.geometry) return
  //     if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox()
  //     mL.copy(obj.matrixWorld).premultiply(mPInv)
  //     bbObj.copy(obj.geometry.boundingBox)
  //     bbObj.applyMatrix4(mL)
  //     bb.union(bbObj)
  //   })
  //   vCenter.copy(bb.max).add(bb.min).multiplyScalar(0.5)
  //   vSize.copy(bb.max).sub(bb.min).multiplyScalar(0.5)
  //   vAnchorOffset
  //     .copy(vSize)
  //     .multiply(new THREE.Vector3(...anchor))
  //     .add(vCenter)
  //   vPosition.set(...offset).add(vAnchorOffset)
  //   gizmoRef.current.position.copy(vPosition)
  //   invalidate()
  // })

  return (
    <BoundingBoxContext.Provider
      value={useMemo(
        () => ({
          onDragStart: (props: OnDragStartProps) => {
            mL0.copy(pivotRef.current.matrix);
            mW0.copy(pivotRef.current.matrixWorld);

            onDragStart?.(props);
            invalidate();
          },
          onDrag: (mdW: THREE.Matrix4) => {
            console.log(pivotRef.current.parent)
            mP.copy(pivotRef.current.parent!.matrixWorld);
            mPInv.copy(mP).invert();
            // After applying the delta
            mW.copy(mW0).premultiply(mdW);
            mL.copy(mW).premultiply(mPInv);
            mL0Inv.copy(mL0).invert();
            mdL.copy(mL).multiply(mL0Inv);
            ref.current.matrix.copy(mL);

            onDrag?.(mL, mdL, mW, mdW);
            invalidate();
          },
          onDragEnd: () => {
            onDragEnd?.();
            invalidate();
          },
        }),
        [invalidate, onDrag, onDragEnd, onDragStart, pivotRef],
      )}
    >
      <group position={[0, 0, 0]} rotation={[0, 0, 0]}>
        {points.map((point, i) => {
          console.log("point", point);
          return <AxisPointer key={i} point={point} direction={new THREE.Vector3(1, 0, 0)} />;
        })}
      </group>

      <group ref={composeRefs(ref, childrenRef)} matrix={undefined} matrixAutoUpdate={false}>
        {children}
      </group>
    </BoundingBoxContext.Provider>
  );
});
