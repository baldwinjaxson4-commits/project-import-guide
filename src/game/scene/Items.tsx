import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getGame } from "../game";
import { T } from "../sim/level";
import { getMaterials } from "./textures";

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const S = new THREE.Vector3(1, 1, 1);
const P = new THREE.Vector3();
const Y = new THREE.Vector3(0, 1, 0);
const COIN_GEO = new THREE.BoxGeometry(0.5, 0.7, 0.14);
const DEBRIS_GEO = new THREE.BoxGeometry(0.4, 0.4, 0.4);

/** Floating coins, coins popping out of ? blocks and brick debris. */
export function Coins() {
  const mats = getMaterials();
  const coinsRef = useRef<THREE.InstancedMesh>(null);
  const fxRef = useRef<THREE.InstancedMesh>(null);
  const debrisRef = useRef<THREE.InstancedMesh>(null);
  const cap = getGame().world.coins.length;

  useFrame(() => {
    const w = getGame().world;
    const spin = w.elapsed * 3;
    if (coinsRef.current) {
      let n = 0;
      for (const c of w.coins) {
        if (c.taken) continue;
        Q.setFromAxisAngle(Y, spin + c.x * 0.3);
        M.compose(P.set(c.x, c.y + Math.sin(w.elapsed * 3 + c.x) * 0.06, 0), Q, S);
        coinsRef.current.setMatrixAt(n++, M);
      }
      coinsRef.current.count = n;
      coinsRef.current.instanceMatrix.needsUpdate = true;
    }
    if (fxRef.current && debrisRef.current) {
      let nc = 0,
        nd = 0;
      for (const e of w.effects) {
        if (e.kind === "coin" && nc < 16) {
          Q.setFromAxisAngle(Y, e.t * 30);
          M.compose(P.set(e.x, e.y, 0), Q, S);
          fxRef.current.setMatrixAt(nc++, M);
        } else if (e.kind === "debris" && nd < 32) {
          Q.setFromAxisAngle(Y, e.t * 10);
          M.compose(P.set(e.x, e.y, 0.2), Q, S);
          debrisRef.current.setMatrixAt(nd++, M);
        }
      }
      fxRef.current.count = nc;
      debrisRef.current.count = nd;
      fxRef.current.instanceMatrix.needsUpdate = true;
      debrisRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={coinsRef} args={[COIN_GEO, mats.coin, Math.max(1, cap)]} frustumCulled={false} castShadow />
      <instancedMesh ref={fxRef} args={[COIN_GEO, mats.coin, 16]} frustumCulled={false} />
      <instancedMesh ref={debrisRef} args={[DEBRIS_GEO, mats.brick, 32]} frustumCulled={false} castShadow />
    </>
  );
}

type V3 = [number, number, number];
function Box({ size, pos, color, glow }: { size: V3; pos: V3; color: string; glow?: string }) {
  return (
    <mesh position={pos} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.6} emissive={glow ?? "#000000"} emissiveIntensity={glow ? 0.6 : 0} />
    </mesh>
  );
}

function AppleModel() {
  return (
    <>
      <Box size={[0.56, 0.5, 0.56]} pos={[0, 0.3, 0]} color="#ffcf2a" glow="#ffae00" />
      <Box size={[0.08, 0.16, 0.08]} pos={[0, 0.62, 0]} color="#5a3a1a" />
      <Box size={[0.2, 0.08, 0.1]} pos={[0.12, 0.66, 0]} color="#3cae2c" />
    </>
  );
}
function FireChargeModel() {
  return (
    <>
      <Box size={[0.5, 0.5, 0.5]} pos={[0, 0.35, 0]} color="#3a1a0a" glow="#ff5a00" />
      <Box size={[0.2, 0.2, 0.52]} pos={[0.1, 0.42, 0]} color="#ffb020" glow="#ff8a00" />
      <Box size={[0.52, 0.14, 0.14]} pos={[0, 0.25, 0.1]} color="#ff6a10" glow="#ff4a00" />
    </>
  );
}
function ArmorModel() {
  const c = "#5ee6e0";
  return (
    <>
      <Box size={[0.6, 0.42, 0.26]} pos={[0, 0.42, 0]} color={c} glow="#20b0b0" />
      <Box size={[0.2, 0.22, 0.26]} pos={[-0.32, 0.6, 0]} color={c} glow="#20b0b0" />
      <Box size={[0.2, 0.22, 0.26]} pos={[0.32, 0.6, 0]} color={c} glow="#20b0b0" />
      <Box size={[0.44, 0.2, 0.26]} pos={[0, 0.12, 0]} color="#3fc4be" />
    </>
  );
}
function TotemModel() {
  return (
    <>
      <Box size={[0.36, 0.3, 0.2]} pos={[0, 0.66, 0]} color="#f0c030" glow="#c08a00" />
      <Box size={[0.08, 0.08, 0.02]} pos={[-0.08, 0.68, 0.11]} color="#20d040" glow="#20ff40" />
      <Box size={[0.08, 0.08, 0.02]} pos={[0.08, 0.68, 0.11]} color="#20d040" glow="#20ff40" />
      <Box size={[0.3, 0.32, 0.18]} pos={[0, 0.34, 0]} color="#e0a820" />
      <Box size={[0.56, 0.1, 0.12]} pos={[0, 0.4, 0]} color="#f0c030" />
      <Box size={[0.2, 0.16, 0.16]} pos={[0, 0.1, 0]} color="#c09020" />
    </>
  );
}

const MODELS = { apple: AppleModel, fire: FireChargeModel, armor: ArmorModel, totem: TotemModel };

function PowerupModel({ index }: { index: number }) {
  const ref = useRef<THREE.Group>(null);
  const kinds = useRef<Record<string, THREE.Group | null>>({});
  useFrame(() => {
    const w = getGame().world;
    const m = w.items[index];
    if (!ref.current) return;
    ref.current.visible = !!m && m.state !== "gone";
    if (!m) return;
    ref.current.position.set(m.x, m.y, 0);
    ref.current.rotation.y = w.elapsed * 2;
    for (const [k, g] of Object.entries(kinds.current)) if (g) g.visible = k === m.kind;
  });
  return (
    <group ref={ref} visible={false}>
      {Object.entries(MODELS).map(([k, Model]) => (
        <group key={k} ref={(g) => void (kinds.current[k] = g)}>
          <Model />
        </group>
      ))}
    </group>
  );
}

export function Powerups() {
  const count = useMemo(() => getGame().world.level.tiles.filter((t) => t === T.QPOWER).length, []);
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <PowerupModel key={i} index={i} />
      ))}
    </>
  );
}

