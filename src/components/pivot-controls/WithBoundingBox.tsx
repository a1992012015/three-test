import { forwardRef, ReactNode, useEffect, useRef } from "react";
import * as THREE from "three";

import { composeRefs } from "@/libs/composeRefs";

interface Props {
  color?: string;
  children: ReactNode;
}

export const WithBoundingBox = forwardRef<THREE.Group, Readonly<Props>>(function WithBoundingBox(
  { children, color = "red" },
  ref,
) {
  const objectRef = useRef<THREE.Group>(null);
  const boxHelperRef = useRef<THREE.BoxHelper>(null);

  useEffect(() => {
    const current = objectRef.current;
    if (current) {
      const boxHelper = new THREE.BoxHelper(current, color);

      boxHelperRef.current = boxHelper;

      current.add(boxHelper);

      return () => {
        current.remove(boxHelper);
      };
    }
  }, [color]);

  return (
    <group ref={composeRefs(objectRef, ref)}>
      <group>{children}</group>
    </group>
  );
});
