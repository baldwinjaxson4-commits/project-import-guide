import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getGame } from "../game";
import { BIG_H, SMALL_H, SWORD_SWING_TIME } from "../sim/constants";

const MODEL_H = 1.9;
const BIG_SCALE = BIG_H / MODEL_H;
const SMALL_SCALE = SMALL_H / MODEL_H;

const COLORS = {
  shirt: "#14a8a8", // Steve's teal shirt
  pants: "#3c3ca8",
  skin: "#c8946a",
  hair: "#4a2e16",
  beard: "#6b4a2a",
  shoe: "#5a5a5a",
  white: "#f4f4f4",
  iris: "#5a3ca8",
  mouth: "#7a4a2a",
  fireShirt: "#e86a1a",
  firePants: "#7a2a10",
  blade: "#5ee6e0",
  hilt: "#3a2a16",
};

function Vox({
  size,
  pos,
  color,
  mat,
}: {
  size: [number, number, number];
  pos: [number, number, number];
  color?: string;
  mat?: THREE.Material;
}) {
  return (
    <>{mat ? (
      <mesh position={pos} castShadow material={mat}>
        <boxGeometry args={size} />
      </mesh>
    ) : (
      <mesh position={pos} castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color ?? "#ffffff"} roughness={0.9} />
      </mesh>
    )}</>
  );
}

