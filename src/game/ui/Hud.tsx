import type { ReactNode } from "react";
import { beginOrRestart, getGame, useHud } from "../game";
import { setMuted, unlockAudio } from "../audio";
import type { Input } from "../sim/world";

const pad = (n: number, len: number) => String(Math.max(0, n)).padStart(len, "0");

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="hud-label">{label}</span>
      <span className="hud-value">{value}</span>
    </div>
  );
}

function TouchButton({ k, children, wide }: { k: keyof Input; children: ReactNode; wide?: boolean }) {
  const set = (v: boolean) => () => {
    unlockAudio();
    getGame().touch[k] = v;
    if (v && k === "jump") {
      const s = getGame().world.status;
      if (s === "title" || s === "gameover" || s === "won") beginOrRestart();
    }
  };
  return (
    <button
      type="button"
      aria-label={k}
      className={wide ? "touch-btn touch-btn-wide" : "touch-btn"}
      onPointerDown={set(true)}
      onPointerUp={set(false)}
      onPointerLeave={set(false)}
      onPointerCancel={set(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

export function Hud() {
  const { score, coins, lives, time, status, muted, worldName, worldTitle, power } = useHud();

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <div className="hud-bar">
        <Stat label="SCORE" value={pad(score, 6)} />
        <Stat
          label="COINS"
          value={
            <span className="flex items-center gap-2">
              <span className="coin-icon" aria-hidden />×{pad(coins, 2)}
            </span>
          }
        />
        <Stat label="WORLD" value={worldName} />
        <Stat label="TIME" value={pad(time, 3)} />
        <Stat label="LIVES" value={`♥×${lives}`} />
        {power && <Stat label="POWER" value={power} />}
        <button
          type="button"
          className="pointer-events-auto hud-chip"
          onClick={() => {
            unlockAudio();
            setMuted(!muted);
            useHud.setState({ muted: !muted });
          }}
        >
          {muted ? "SOUND OFF" : "SOUND ON"}
        </button>
      </div>

      {status === "title" && (
        <Overlay>
          <h1 className="title-logo">
            SUPER <span className="title-accent">BLOCK</span> BROS
          </h1>
          <p className="overlay-text">Play as Steve · 7 worlds of Minecraft mobs</p>
          <button type="button" className="pixel-btn pointer-events-auto" onClick={beginOrRestart}>
            START
          </button>
          <ul className="controls-list">
            <li>ARROWS / A D &nbsp; move</li>
            <li>SPACE / W / Z &nbsp; jump</li>
            <li>SHIFT / X &nbsp; run / swing sword / throw fire</li>
            <li>ENTER &nbsp; start</li>
          </ul>
        </Overlay>
      )}
      {status === "clear" && (
        <Overlay>
          <h2 className="title-logo">
            {worldName} <span className="title-accent">CLEAR!</span>
          </h2>
          <p className="overlay-text">{worldTitle} done · next world coming up</p>
        </Overlay>
      )}
      {status === "gameover" && (
        <Overlay>
          <h2 className="title-logo">GAME OVER</h2>
          <p className="overlay-text">Score {pad(score, 6)}</p>
          <button type="button" className="pixel-btn pointer-events-auto" onClick={beginOrRestart}>
            TRY AGAIN
          </button>
        </Overlay>
      )}
      {status === "won" && (
        <Overlay>
          <h2 className="title-logo">
            COURSE <span className="title-accent">CLEAR!</span>
          </h2>
          <p className="overlay-text">Final score {pad(score, 6)}</p>
          <button type="button" className="pixel-btn pointer-events-auto" onClick={beginOrRestart}>
            PLAY AGAIN
          </button>
        </Overlay>
      )}

      <div className="touch-controls">
        <div className="flex gap-3">
          <TouchButton k="left">◀</TouchButton>
          <TouchButton k="right">▶</TouchButton>
        </div>
        <div className="flex gap-3">
          <TouchButton k="run">B</TouchButton>
          <TouchButton k="jump" wide>
            A
          </TouchButton>
        </div>
      </div>
    </div>
  );
}

function Overlay({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="pixel-panel flex flex-col items-center gap-5 text-center">{children}</div>
    </div>
  );
}
