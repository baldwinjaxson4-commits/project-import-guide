// Level layouts. Pure data, no React or three.js.

export const T = {
  EMPTY: 0,
  GROUND: 1,
  BRICK: 2,
  QCOIN: 3,
  QPOWER: 4, // gives a random power-up
  USED: 5,
  STONE: 6,
  PIPE: 7,
} as const;
export type TileId = (typeof T)[keyof typeof T];

export type Theme = "grass" | "desert" | "sky" | "nether" | "cave" | "snow" | "end";
export type EnemyKind = "spider" | "creeper" | "zombie" | "skeleton" | "slime";
export interface EnemySpawn {
  x: number;
  y: number;
  kind: EnemyKind;
}

export interface LevelData {
  name: string;
  title: string;
  theme: Theme;
  width: number;
  height: number;
  tiles: Uint8Array;
  start: { x: number; y: number };
  enemies: EnemySpawn[];
  coins: { x: number; y: number }[];
  pipes: { x: number; h: number; base: number }[];
  gaps: [number, number][];
  flagX: number;
  flagTop: number;
  castleX: number;
}

const HEIGHT = 16;

class Builder {
  width: number;
  tiles: Uint8Array;
  enemies: EnemySpawn[] = [];
  coins: { x: number; y: number }[] = [];
  pipes: { x: number; h: number; base: number }[] = [];
  constructor(public flagX: number) {
    this.width = flagX + 14;
    this.tiles = new Uint8Array(this.width * HEIGHT);
  }
  set(x: number, y: number, t: number) {
    if (x >= 0 && x < this.width && y >= 0 && y < HEIGHT) this.tiles[y * this.width + x] = t;
  }
  /** Two-row ground from x0 (inclusive) to x1 (exclusive), skipping gaps. */
  ground(x0: number, x1: number, gaps: [number, number][] = []) {
    for (let x = x0; x < Math.min(x1, this.width); x++) {
      if (gaps.some(([a, b]) => x >= a && x < b)) continue;
      this.set(x, 0, T.GROUND);
      this.set(x, 1, T.GROUND);
    }
  }
  /** One-block-thick floating grass platform at row y, x0..x1 inclusive. */
  platform(x0: number, x1: number, y: number) {
    for (let x = x0; x <= x1; x++) this.set(x, y, T.GROUND);
  }
  /** Stone column rising from the bottom of the world; its top is at y = h. */
  pillar(x: number, h: number) {
    for (let y = 0; y < h; y++) this.set(x, y, T.STONE);
  }
  row(x0: number, x1: number, y: number, t: number) {
    for (let x = x0; x <= x1; x++) this.set(x, y, t);
  }
  pipe(x: number, h: number, base = 2) {
    this.pipes.push({ x, h, base });
    for (let y = base; y < base + h; y++) {
      this.set(x, y, T.PIPE);
      this.set(x + 1, y, T.PIPE);
    }
  }
  stairs(x: number, n: number, dir: 1 | -1, extra = 0) {
    for (let i = 0; i < n + extra; i++) {
      const h = dir === 1 ? Math.min(n, i + 1) : n - i;
      for (let y = 2; y < 2 + h; y++) this.set(x + i, y, T.STONE);
    }
  }
  coinRow(x0: number, x1: number, y: number) {
    for (let x = x0; x <= x1; x++) this.coins.push({ x: x + 0.5, y: y + 0.5 });
  }
  /** Spawn a mob; without y it stands on the first surface above the bottom of the world. */
  enemy(x: number, y = NaN) {
    this.enemies.push({ x, y, kind: "spider" });
  }
  mob(kind: EnemyKind, x: number, y = NaN) {
    this.enemies.push({ x, y, kind });
  }
  /** Solid ground from the bottom of the world up to (not including) row `top`. */
  terrain(x0: number, x1: number, top: number) {
    for (let x = x0; x < x1; x++) for (let y = 0; y < top; y++) this.set(x, y, T.GROUND);
  }
  /** Hard-block tower from the bottom of the world; its top is at row `top`. */
  tower(x0: number, x1: number, top: number) {
    for (let x = x0; x <= x1; x++) for (let y = 0; y < top; y++) this.set(x, y, T.STONE);
  }
  /** Rock roof hanging from the top of the world down to row yBottom. */
  hang(x0: number, x1: number, yBottom: number) {
    for (let x = x0; x < Math.min(x1, this.width); x++) for (let y = yBottom; y < HEIGHT; y++) this.set(x, y, T.STONE);
  }
  surface(x: number): number {
    const tx = Math.floor(x);
    for (let y = 1; y < HEIGHT; y++) {
      if (this.tiles[(y - 1) * this.width + tx] !== T.EMPTY && this.tiles[y * this.width + tx] === T.EMPTY) return y;
    }
    return 2;
  }
  /** Solid hard-block column standing on row y0. */
  column(x: number, y0: number, h: number) {
    for (let y = y0; y < y0 + h; y++) this.set(x, y, T.STONE);
  }
  finish(name: string, title: string, theme: Theme): LevelData {
    for (const e of this.enemies) if (Number.isNaN(e.y)) e.y = this.surface(e.x);
    this.set(this.flagX, 2, T.STONE);
    const gaps: [number, number][] = [];
    let start = -1;
    for (let x = 0; x <= this.width; x++) {
      const empty = x < this.width && this.tiles[this.width + x] === T.EMPTY;
      if (empty && start < 0) start = x;
      if (!empty && start >= 0) {
        gaps.push([start, x]);
        start = -1;
      }
    }
    return {
      name,
      title,
      theme,
      width: this.width,
      height: HEIGHT,
      tiles: this.tiles,
      start: { x: 3.5, y: 2 },
      enemies: this.enemies,
      coins: this.coins,
      pipes: this.pipes,
      gaps,
      flagX: this.flagX,
      flagTop: 11.5,
      castleX: this.flagX + 6.5,
    };
  }
}

