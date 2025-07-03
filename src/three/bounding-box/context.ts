import { createContext } from "react";
import * as THREE from "three";

export type OnDragStartProps = {
  origin: THREE.Vector3;
  directions: THREE.Vector3[];
};

export type BoundingBoxContext = {
  onDragStart: (props: OnDragStartProps) => void;
  onDrag: (mdW: THREE.Matrix4) => void;
  onDragEnd: () => void;
};

export const BoundingBoxContext = createContext<BoundingBoxContext>(null!);
