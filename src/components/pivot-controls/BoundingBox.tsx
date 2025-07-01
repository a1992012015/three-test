import * as React from "react";
import { forwardRef } from "react";
import * as THREE from "three";

import { context } from "./context";
import { composeRefs } from "@/libs/composeRefs";

const upV = new THREE.Vector3(0, 1, 0);

interface Props {
  direction: THREE.Vector3;
}

export const BoundingBox = forwardRef<THREE.Group, Props>(function BoundingBox(props, ref) {
  const { direction } = props;
  const { depthTest, scale, lineWidth, fixed, hoveredColor, opacity, userData } =
    React.useContext(context);

  const objRef = React.useRef<THREE.Group>(null!);

  const { cylinderLength, coneWidth, coneLength, matrixL } = React.useMemo(() => {
    console.log("fixed", { fixed, scale });
    const coneWidth = fixed ? (lineWidth / scale) * 1.6 : scale / 20;
    const coneLength = fixed ? 0.2 : scale / 5;
    const cylinderLength = fixed ? 1 - coneLength : scale - coneLength;
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      upV,
      direction.clone().normalize(),
    );
    const matrixL = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);
    return { cylinderLength, coneWidth, coneLength, matrixL };
  }, [fixed, scale, lineWidth, direction]);

  console.log({ cylinderLength, coneWidth, coneLength, matrixL, direction });

  return (
    <group ref={composeRefs(objRef, ref)}>
      <group matrixAutoUpdate={false}>
        <mesh position={direction} userData={userData}>
          <sphereGeometry args={[coneWidth * 1.4]} />
          <meshBasicMaterial
            transparent
            depthTest={depthTest}
            color={hoveredColor}
            opacity={opacity}
            polygonOffset
            polygonOffsetFactor={-10}
          />
        </mesh>
      </group>
    </group>
  );
});
