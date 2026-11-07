import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getGame } from "../game";
import type { Enemy } from "../sim/world";

type V3 = [number, number, number];

function Part({ size, pos, color, mat }: { size: V3; pos: V3; color?: string; mat?: THREE.Material }) {
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

/** Shared animation: position, facing, squash, flip, and a two-step walk cycle. */
function useMob(index: number, extra?: (e: Enemy, t: number) => void) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legA = useRef<THREE.Group>(null);
  const legB = useRef<THREE.Group>(null);
  useFrame(() => {
    const w = getGame().world;
    const e = w.enemies[index];
    if (!root.current || !body.current || !e) return;
    root.current.visible = e.state !== "dead";
    if (e.state === "dead") return;
    root.current.position.set(e.x, e.y, 0);
    body.current.scale.set(1, e.state === "squashed" ? 0.3 : 1, 1);
    body.current.rotation.z = e.state === "flipped" ? Math.PI : 0;
    body.current.position.y = e.state === "flipped" ? e.h : 0;
    if (Math.abs(e.vx) > 0.05) body.current.rotation.y = e.vx > 0 ? 0.6 : -0.6;
    const swing = e.state === "walk" && Math.abs(e.vx) > 0.05 ? Math.sin(w.elapsed * 9 + index) * 0.6 : 0;
    if (legA.current) legA.current.rotation.x = swing;
    if (legB.current) legB.current.rotation.x = -swing;
    extra?.(e, w.elapsed);
  });
  return { root, body, legA, legB };
}

function Mushling({ index }: { index: number }) {
  const { root, body, legA, legB } = useMob(index);
  return (
    <group ref={root}>
      <group ref={body}>
        <group ref={legA} position={[-0.22, 0.14, 0.05]}>
          <Part size={[0.3, 0.14, 0.4]} pos={[0, -0.07, 0]} color="#1c1208" />
        </group>
        <group ref={legB} position={[0.22, 0.14, 0.05]}>
          <Part size={[0.3, 0.14, 0.4]} pos={[0, -0.07, 0]} color="#1c1208" />
        </group>
        <Part size={[0.5, 0.26, 0.5]} pos={[0, 0.27, 0]} color="#f2c890" />
        <Part size={[0.86, 0.46, 0.86]} pos={[0, 0.6, 0]} color="#8a3c14" />
        <Part size={[0.6, 0.12, 0.6]} pos={[0, 0.88, 0]} color="#6a2a0c" />
        <Part size={[0.6, 0.22, 0.04]} pos={[0, 0.5, 0.43]} color="#f2c890" />
        <Part size={[0.14, 0.18, 0.03]} pos={[-0.15, 0.6, 0.45]} color="#ffffff" />
        <Part size={[0.14, 0.18, 0.03]} pos={[0.15, 0.6, 0.45]} color="#ffffff" />
        <Part size={[0.07, 0.1, 0.03]} pos={[-0.13, 0.58, 0.47]} color="#141414" />
        <Part size={[0.07, 0.1, 0.03]} pos={[0.13, 0.58, 0.47]} color="#141414" />
      </group>
    </group>
  );
}

function Creeper({ index }: { index: number }) {
  const skin = useMemo(() => new THREE.MeshStandardMaterial({ color: "#4fae3c", roughness: 0.95 }), []);
  const { root, body, legA, legB } = useMob(index, (e, t) => {
    const fusing = e.state === "fuse";
    const flash = fusing && Math.sin(t * (30 - e.timer * 14)) > 0;
    skin.emissive.set(flash ? "#ffffff" : "#000000");
    skin.emissiveIntensity = flash ? 0.8 : 0;
    const s = fusing ? 1 + (1 - e.timer / 1.3) * 0.15 : 1;
    body.current?.scale.set(s, e.state === "squashed" ? 0.3 : s, s);
  });
  return (
    <group ref={root}>
      <group ref={body}>
        <group ref={legA} position={[0, 0.36, 0.18]}>
          <Part size={[0.7, 0.36, 0.3]} pos={[0, -0.18, 0]} mat={skin} />
        </group>
        <group ref={legB} position={[0, 0.36, -0.18]}>
          <Part size={[0.7, 0.36, 0.3]} pos={[0, -0.18, 0]} mat={skin} />
        </group>
        <Part size={[0.5, 0.72, 0.34]} pos={[0, 0.72, 0]} mat={skin} />
        <Part size={[0.62, 0.58, 0.62]} pos={[0, 1.36, 0]} mat={skin} />
        <Part size={[0.14, 0.14, 0.03]} pos={[-0.14, 1.44, 0.32]} color="#101010" />
        <Part size={[0.14, 0.14, 0.03]} pos={[0.14, 1.44, 0.32]} color="#101010" />
        <Part size={[0.14, 0.22, 0.03]} pos={[0, 1.28, 0.32]} color="#101010" />
        <Part size={[0.32, 0.1, 0.03]} pos={[0, 1.16, 0.32]} color="#101010" />
      </group>
    </group>
  );
}

