// Procedural 16x16 pixel-art block textures (Minecraft-style blocks, Mario-style palette).
import * as THREE from "three";

type Draw = (px: (x: number, y: number, c: string) => void, rnd: () => number) => void;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function make(seed: number, draw: Draw): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d")!;
  const px = (x: number, y: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 1, 1);
  };
  draw(px, rng(seed));
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const pick = (r: () => number, arr: string[]) => arr[Math.floor(r() * arr.length)]!;

const GRASS = ["#4f9a32", "#5bae3a", "#67bf45", "#5bae3a", "#468c2c"];
const DIRT = ["#8a5a33", "#7a4e2c", "#96663d", "#8a5a33", "#6b4326"];
const LEAVES = ["#3f8a2a", "#4b9e33", "#357622", "#58b03c"];

const QUESTION = [
  "................",
  "................",
  "................",
  ".....#####......",
  "....##...##.....",
  "....##...##.....",
  ".........##.....",
  "........##......",
  ".......##.......",
  ".......##.......",
  "................",
  ".......##.......",
  ".......##.......",
  "................",
  "................",
  "................",
];

function noise(px: Parameters<Draw>[0], r: () => number, pal: string[]) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, pick(r, pal));
}

function rivets(px: Parameters<Draw>[0], c: string) {
  for (const [x, y] of [
    [2, 2],
    [13, 2],
    [2, 13],
    [13, 13],
  ])
    px(x!, y!, c);
}

let cache: ReturnType<typeof buildTextures> | null = null;

export function getTextures() {
  if (!cache) cache = buildTextures();
  return cache;
}

function buildTextures() {
  return {
    grassTop: make(1, (px, r) => noise(px, r, GRASS)),
    dirt: make(2, (px, r) => noise(px, r, DIRT)),
    grassSide: make(3, (px, r) => {
      noise(px, r, DIRT);
      for (let x = 0; x < 16; x++) {
        const depth = 3 + (r() < 0.45 ? 1 : 0) + (r() < 0.2 ? 1 : 0);
        for (let y = 0; y < depth; y++) px(x, y, pick(r, GRASS));
      }
    }),
    brick: make(4, (px, r) => {
      for (let y = 0; y < 16; y++) {
        const row = Math.floor(y / 4);
        const offset = row % 2 === 0 ? 0 : 4;
        for (let x = 0; x < 16; x++) {
          const mortar = y % 4 === 3 || (x + offset) % 8 === 7;
          const top = y % 4 === 0;
          px(x, y, mortar ? "#2e1406" : top ? "#e88a52" : r() < 0.15 ? "#b04a16" : "#c85a1e");
        }
      }
    }),
    question: make(5, (px) => {
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          const edge = x === 0 || y === 0 || x === 15 || y === 15;
          px(x, y, edge ? "#7a3a06" : x === 1 || y === 1 ? "#ffd27a" : "#f5a81c");
        }
      rivets(px, "#7a3a06");
      QUESTION.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          if (ch !== "#") return;
          px(x + 1, y + 1, "#7a3a06");
          px(x, y, "#fff4cf");
        }),
      );
    }),
    used: make(6, (px, r) => {
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          const edge = x === 0 || y === 0 || x === 15 || y === 15;
          px(x, y, edge ? "#3a1e0a" : r() < 0.2 ? "#7a4a22" : "#8b5a2b");
        }
      rivets(px, "#3a1e0a");
    }),
    stone: make(7, (px, r) => {
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          let c = r() < 0.18 ? "#a85e2c" : "#b86b35";
          if (x === 0 || y === 0) c = "#f2b483";
          else if (x === 15 || y === 15) c = "#4a230c";
          else if (x === 1 || y === 1) c = "#d98a52";
          else if (x === 14 || y === 14) c = "#7a3c16";
          px(x, y, c);
        }
    }),
    pipe: make(8, (px) => {
      const cols = [
        "#0e4d12", "#1e7a1e", "#3cb43c", "#9be89b", "#c8f5c8", "#7ad87a", "#3cb43c", "#3cb43c",
        "#34a434", "#2e962e", "#288a28", "#228022", "#1e7a1e", "#18661a", "#125414", "#0e4d12",
      ];
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, cols[x]!);
    }),
    pipeLip: make(9, (px) => {
      const cols = [
        "#0e4d12", "#1e7a1e", "#3cb43c", "#9be89b", "#c8f5c8", "#7ad87a", "#3cb43c", "#3cb43c",
        "#34a434", "#2e962e", "#288a28", "#228022", "#1e7a1e", "#18661a", "#125414", "#0e4d12",
      ];
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) px(x, y, y < 1 || y > 14 ? "#0a3a0c" : cols[x]!);
    }),
    leaves: make(10, (px, r) => {
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) px(x, y, r() < 0.12 ? "#23561a" : pick(r, LEAVES));
    }),
    log: make(11, (px, r) => {
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++)
          px(x, y, x % 4 === 0 ? "#4a3218" : r() < 0.3 ? "#6b4a26" : "#7d5830");
    }),
    sand: make(13, (px, r) => noise(px, r, ["#e8d7a0", "#dfcb8e", "#efe0ad", "#d8c283"])),
    sandstone: make(14, (px, r) => {
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          const band = y < 3 ? ["#efe0ad", "#e6d49c"] : y > 12 ? ["#c9b277", "#d4bd82"] : ["#ddc98f", "#d6c088"];
          px(x, y, pick(r, band));
        }
    }),
    snowTop: make(15, (px, r) => noise(px, r, ["#ffffff", "#f2f7fb", "#e8f0f6", "#ffffff"])),
    snowSide: make(16, (px, r) => {
      noise(px, r, DIRT);
      for (let x = 0; x < 16; x++) {
        const depth = 3 + (r() < 0.5 ? 1 : 0);
        for (let y = 0; y < depth; y++) px(x, y, pick(r, ["#ffffff", "#eef4f8"]));
      }
    }),
    cobble: make(17, (px, r) => {
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          const seam = (x + Math.floor(y / 4) * 3) % 6 === 0 || y % 4 === 0;
          px(x, y, seam ? "#4a4a4a" : pick(r, ["#7d7d7d", "#8c8c8c", "#6e6e6e", "#959595"]));
        }
    }),
    deepslate: make(18, (px, r) => noise(px, r, ["#4a4a52", "#3e3e46", "#55555e", "#44444c"])),
    ore: make(19, (px, r) => {
      noise(px, r, ["#7d7d7d", "#8c8c8c", "#6e6e6e"]);
      for (const [x, y] of [[3, 3], [4, 3], [10, 5], [11, 6], [5, 11], [12, 12], [11, 12]]) px(x!, y!, "#5ee6e0");
    }),
    netherrack: make(20, (px, r) => noise(px, r, ["#6e2222", "#7d2a2a", "#5e1a1a", "#8a3434", "#6a2020"])),
    netherBrick: make(21, (px, r) => {
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          const off = Math.floor(y / 4) % 2 ? 4 : 0;
          const mortar = y % 4 === 3 || (x + off) % 8 === 7;
          px(x, y, mortar ? "#1a0a0e" : r() < 0.2 ? "#3a1218" : "#4a1a20");
        }
    }),
    endStone: make(22, (px, r) => noise(px, r, ["#e8eaa8", "#dfe29a", "#f0f2b8", "#d6d98e"])),
    obsidian: make(23, (px, r) => {
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) px(x, y, r() < 0.08 ? "#6a3fa0" : pick(r, ["#150f22", "#1d1530", "#100a1a"]));
    }),
    cactus: make(24, (px, r) => {
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) px(x, y, x % 4 === 1 ? "#0f4a12" : r() < 0.06 ? "#e8e0b0" : pick(r, ["#1f7a24", "#25862a"]));
    }),
    spruce: make(25, (px, r) => {
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) px(x, y, r() < 0.25 ? "#f4f8fb" : pick(r, ["#1e4a2a", "#245533", "#183f22"]));
    }),
    logTop: make(12, (px) => {
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
          px(x, y, d > 6.5 ? "#4a3218" : Math.floor(d) % 2 ? "#b8925a" : "#a07a44");
        }
    }),
  };
}