function grassland(): LevelData {
  const b = new Builder(198);
  b.ground(0, b.width, [
    [69, 71],
    [86, 89],
    [153, 155],
  ]);
  b.set(16, 5, T.QCOIN);
  b.set(20, 5, T.BRICK);
  b.set(21, 5, T.QPOWER);
  b.set(22, 5, T.BRICK);
  b.set(23, 5, T.QCOIN);
  b.set(24, 5, T.BRICK);
  b.set(22, 9, T.QCOIN);
  b.pipe(28, 2);
  b.pipe(38, 3);
  b.pipe(46, 4);
  b.pipe(57, 4);
  b.set(77, 5, T.BRICK);
  b.set(78, 5, T.QPOWER);
  b.set(79, 5, T.BRICK);
  b.row(80, 87, 9, T.BRICK);
  b.row(91, 93, 9, T.BRICK);
  b.set(94, 9, T.QCOIN);
  b.set(94, 5, T.BRICK);
  b.set(100, 5, T.BRICK);
  b.set(101, 5, T.QCOIN);
  b.set(106, 5, T.QCOIN);
  b.set(109, 5, T.QCOIN);
  b.set(109, 9, T.QPOWER);
  b.set(112, 5, T.QCOIN);
  b.set(118, 5, T.BRICK);
  b.row(121, 123, 9, T.BRICK);
  b.set(128, 9, T.BRICK);
  b.set(129, 9, T.QCOIN);
  b.set(130, 9, T.QCOIN);
  b.set(131, 9, T.BRICK);
  b.set(129, 5, T.BRICK);
  b.set(130, 5, T.BRICK);
  b.stairs(134, 4, 1);
  b.stairs(140, 4, -1);
  b.stairs(148, 4, 1, 1);
  b.stairs(155, 4, -1);
  b.pipe(163, 2);
  b.set(168, 5, T.BRICK);
  b.set(169, 5, T.BRICK);
  b.set(170, 5, T.QCOIN);
  b.set(171, 5, T.BRICK);
  b.pipe(179, 2);
  b.stairs(181, 8, 1, 1);

  b.coinRow(12, 14, 4);
  b.coinRow(33, 34, 4);
  b.coinRow(62, 65, 5);
  b.coinRow(86, 88, 6);
  b.coinRow(102, 104, 4);
  b.coinRow(144, 146, 4);
  b.coinRow(172, 175, 4);
  b.coinRow(192, 194, 4);

  for (const x of [22, 41, 51, 53, 114, 115.5, 124, 125.5, 128, 129.5]) b.enemy(x);
  b.mob("creeper", 98);
  b.mob("zombie", 174);
  b.mob("slime", 177);
  b.enemy(81, 10);
  b.enemy(83, 10);
  return b.finish("1-1", "GRASSLAND", "grass");
}

