// Per-theme look: block materials, sky, fog and background decoration.
import type * as THREE from "three";
import type { Theme } from "../sim/level";
import { getMaterials } from "./textures";

type Mat = THREE.Material | THREE.Material[];

export interface ThemeLook {
  top: Mat; // surface ground block
  fill: Mat; // ground below the surface
  stone: Mat; // hard blocks (stairs, pillars, cave ceiling)
  field: THREE.Material; // big floor plane behind the lane (single texture)
  sky: string;
  fog: string;
  hemiSky: string;
  hemiGround: string;
  sun: number;
  tree: "oak" | "cactus" | "spruce" | "pillar" | "none";
  clouds: boolean;
  hills: boolean;
}

export function themeLook(theme: Theme): ThemeLook {
  const m = getMaterials();
  const grassTop = m.grass[2]!;
  switch (theme) {
    case "desert":
      return { top: m.sandBlock, fill: m.sandstone, stone: m.stone, field: m.sand, sky: "#f6d9a2", fog: "#f7e4bd", hemiSky: "#fff3d8", hemiGround: "#a0804a", sun: 2.1, tree: "cactus", clouds: true, hills: true };
    case "nether":
      return { top: m.netherrack, fill: m.netherrack, stone: m.netherBrick, field: m.netherrack, sky: "#5a1a12", fog: "#80301c", hemiSky: "#ffb08a", hemiGround: "#4a1208", sun: 1.4, tree: "none", clouds: false, hills: true };
    case "cave":
      return { top: m.cobble, fill: m.deepslate, stone: m.ore, field: m.deepslate, sky: "#2c2724", fog: "#2c2724", hemiSky: "#ffe2b8", hemiGround: "#3a3028", sun: 1.3, tree: "none", clouds: false, hills: false };
    case "snow":
      return { top: m.snowGrass, fill: m.dirt, stone: m.cobble, field: m.snow, sky: "#cfe3f2", fog: "#e8f2fa", hemiSky: "#eef6ff", hemiGround: "#8a9aa8", sun: 1.8, tree: "spruce", clouds: true, hills: true };
    case "end":
      return { top: m.endStone, fill: m.endStone, stone: m.obsidian, field: m.endStone, sky: "#1a1428", fog: "#2a2040", hemiSky: "#d8c8ff", hemiGround: "#3a3050", sun: 1.5, tree: "pillar", clouds: false, hills: false };
    case "sky":
      return { top: m.grass, fill: m.dirt, stone: m.stone, field: grassTop, sky: "#9fd8ff", fog: "#d6efff", hemiSky: "#dff1ff", hemiGround: "#6b4a2a", sun: 1.9, tree: "oak", clouds: true, hills: true };
    default:
      return { top: m.grass, fill: m.dirt, stone: m.stone, field: grassTop, sky: "#8fd0ff", fog: "#bfe6ff", hemiSky: "#dff1ff", hemiGround: "#6b4a2a", sun: 1.9, tree: "oak", clouds: true, hills: true };
  }
}