let matCache: ReturnType<typeof buildMaterials> | null = null;

function buildMaterials() {
  const t = getTextures();
  const std = (map: THREE.Texture, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshStandardMaterial({ map, roughness: 1, metalness: 0, ...extra });
  const side = std(t.grassSide);
  const top = std(t.grassTop);
  const dirt = std(t.dirt);
  const logSide = std(t.log);
  const logTop = std(t.logTop);
  return {
    // Box face order: +x, -x, +y, -y, +z, -z
    grass: [side, side, top, dirt, side, side],
    dirt,
    brick: std(t.brick),
    question: std(t.question, { emissive: new THREE.Color("#ffb020"), emissiveIntensity: 0.1 }),
    used: std(t.used),
    stone: std(t.stone),
    pipe: std(t.pipe),
    pipeLip: std(t.pipeLip),
    leaves: std(t.leaves),
    log: [logSide, logSide, logTop, logTop, logSide, logSide],
    sand: std(t.sand),
    sandBlock: [std(t.sandstone), std(t.sandstone), std(t.sand), std(t.sandstone), std(t.sandstone), std(t.sandstone)],
    sandstone: std(t.sandstone),
    snowGrass: [std(t.snowSide), std(t.snowSide), std(t.snowTop), dirt, std(t.snowSide), std(t.snowSide)],
    snow: std(t.snowTop),
    cobble: std(t.cobble),
    deepslate: std(t.deepslate),
    ore: std(t.ore),
    netherrack: std(t.netherrack),
    netherBrick: std(t.netherBrick),
    endStone: std(t.endStone),
    obsidian: std(t.obsidian, { roughness: 0.4 }),
    cactus: std(t.cactus),
    spruce: std(t.spruce),
    cloud: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, emissive: "#ffffff", emissiveIntensity: 0.35 }),
    coin: new THREE.MeshStandardMaterial({ color: "#ffc42e", roughness: 0.35, metalness: 0.4, emissive: "#ff9a00", emissiveIntensity: 0.35 }),
  };
}

export function getMaterials() {
  if (!matCache) matCache = buildMaterials();
  return matCache;
}

export const BOX = new THREE.BoxGeometry(1, 1, 1);
