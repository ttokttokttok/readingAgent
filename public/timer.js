/* timer.js — pure TimerModule logic, importable by both client.src.js and tests */

/**
 * formatCountdown(totalSeconds) → "MM:SS"
 * Pure function — no side effects.
 */
function formatCountdown(totalSeconds) {
  const mm = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const ss = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * createTimerModule(options)
 * Factory so tests can create isolated instances.
 * options.onTick(remainingSeconds)  — called each second
 * options.onEnd()                   — called when remainingSeconds reaches 0
 */
function createTimerModule(options) {
  const { onTick = () => {}, onEnd = () => {} } = options || {};

  const state = {
    sessionDuration: 25 * 60,
    remainingSeconds: 25 * 60,
    timerState: "idle",       // 'idle' | 'running' | 'paused'
    intervalHandle: null,
  };

  function _tick() {
    state.remainingSeconds -= 1;
    onTick(state.remainingSeconds);
    if (state.remainingSeconds <= 0) {
      state.remainingSeconds = 0;
      clearInterval(state.intervalHandle);
      state.intervalHandle = null;
      state.timerState = "idle";
      onEnd();
    }
  }

  return {
    setDuration(minutes) {
      const m = Number(minutes);
      if (!Number.isInteger(m) || m < 1 || m > 180) {
        return { ok: false, error: "Duration must be an integer between 1 and 180 minutes." };
      }
      state.sessionDuration = m * 60;
      state.remainingSeconds = m * 60;
      return { ok: true };
    },

    start() {
      if (state.timerState === "running") return;
      state.timerState = "running";
      state.intervalHandle = setInterval(_tick, 1000);
    },

    pause() {
      if (state.intervalHandle !== null) {
        clearInterval(state.intervalHandle);
        state.intervalHandle = null;
      }
      state.timerState = "paused";
    },

    resume() {
      if (state.timerState !== "paused") return;
      state.timerState = "running";
      state.intervalHandle = setInterval(_tick, 1000);
    },

    reset() {
      if (state.intervalHandle !== null) {
        clearInterval(state.intervalHandle);
        state.intervalHandle = null;
      }
      state.remainingSeconds = state.sessionDuration;
      state.timerState = "idle";
    },

    getState() {
      return { ...state };
    },

    _setState(patch) {
      if ("intervalHandle" in patch && state.intervalHandle !== null) {
        clearInterval(state.intervalHandle);
      }
      Object.assign(state, patch);
    },

    // Expose tick for test helpers (fires the interval callback once synchronously)
    _tick,
  };
}

module.exports = { formatCountdown, createTimerModule };