/** Steve: blocky Minecraft hero. Built facing +z, 1.9 units tall, feet at y=0. */
export function Player() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const anim = useRef({ scale: SMALL_SCALE, yaw: Math.PI / 2, phase: 0 });
  const shirt = useMemo(() => new THREE.MeshStandardMaterial({ color: COLORS.shirt, roughness: 0.9 }), []);
  const pants = useMemo(() => new THREE.MeshStandardMaterial({ color: COLORS.pants, roughness: 0.9 }), []);
  const sword = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const w = getGame().world;
    const p = w.player;
    const a = anim.current;
    const dt = Math.min(delta, 0.05);
    if (!root.current || !body.current) return;

    root.current.position.set(p.x, p.y, 0);
    const targetScale = p.big ? BIG_SCALE : SMALL_SCALE;
    a.scale += (targetScale - a.scale) * (1 - Math.exp(-10 * dt));
    root.current.scale.setScalar(a.scale);

    const dying = w.status === "dying";
    const targetYaw = dying ? 0 : p.facing > 0 ? Math.PI / 2 - 0.4 : -Math.PI / 2 + 0.4;
    a.yaw += (targetYaw - a.yaw) * (1 - Math.exp(-14 * dt));
    body.current.rotation.y = a.yaw;

    const speed = Math.abs(p.vx);
    a.phase += speed * dt * 2.4;
    let lL = 0,
      lR = 0,
      aL = 0,
      aR = 0;
    if (dying) {
      aL = aR = -2.9;
    } else if (!p.onGround) {
      lL = -0.8;
      lR = 0.5;
      aR = -2.7;
      aL = 0.5;
    } else {
      const s = Math.sin(a.phase) * Math.min(1, speed / 4) * 0.9;
      lL = s;
      lR = -s;
      aL = -s * 0.8;
      aR = s * 0.8;
    }
    if (!dying && p.sword) {
      if (p.swing > 0) aR = -2.9 + (1 - p.swing / SWORD_SWING_TIME) * 2.6;
      else if (p.onGround) aR = -0.5 + aR * 0.3;
    }
    if (sword.current) sword.current.visible = p.sword;
    legL.current!.rotation.x = lL;
    legR.current!.rotation.x = lR;
    armL.current!.rotation.x = aL;
    armR.current!.rotation.x = aR;

    // Fire Charge: blaze-orange outfit. Diamond Armor: shimmering diamond outfit.
    if (p.armor > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(w.elapsed * 12);
      shirt.color.set("#5ee6e0");
      pants.color.set("#2fb8c0");
      shirt.emissive.set("#40e0ff");
      shirt.emissiveIntensity = 0.2 + pulse * 0.5;
      pants.emissive.set("#40e0ff");
      pants.emissiveIntensity = 0.1 + pulse * 0.3;
    } else {
      shirt.color.set(p.fire ? COLORS.fireShirt : COLORS.shirt);
      pants.color.set(p.fire ? COLORS.firePants : COLORS.pants);
      shirt.emissiveIntensity = 0;
      pants.emissiveIntensity = 0;
    }

    const blink = p.invuln > 0 && Math.floor(w.elapsed * 20) % 2 === 0;
    root.current.visible = p.visible && !blink;
  });

  return (
    <group ref={root}>
      <group ref={body}>
        {/* legs (pivot at hip) */}
        <group ref={legL} position={[-0.15, 0.72, 0]}>
          <Vox size={[0.3, 0.58, 0.3]} pos={[0, -0.27, 0]} mat={pants} />
          <Vox size={[0.31, 0.16, 0.31]} pos={[0, -0.64, 0]} color={COLORS.shoe} />
        </group>
        <group ref={legR} position={[0.15, 0.72, 0]}>
          <Vox size={[0.3, 0.58, 0.3]} pos={[0, -0.27, 0]} mat={pants} />
          <Vox size={[0.31, 0.16, 0.31]} pos={[0, -0.64, 0]} color={COLORS.shoe} />
        </group>
        {/* torso */}
        <Vox size={[0.6, 0.62, 0.3]} pos={[0, 1.03, 0]} mat={shirt} />
        <Vox size={[0.2, 0.06, 0.02]} pos={[0, 1.31, 0.16]} color={COLORS.skin} />
        {/* arms (pivot at shoulder) */}
        <group ref={armL} position={[-0.4, 1.3, 0]}>
          <Vox size={[0.2, 0.22, 0.24]} pos={[0, -0.1, 0]} mat={shirt} />
          <Vox size={[0.2, 0.4, 0.24]} pos={[0, -0.41, 0]} color={COLORS.skin} />
        </group>
        <group ref={armR} position={[0.4, 1.3, 0]}>
          <Vox size={[0.2, 0.22, 0.24]} pos={[0, -0.1, 0]} mat={shirt} />
          <Vox size={[0.2, 0.4, 0.24]} pos={[0, -0.41, 0]} color={COLORS.skin} />
          {/* Diamond Sword, held in the right hand */}
          <group ref={sword} position={[0, -0.58, 0.08]} rotation-x={-1.3} visible={false}>
            <Vox size={[0.08, 0.2, 0.08]} pos={[0, 0, 0]} color={COLORS.hilt} />
            <Vox size={[0.3, 0.07, 0.1]} pos={[0, -0.12, 0]} color={COLORS.hilt} />
            <Vox size={[0.12, 0.7, 0.05]} pos={[0, -0.5, 0]} color={COLORS.blade} />
            <Vox size={[0.06, 0.1, 0.05]} pos={[0, -0.9, 0]} color={COLORS.blade} />
          </group>
        </group>
        {/* head */}
        <Vox size={[0.56, 0.56, 0.56]} pos={[0, 1.62, 0]} color={COLORS.skin} />
        <Vox size={[0.58, 0.14, 0.58]} pos={[0, 1.86, 0]} color={COLORS.hair} />
        <Vox size={[0.58, 0.46, 0.08]} pos={[0, 1.68, -0.26]} color={COLORS.hair} />
        <Vox size={[0.06, 0.18, 0.58]} pos={[-0.27, 1.76, 0]} color={COLORS.hair} />
        <Vox size={[0.06, 0.18, 0.58]} pos={[0.27, 1.76, 0]} color={COLORS.hair} />
        <Vox size={[0.58, 0.07, 0.04]} pos={[0, 1.77, 0.27]} color={COLORS.hair} />
        {/* eyes: white + purple-blue iris */}
        <Vox size={[0.14, 0.07, 0.03]} pos={[-0.14, 1.66, 0.285]} color={COLORS.white} />
        <Vox size={[0.14, 0.07, 0.03]} pos={[0.14, 1.66, 0.285]} color={COLORS.white} />
        <Vox size={[0.07, 0.07, 0.035]} pos={[-0.105, 1.66, 0.29]} color={COLORS.iris} />
        <Vox size={[0.07, 0.07, 0.035]} pos={[0.105, 1.66, 0.29]} color={COLORS.iris} />
        {/* nose, mouth and stubble */}
        <Vox size={[0.14, 0.07, 0.03]} pos={[0, 1.59, 0.285]} color={COLORS.beard} />
        <Vox size={[0.28, 0.07, 0.03]} pos={[0, 1.48, 0.285]} color={COLORS.mouth} />
        <Vox size={[0.07, 0.07, 0.03]} pos={[-0.175, 1.51, 0.285]} color={COLORS.beard} />
        <Vox size={[0.07, 0.07, 0.03]} pos={[0.175, 1.51, 0.285]} color={COLORS.beard} />
      </group>
    </group>
  );
}