const ARROW_GEO = new THREE.BoxGeometry(0.8, 0.07, 0.07);
const FIRE_GEO = new THREE.BoxGeometry(0.4, 0.4, 0.4);
const SMOKE_GEO = new THREE.BoxGeometry(0.6, 0.6, 0.6);
const ARROW_MAT = new THREE.MeshStandardMaterial({ color: "#e8e0d0", roughness: 0.8 });
const FIRE_MAT = new THREE.MeshStandardMaterial({ color: "#ff8a20", emissive: "#ff4a00", emissiveIntensity: 1.2 });
const SMOKE_MAT = new THREE.MeshStandardMaterial({ color: "#d8d8d8", roughness: 1, transparent: true, opacity: 0.85 });
const Z = new THREE.Vector3(0, 0, 1);
const SC = new THREE.Vector3();

/** Skeleton arrows, player fireballs and creeper explosion smoke. */
export function Projectiles() {
  const arrows = useRef<THREE.InstancedMesh>(null);
  const fire = useRef<THREE.InstancedMesh>(null);
  const smoke = useRef<THREE.InstancedMesh>(null);
  useFrame(() => {
    const w = getGame().world;
    if (!arrows.current || !fire.current || !smoke.current) return;
    let na = 0,
      nf = 0,
      ns = 0;
    for (const f of w.projectiles) {
      if (f.kind === "arrow" && na < 16) {
        Q.setFromAxisAngle(Z, Math.atan2(f.vy, f.vx));
        arrows.current.setMatrixAt(na++, M.compose(P.set(f.x, f.y, 0), Q, S));
      } else if (f.kind === "fireball" && nf < 4) {
        Q.setFromAxisAngle(Z, f.t * 15);
        fire.current.setMatrixAt(nf++, M.compose(P.set(f.x, f.y, 0), Q, S));
      }
    }
    for (const e of w.effects) {
      if (e.kind !== "smoke" || ns >= 64) continue;
      const k = 0.6 + (e.t / e.life) * 1.4;
      Q.setFromAxisAngle(Y, e.t * 4);
      smoke.current.setMatrixAt(ns++, M.compose(P.set(e.x, e.y, 0.3), Q, SC.set(k, k, k)));
    }
    arrows.current.count = na;
    fire.current.count = nf;
    smoke.current.count = ns;
    arrows.current.instanceMatrix.needsUpdate = true;
    fire.current.instanceMatrix.needsUpdate = true;
    smoke.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={arrows} args={[ARROW_GEO, ARROW_MAT, 16]} frustumCulled={false} />
      <instancedMesh ref={fire} args={[FIRE_GEO, FIRE_MAT, 4]} frustumCulled={false} />
      <instancedMesh ref={smoke} args={[SMOKE_GEO, SMOKE_MAT, 64]} frustumCulled={false} />
    </>
  );
}
