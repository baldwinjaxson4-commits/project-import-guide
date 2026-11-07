import { describe, expect, it } from "vitest";
import { collectPower, createWorld, flagBonus, gotoLevel, powerFor, startGame, stepWorld, type Input } from "./world";
import { LEVELS } from "./level";
import * as C from "./constants";
import { T } from "./level";

const idle: Input = { left: false, right: false, jump: false, run: false };

function sim(w: ReturnType<typeof createWorld>, input: Input, seconds: number) {
  for (let t = 0; t < seconds; t += 1 / 60) stepWorld(w, input, 1 / 60);
}

describe("platformer sim", () => {
  it("player stands on the ground at the start", () => {
    const w = createWorld();
    startGame(w);
    sim(w, idle, 1);
    expect(w.player.y).toBeCloseTo(2, 3);
    expect(w.player.onGround).toBe(true);
  });

  it("a full jump clears 4 blocks (tallest pipe)", () => {
    const w = createWorld();
    startGame(w);
    sim(w, idle, 0.2);
    let peak = 0;
    for (let t = 0; t < 1.2; t += 1 / 60) {
      stepWorld(w, { ...idle, jump: true }, 1 / 60);
      peak = Math.max(peak, w.player.y);
    }
    expect(peak - 2).toBeGreaterThan(4);
  });

  it("bumping a ? block from below gives a coin and empties it", () => {
    const w = createWorld();
    startGame(w);
    w.player.x = 16.5;
    sim(w, idle, 0.1);
    sim(w, { ...idle, jump: true }, 0.6);
    expect(w.tiles[5 * w.level.width + 16]).toBe(T.USED);
    expect(w.coinCount).toBe(1);
  });

  it("stomping an enemy squashes it and bounces the player", () => {
    const w = createWorld();
    startGame(w);
    const e = w.enemies[0]!;
    e.state = "walk";
    e.vx = 0;
    w.player.x = e.x;
    w.player.y = e.y + 0.8;
    w.player.vy = -5;
    stepWorld(w, idle, 1 / 30);
    expect(e.state).toBe("squashed");
    expect(w.player.vy).toBeGreaterThan(0);
  });

  it("touching an enemy from the side while small loses a life", () => {
    const w = createWorld();
    startGame(w);
    const e = w.enemies[0]!;
    e.state = "walk";
    w.player.x = e.x - 0.5;
    stepWorld(w, idle, 1 / 60);
    expect(w.status).toBe("dying");
    sim(w, idle, 3.2);
    expect(w.lives).toBe(2);
    expect(w.status).toBe("playing");
  });

  it("reaching the flagpole moves on to the next world", () => {
    const w = createWorld();
    startGame(w);
    w.enemies.forEach((e) => (e.state = "dead"));
    w.player.x = 192;
    sim(w, { ...idle, right: true }, 2);
    expect(w.status).toBe("flag");
    sim(w, idle, 6);
    expect(w.status).toBe("clear");
    sim(w, idle, C.LEVEL_CLEAR_TIME + 0.1);
    expect(w.status).toBe("playing");
    expect(w.level.name).toBe("1-2");
  });

  it("clearing the last world wins the game", () => {
    const w = createWorld();
    startGame(w);
    gotoLevel(w, LEVELS.length - 1);
    expect(w.level.title).toBe("THE END");
    w.enemies.forEach((e) => (e.state = "dead"));
    w.player.x = w.level.flagX - 4;
    w.player.y = 11;
    sim(w, { ...idle, right: true }, 2);
    sim(w, idle, 8);
    expect(w.status).toBe("won");
  });

  it("there are 7 worlds and every world has Minecraft mobs", () => {
    expect(LEVELS.length).toBe(7);
    const w = createWorld();
    for (let i = 0; i < LEVELS.length; i++) {
      gotoLevel(w, i);
      expect(w.enemies.some((e) => e.kind !== "mushling")).toBe(true);
    }
  });

  function mob(w: ReturnType<typeof createWorld>, kind: string) {
    for (let i = 0; i < LEVELS.length; i++) {
      gotoLevel(w, i);
      const e = w.enemies.find((m) => m.kind === kind);
      if (e) {
        w.enemies.forEach((o) => o !== e && (o.state = "dead"));
        return e;
      }
    }
    throw new Error(kind);
  }

  it("a creeper explodes after its fuse and hurts a nearby player", () => {
    const w = createWorld();
    startGame(w);
    const e = mob(w, "creeper");
    w.player.x = e.x - 1.5;
    w.player.y = e.y;
    e.state = "walk";
    stepWorld(w, idle, 1 / 60);
    expect(e.state).toBe("fuse");
    sim(w, idle, C.CREEPER_FUSE + 0.1);
    expect(e.state).toBe("dead");
    expect(w.status).toBe("dying");
  });

  it("a zombie takes two stomps", () => {
    const w = createWorld();
    startGame(w);
    const e = mob(w, "zombie");
    e.state = "walk";
    const stompOnce = () => {
      e.cooldown = 0;
      w.player.x = e.x;
      w.player.y = e.y + e.h * 0.9;
      w.player.vy = -5;
      stepWorld(w, idle, 1 / 60);
    };
    stompOnce();
    expect(e.state).toBe("walk");
    expect(e.hp).toBe(1);
    stompOnce();
    expect(e.state).toBe("squashed");
  });

  it("stomping a big slime splits it into two small slimes", () => {
    const w = createWorld();
    startGame(w);
    const e = mob(w, "slime");
    e.state = "walk";
    w.player.x = e.x;
    w.player.y = e.y + e.h * 0.9;
    w.player.vy = -5;
    stepWorld(w, idle, 1 / 60);
    expect(e.state).toBe("dead");
    const kids = e.children.map((i) => w.enemies[i]!);
    expect(kids.map((k) => k.state)).toEqual(["walk", "walk"]);
    expect(kids.every((k) => k.size === 1)).toBe(true);
  });

  it("a skeleton shoots arrows at the player", () => {
    const w = createWorld();
    startGame(w);
    const e = mob(w, "skeleton");
    e.state = "walk";
    e.cooldown = 0;
    w.player.x = e.x - 6;
    stepWorld(w, idle, 1 / 60);
    expect(w.projectiles.some((p) => p.kind === "arrow" && p.vx < 0)).toBe(true);
  });

  it("small players get a Golden Apple; big players get special power-ups", () => {
    const w = createWorld();
    expect(powerFor(w, 21, 5)).toBe("apple");
    w.player.big = true;
    expect(["fire", "armor", "totem"]).toContain(powerFor(w, 21, 5));
  });

  it("Diamond Armor makes the player invincible and defeats mobs on touch", () => {
    const w = createWorld();
    startGame(w);
    collectPower(w, "armor");
    expect(w.player.armor).toBe(C.ARMOR_TIME);
    const e = w.enemies[0]!;
    e.state = "walk";
    w.player.x = e.x - 0.5;
    stepWorld(w, idle, 1 / 60);
    expect(w.status).toBe("playing");
    expect(e.state).toBe("flipped");
  });

  it("Totem of Undying gives an extra life", () => {
    const w = createWorld();
    collectPower(w, "totem");
    expect(w.lives).toBe(C.START_LIVES + 1);
  });

  it("Fire Charge lets the player throw a fireball with the run button", () => {
    const w = createWorld();
    startGame(w);
    collectPower(w, "fire");
    sim(w, idle, 0.1);
    stepWorld(w, { ...idle, run: true }, 1 / 60);
    expect(w.projectiles.filter((p) => p.kind === "fireball").length).toBe(1);
  });

  it("flag bonus is highest at the top of the pole", () => {
    expect(flagBonus(8.5)).toBe(5000);
    expect(flagBonus(0.5)).toBe(100);
  });
});
