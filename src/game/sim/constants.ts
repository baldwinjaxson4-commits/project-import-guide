// Feel constants for the platformer. Units: tiles (1 tile = 1 block) and seconds.

export const GRAVITY_UP = 32; // rising while jump is held
export const GRAVITY_CUT = 85; // rising after jump released (short hop)
export const GRAVITY_DOWN = 60; // falling
export const MAX_FALL = 22;

export const JUMP_VELOCITY = 16.5;
export const JUMP_RUN_BONUS = 0.22; // extra jump velocity per unit of horizontal speed
export const STOMP_BOUNCE = 10;
export const STOMP_BOUNCE_HELD = 14;

export const WALK_SPEED = 6;
export const RUN_SPEED = 9.5;
export const GROUND_ACCEL = 28;
export const AIR_ACCEL = 18;
export const SKID_ACCEL = 48;
export const GROUND_DRAG = 11;
export const AIR_DRAG = 0.6;

export const COYOTE_TIME = 0.1;
export const JUMP_BUFFER = 0.12;

export const PLAYER_W = 0.72;
export const SMALL_H = 0.95;
export const BIG_H = 1.85;
export const INVULN_TIME = 2;

export const ENEMY_SPEED = 2;
export const ENEMY_W = 0.85;
export const ENEMY_H = 0.85;
export const ENEMY_WAKE_DISTANCE = 15;
export const POWERUP_SPEED = 3.5;

export const LEVEL_TIME = 300;
export const TIME_SCALE = 2.5; // timer units per real second
export const DEATH_TIME = 3;
export const START_LIVES = 3;

export const MAX_SUBSTEP = 1 / 120;
export const PIT_Y = -4;

// Minecraft mobs
export const CREEPER_SPEED = 1.6;
export const CREEPER_TRIGGER = 2.4; // starts hissing when the player is this close
export const CREEPER_CANCEL = 4.5; // stops hissing when the player gets this far away
export const CREEPER_FUSE = 1.3;
export const EXPLOSION_RADIUS = 2.6;
export const ZOMBIE_SPEED = 1.5;
export const ZOMBIE_HP = 2;
export const ZOMBIE_STUN = 0.6;
export const SKELETON_SPEED = 0.9;
export const SKELETON_RANGE = 13;
export const SKELETON_RELOAD = 2.4;
export const ARROW_SPEED = 9;
export const SLIME_HOP_VY = 10;
export const SLIME_HOP_VX = 2.6;
export const SLIME_HOP_DELAY = 0.9;

// Power-ups
export const ARMOR_TIME = 10;
export const FIREBALL_SPEED = 12;
export const FIREBALL_BOUNCE = 7;
export const MAX_FIREBALLS = 2;
export const LEVEL_CLEAR_TIME = 3;
export const SWORD_REACH = 1.8; // tiles in front of the player
export const SWORD_SWING_TIME = 0.25;
export const SWORD_COOLDOWN = 0.35;