function Zombie({ index, husk }: { index: number; husk: boolean }) {
  const skinColor = husk ? "#a89060" : "#5f9a4a";
  const shirt = husk ? "#7a6a48" : "#2a9ea8";
  const skin = useMemo(() => new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.9 }), [skinColor]);
  const { root, body, legA, legB } = useMob(index, (e, t) => {
    const stunned = e.cooldown > 0;
    skin.emissive.set(stunned && Math.sin(t * 40) > 0 ? "#ff3020" : "#000000");
    skin.emissiveIntensity = stunned ? 0.6 : 0;
  });
  return (
    <group ref={root}>
      <group ref={body}>
        <group ref={legA} position={[-0.13, 0.72, 0]}>
          <Part size={[0.24, 0.72, 0.26]} pos={[0, -0.36, 0]} color="#3a3a8a" />
        </group>
        <group ref={legB} position={[0.13, 0.72, 0]}>
          <Part size={[0.24, 0.72, 0.26]} pos={[0, -0.36, 0]} color="#3a3a8a" />
        </group>
        <Part size={[0.52, 0.6, 0.28]} pos={[0, 1.02, 0]} color={shirt} />
        {/* arms stretched forward */}
        <Part size={[0.2, 0.2, 0.6]} pos={[-0.36, 1.22, 0.24]} mat={skin} />
        <Part size={[0.2, 0.2, 0.6]} pos={[0.36, 1.22, 0.24]} mat={skin} />
        <Part size={[0.5, 0.5, 0.5]} pos={[0, 1.56, 0]} mat={skin} />
        <Part size={[0.12, 0.07, 0.03]} pos={[-0.12, 1.58, 0.26]} color="#101010" />
        <Part size={[0.12, 0.07, 0.03]} pos={[0.12, 1.58, 0.26]} color="#101010" />
      </group>
    </group>
  );
}

function Skeleton({ index, wither }: { index: number; wither: boolean }) {
  const bone = wither ? "#2a2a2a" : "#d8d8d0";
  const { root, body, legA, legB } = useMob(index);
  return (
    <group ref={root}>
      <group ref={body}>
        <group ref={legA} position={[-0.1, 0.72, 0]}>
          <Part size={[0.12, 0.72, 0.12]} pos={[0, -0.36, 0]} color={bone} />
        </group>
        <group ref={legB} position={[0.1, 0.72, 0]}>
          <Part size={[0.12, 0.72, 0.12]} pos={[0, -0.36, 0]} color={bone} />
        </group>
        <Part size={[0.44, 0.6, 0.18]} pos={[0, 1.02, 0]} color={bone} />
        <Part size={[0.3, 0.06, 0.2]} pos={[0, 0.9, 0]} color="#5a5a52" />
        <Part size={[0.12, 0.12, 0.56]} pos={[-0.3, 1.2, 0.2]} color={bone} />
        <Part size={[0.12, 0.12, 0.56]} pos={[0.3, 1.2, 0.2]} color={bone} />
        {/* bow */}
        <Part size={[0.06, 0.7, 0.06]} pos={[0.3, 1.2, 0.52]} color="#6b4a26" />
        <Part size={[0.5, 0.5, 0.5]} pos={[0, 1.56, 0]} color={bone} />
        <Part size={[0.12, 0.1, 0.03]} pos={[-0.12, 1.58, 0.26]} color="#202020" />
        <Part size={[0.12, 0.1, 0.03]} pos={[0.12, 1.58, 0.26]} color="#202020" />
        <Part size={[0.28, 0.05, 0.03]} pos={[0, 1.42, 0.26]} color="#202020" />
      </group>
    </group>
  );
}

function Slime({ index, magma }: { index: number; magma: boolean }) {
  const outer = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: magma ? "#5a1a0a" : "#6cd05a",
        roughness: 0.4,
        transparent: !magma,
        opacity: magma ? 1 : 0.7,
        emissive: magma ? "#ff5a10" : "#000000",
        emissiveIntensity: magma ? 0.35 : 0,
      }),
    [magma],
  );
  const { root, body } = useMob(index, (e) => {
    const s = e.size === 2 ? 1 : 0.55;
    const squish = e.onGround ? 0.85 : 1.1;
    body.current?.scale.set(s / Math.sqrt(squish), s * (e.state === "squashed" ? 0.3 : squish), s / Math.sqrt(squish));
  });
  return (
    <group ref={root}>
      <group ref={body}>
        <Part size={[0.7, 0.7, 0.7]} pos={[0, 0.5, 0]} color={magma ? "#ffa020" : "#3f9a32"} />
        <Part size={[1.25, 1.25, 1.25]} pos={[0, 0.63, 0]} mat={outer} />
        <Part size={[0.2, 0.2, 0.03]} pos={[-0.25, 0.8, 0.64]} color="#142a10" />
        <Part size={[0.2, 0.2, 0.03]} pos={[0.25, 0.8, 0.64]} color="#142a10" />
        <Part size={[0.12, 0.1, 0.03]} pos={[0.1, 0.45, 0.64]} color="#142a10" />
      </group>
    </group>
  );
}

export function Enemies() {
  const w = getGame().world;
  const theme = w.level.theme;
  return (
    <>
      {w.enemies.map((e, i) => {
        switch (e.kind) {
          case "creeper":
            return <Creeper key={i} index={i} />;
          case "zombie":
            return <Zombie key={i} index={i} husk={theme === "desert"} />;
          case "skeleton":
            return <Skeleton key={i} index={i} wither={theme === "nether"} />;
          case "slime":
            return <Slime key={i} index={i} magma={theme === "nether"} />;
          default:
            return <Mushling key={i} index={i} />;
        }
      })}
    </>
  );
}