function desert(): LevelData {
  const b = new Builder(182);
  b.ground(0, b.width, [
    [58, 61],
    [96, 99],
    [132, 135],
  ]);
  // Rolling sand dunes
  b.terrain(14, 20, 3);
  b.terrain(16, 18, 4);
  b.coinRow(16, 17, 6);
  b.terrain(25, 34, 3);
  b.terrain(27, 32, 4);
  b.terrain(29, 31, 5);
  b.set(29, 9, T.QCOIN);
  b.set(30, 9, T.QPOWER);
  // Desert temple: a stepped pyramid to climb
  b.terrain(40, 56, 3);
  b.terrain(42, 54, 4);
  b.terrain(44, 52, 5);
  b.terrain(46, 50, 6);
  b.terrain(47, 49, 7);
  b.coinRow(44, 51, 9);
  b.set(48, 11, T.QPOWER);
  b.coinRow(58, 60, 5);
  // Oasis with sandstone wells
  b.column(66, 2, 2);
  b.column(72, 2, 3);
  b.column(78, 2, 2);
  b.coinRow(71, 73, 7);
  b.row(84, 90, 6, T.BRICK);
  b.set(86, 6, T.QCOIN);
  b.set(88, 6, T.QPOWER);
  // Second dune field
  b.terrain(102, 110, 3);
  b.terrain(104, 108, 4);
  b.terrain(114, 124, 3);
  b.terrain(116, 122, 5);
  b.terrain(118, 120, 6);
  b.coinRow(118, 119, 8);
  // Sandstone ruins: floating ledges
  b.platform(138, 142, 5);
  b.platform(146, 150, 7);
  b.platform(154, 158, 5);
  b.set(148, 11, T.QCOIN);
  b.coinRow(146, 150, 9);
  for (const x of [17, 30, 50, 82, 119, 144]) b.mob("zombie", x); // husks
  for (const x of [22, 64, 92, 128, 168]) b.mob("creeper", x);
  for (const x of [36, 45, 75, 106, 160]) b.mob("spider", x);
  return b.finish("1-2", "DESERT DUNES", "desert");
}

function skyIslands(): LevelData {
  const b = new Builder(172);
  b.ground(0, 17);
  b.coinRow(8, 10, 4);
  b.set(12, 5, T.QCOIN);
  b.platform(20, 25, 4);
  b.coinRow(21, 24, 6);
  b.platform(29, 33, 6);
  b.mob("spider", 31, 7);
  b.platform(37, 42, 4);
  b.set(39, 8, T.BRICK);
  b.set(40, 8, T.QPOWER);
  b.set(41, 8, T.BRICK);
  b.platform(46, 49, 7);
  b.platform(53, 62, 3);
  b.mob("spider", 56, 4);
  b.mob("slime", 59, 4);
  b.set(57, 7, T.QCOIN);
  b.set(58, 7, T.QCOIN);
  b.platform(66, 70, 5);
  b.coinRow(66, 70, 7);
  b.platform(74, 78, 8);
  b.mob("skeleton", 76, 9);
  b.platform(82, 93, 4);
  b.row(85, 90, 8, T.BRICK);
  b.set(87, 8, T.QPOWER);
  b.set(88, 8, T.QCOIN);
  b.mob("zombie", 86, 5);
  b.mob("slime", 89, 5);
  b.platform(97, 100, 6);
  b.platform(104, 107, 8);
  b.coinRow(104, 107, 10);
  b.platform(111, 124, 3);
  b.tower(116, 117, 6);
  b.mob("spider", 113, 4);
  b.mob("creeper", 120, 4);
  b.platform(128, 131, 5);
  b.platform(135, 138, 7);
  b.set(136, 11, T.QCOIN);
  b.set(137, 11, T.QPOWER);
  b.platform(142, 145, 5);
  b.platform(149, 152, 3);
  b.ground(156, b.width);
  b.coinRow(157, 160, 4);
  b.mob("zombie", 159);
  return b.finish("1-3", "SKY ISLANDS", "sky");
}

