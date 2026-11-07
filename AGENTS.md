<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Game architecture
- Game rules live in `src/game/sim/` as plain TypeScript (no React/three imports) with vitest tests in `world.test.ts`; the scene only draws sim state, so physics can be tested without a GPU.
- One stepper `useFrame` in `src/game/Game.tsx` advances input → sim → sounds → camera → HUD; per-frame state stays in the shared `getGame()` object, and only HUD values go to the zustand store (avoids 60 re-renders/s).
- Feel values (gravity, jump, speeds) are named constants in `src/game/sim/constants.ts`; tune there, not inline.
- Dev-only `window.__game` exposes `world`, `start()` and `sim(seconds, input)` for scripted checks in the slow sandbox browser.
- Block textures are generated 16x16 canvas pixel art in `src/game/scene/textures.ts` (no image files to load).
- Levels live in `LEVELS` (`src/game/sim/level.ts`); each has a `theme` whose blocks, sky and decor come from `src/game/scene/themes.ts`. Clearing a level goes to status "clear" then the next level; level-shaped meshes remount via a `key={levelIndex}` group in `Game.tsx`.
- Mob kinds (mushling/creeper/zombie/skeleton/slime) share one `Enemy` type; big slimes pre-allocate their two split children at level reset so the mob count never changes at runtime. Dev: `window.__game.goto(i)` jumps to a level.
