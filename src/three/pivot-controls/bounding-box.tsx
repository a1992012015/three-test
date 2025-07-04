import { forwardRef, RefObject, useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { composeRefs } from "@/three/core/compose-refs";
import { AxisPointer } from "@/three/pivot-controls/axis-pointer";

interface Pointer {
  point: THREE.Vector3;
  direction: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
}

interface Props {
  color?: string;
  childrenRef?: RefObject<THREE.Group>;
}

export const BoundingBox = forwardRef<THREE.Group, Readonly<Props>>(function WithBoundingBox(
  { childrenRef, color = "red" },
  ref,
) {
  const [points, setPoints] = useState<Array<Pointer>>([]);

  const boxHelperRef = useRef<THREE.BoxHelper>(null);

  useEffect(() => {
    const current = childrenRef?.current;
    if (current) {
      const boxHelper = new THREE.BoxHelper(current, color);

      current.add(boxHelper);

      boxHelperRef.current = boxHelper;

      const box = new THREE.Box3().setFromObject(current);
      const { min, max } = box;

      const worldCorners = [
        new THREE.Vector3(min.x, min.y, min.z),
        new THREE.Vector3(min.x, min.y, max.z),
        new THREE.Vector3(min.x, max.y, min.z),
        new THREE.Vector3(min.x, max.y, max.z),
        new THREE.Vector3(max.x, min.y, min.z),
        new THREE.Vector3(max.x, min.y, max.z),
        new THREE.Vector3(max.x, max.y, min.z),
        new THREE.Vector3(max.x, max.y, max.z),
      ];

      setPoints([
        {
          point: new THREE.Vector3(max.x, max.y, max.z),
          direction: [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 1),
          ],
        },
        {
          point: new THREE.Vector3(min.x, min.y, max.z),
          direction: [
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, 0, 1),
          ],
        },
      ]);

      return () => {
        current.remove(boxHelper);
      };
    }
  }, [childrenRef, color]);

  return (
    <group ref={composeRefs(ref)}>
      {points.map(
        (p, index) => {
          console.log(`====================== index => ${index} point: `, p);
          return (
            <AxisPointer
              key={index}
              color="blue"
              point={p.point}
              directions={p.direction}
              childrenRef={childrenRef}
            />
          );
        },

        // <AxisPointer
        //   color="blue"
        //   point={new THREE.Vector3(0, 0, 0)}
        //   directions={[
        //     new THREE.Vector3(1, 0, 0),
        //     new THREE.Vector3(0, 1, 0),
        //     new THREE.Vector3(0, 0, 1),
        //   ]}
        // />
        // <AxisPointer
        //   color="blue"
        //   point={new THREE.Vector3(2, 2, 2)}
        //   directions={[
        //     new THREE.Vector3(1, 0, 0),
        //     new THREE.Vector3(0, 1, 0),
        //     new THREE.Vector3(0, 0, 1),
        //   ]}
        // />
      )}
    </group>
  );
});