function netherFortress(): LevelData {
  const b = new Builder(156);
  b.ground(0, 14);
  b.set(9, 5, T.QCOIN);
  // Lava lake crossed on netherrack pillars
  b.terrain(17, 19, 3);
  b.terrain(22, 24, 4);
  b.terrain(27, 29, 5);
  b.terrain(32, 35, 6);
  b.coinRow(22, 23, 7);
  b.coinRow(27, 28, 8);
  b.set(33, 10, T.QPOWER);
  // Nether fortress bridge high above the lava, with a broken span
  b.row(38, 70, 6, T.STONE);
  for (const x of [42, 50, 62, 70]) b.column(x, 0, 6);
  for (const x of [54, 55, 56]) b.set(x, 6, T.EMPTY);
  b.row(46, 48, 10, T.BRICK);
  b.set(47, 10, T.QCOIN);
  b.coinRow(54, 56, 9);
  b.mob("skeleton", 45, 7);
  b.mob("spider", 52, 7);
  b.mob("skeleton", 60, 7);
  b.mob("slime", 66, 7);
  // Fortress hall with a low roof
  b.ground(71, 100);
  b.hang(74, 98, 9);
  b.set(80, 5, T.BRICK);
  b.set(81, 5, T.QPOWER);
  b.set(82, 5, T.BRICK);
  b.tower(86, 88, 4);
  b.set(91, 5, T.QCOIN);
  b.set(93, 5, T.QCOIN);
  b.mob("skeleton", 78);
  b.mob("spider", 84);
  b.mob("slime", 90);
  b.mob("zombie", 95);
  // Lava crossing on floating netherrack
  b.platform(103, 106, 3);
  b.platform(110, 113, 5);
  b.platform(117, 120, 4);
  b.platform(124, 127, 3);
  b.coinRow(110, 113, 7);
  b.mob("slime", 111, 6);
  b.mob("spider", 118, 5);
  // Final stretch
  b.ground(130, b.width);
  b.tower(136, 138, 4);
  b.set(137, 8, T.QCOIN);
  b.mob("skeleton", 142);
  b.mob("slime", 146);
  return b.finish("1-4", "NETHER FORTRESS", "nether");
}

function mineshaft(): LevelData {
  const b = new Builder(176);
  b.ground(0, b.width, [
    [38, 42],
    [104, 107],
    [118, 121],
  ]);
  // Entrance tunnel
  b.hang(0, 30, 9);
  b.set(12, 5, T.QCOIN);
  b.set(16, 5, T.QPOWER);
  b.mob("spider", 20);
  b.mob("zombie", 26);
  // Big cavern with a ravine and a rocky ledge
  b.hang(30, 60, 14);
  b.terrain(32, 37, 3);
  b.column(40, 0, 3);
  b.terrain(44, 52, 5);
  b.terrain(46, 50, 7);
  b.coinRow(46, 49, 9);
  b.set(48, 11, T.QPOWER);
  b.mob("creeper", 34);
  b.mob("skeleton", 48);
  b.mob("spider", 56);
  // Low tunnel with blocks set into the roof
  b.hang(60, 100, 7);
  b.set(68, 7, T.QCOIN);
  b.set(76, 7, T.QPOWER);
  b.set(84, 7, T.QCOIN);
  b.set(92, 7, T.QCOIN);
  b.coinRow(70, 74, 4);
  b.coinRow(86, 90, 4);
  b.mob("spider", 66);
  b.mob("zombie", 72);
  b.mob("spider", 80);
  b.mob("creeper", 88);
  b.mob("spider", 96);
  // Flooded cavern with a stone shelf
  b.hang(100, 130, 12);
  b.platform(110, 114, 6);
  b.set(112, 10, T.QCOIN);
  b.mob("skeleton", 112, 7);
  b.mob("slime", 125);
  // Ore staircase up and down
  b.hang(130, 150, 11);
  b.terrain(132, 148, 3);
  b.terrain(134, 146, 4);
  b.terrain(136, 144, 5);
  b.terrain(138, 142, 6);
  b.coinRow(138, 141, 8);
  b.mob("zombie", 140);
  b.mob("spider", 145);
  // Exit cavern with a high roof
  b.hang(150, b.width, 14);
  b.mob("creeper", 158);
  b.mob("skeleton", 165);
  return b.finish("2-1", "MINESHAFT", "cave");
}

function taiga(): LevelData {
  const b = new Builder(186);
  b.ground(0, b.width, [
    [40, 44],
    [84, 87],
    [93, 96],
    [118, 122],
    [150, 153],
  ]);
  // Climb the snowy mountain
  b.terrain(12, 40, 3);
  b.terrain(18, 40, 5);
  b.terrain(24, 40, 7);
  b.terrain(30, 40, 9);
  b.coinRow(31, 37, 11);
  b.set(33, 13, T.QCOIN);
  b.set(35, 13, T.QPOWER);
  // Over the ravine and back down
  b.terrain(44, 52, 9);
  b.terrain(52, 58, 7);
  b.terrain(58, 66, 5);
  b.terrain(66, 74, 3);
  b.coinRow(40, 43, 12);
  // Frozen lake with ice holes
  b.row(78, 82, 6, T.BRICK);
  b.set(80, 6, T.QCOIN);
  b.coinRow(84, 86, 5);
  b.coinRow(93, 95, 5);
  // Second hill split by a gorge
  b.terrain(100, 118, 4);
  b.terrain(106, 118, 6);
  b.terrain(122, 136, 4);
  b.terrain(122, 130, 6);
  b.set(127, 10, T.QPOWER);
  b.coinRow(118, 121, 9);
  // Valley to the flag
  b.row(156, 160, 5, T.BRICK);
  b.set(158, 5, T.QCOIN);
  b.mob("spider", 14);
  b.mob("slime", 22);
  b.mob("zombie", 28);
  b.mob("creeper", 36);
  b.mob("skeleton", 48);
  b.mob("zombie", 56);
  b.mob("spider", 62);
  b.mob("slime", 70);
  b.mob("zombie", 80);
  b.mob("spider", 90);
  b.mob("creeper", 98);
  b.mob("skeleton", 110);
  b.mob("slime", 126);
  b.mob("zombie", 132);
  b.mob("creeper", 145);
  b.mob("spider", 162);
  b.mob("skeleton", 170);
  return b.finish("2-2", "SNOWY TAIGA", "snow");
}

function theEnd(): LevelData {
  const b = new Builder(176);
  b.ground(0, 14);
  b.coinRow(8, 10, 4);
  b.set(11, 5, T.QPOWER);
  // Obsidian towers over the void
  b.tower(17, 19, 4);
  b.tower(22, 24, 6);
  b.tower(27, 29, 8);
  b.tower(32, 34, 6);
  b.tower(37, 39, 9);
  b.tower(42, 44, 7);
  b.tower(47, 51, 5);
  b.tower(54, 57, 3);
  b.coinRow(27, 28, 10);
  b.set(38, 13, T.QCOIN);
  b.mob("spider", 23);
  b.mob("slime", 49);
  // Main End island
  b.ground(60, 90);
  b.terrain(68, 76, 4);
  b.terrain(70, 74, 5);
  b.tower(80, 81, 5);
  b.row(63, 66, 6, T.BRICK);
  b.set(65, 6, T.QPOWER);
  b.mob("creeper", 64);
  b.mob("zombie", 72);
  b.mob("skeleton", 85);
  // Floating end stone stairs
  b.platform(93, 96, 3);
  b.platform(99, 102, 5);
  b.platform(105, 108, 7);
  b.platform(111, 114, 5);
  b.platform(117, 120, 3);
  b.set(106, 12, T.QPOWER);
  b.coinRow(105, 108, 9);
  b.mob("slime", 100, 6);
  b.mob("spider", 112, 6);
  // Final island
  b.ground(123, b.width);
  b.tower(130, 132, 4);
  b.tower(136, 138, 6);
  b.tower(142, 144, 4);
  b.coinRow(136, 137, 8);
  b.mob("zombie", 134);
  b.mob("creeper", 148);
  b.mob("skeleton", 156);
  b.mob("spider", 162);
  return b.finish("2-3", "THE END", "end");
}

export const LEVELS: (() => LevelData)[] = [grassland, desert, skyIslands, netherFortress, mineshaft, taiga, theEnd];

export function buildLevel(index = 0): LevelData {
  const make = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, index))]!;
  return make();
}
