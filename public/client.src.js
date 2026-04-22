/* Voice Definition Agent — browser session lifecycle */
import { Conversation } from "@elevenlabs/client";
import { formatCountdown, createTimerModule } from "./timer.js";

/* ─────────────────────────────────────────────────────────────
   Task 3.1 — renderCountdown
   ───────────────────────────────────────────────────────────── */
function renderCountdown(s) {
  const formatted = formatCountdown(s);
  const display = document.getElementById("timer-display");
  if (display) display.innerHTML = formatted;
  document.title = `${formatted} — Reading Timer`;
}

/* ─────────────────────────────────────────────────────────────
   Task 4.1 — onTimerEnd
   ───────────────────────────────────────────────────────────── */
function onTimerEnd() {
  // 1. Show end banner
  const banner = document.getElementById("timer-end-banner");
  if (banner) banner.removeAttribute("hidden");

  // 2. Play chime via Web Audio API (880 Hz sine, 0.6 s fade-out)
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (_) {
    // Web Audio not available — degrade gracefully
  }

  // 3. Browser push notification
  try {
    if (typeof Notification !== "undefined") {
      if (Notification.permission === "granted") {
        new Notification("Session complete!");
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") new Notification("Session complete!");
        });
      }
    }
  } catch (_) {
    // Notifications not supported — degrade gracefully
  }

  // 4. Fade out music if MusicModule exists
  if (typeof MusicModule !== "undefined" && MusicModule && typeof MusicModule.fadeOutAndPause === "function") {
    MusicModule.fadeOutAndPause(5000);
  }

  // 5. Update button states (same as reset)
  _updateTimerButtons();
}

/* ─────────────────────────────────────────────────────────────
   Task 2.1 — TimerModule (browser singleton, backed by timer.js)
   ───────────────────────────────────────────────────────────── */
export const TimerModule = createTimerModule({
  onTick: (remaining) => renderCountdown(remaining),
  onEnd: () => onTimerEnd(),
});

/* ─────────────────────────────────────────────────────────────
   Task 3.5 — Button state helper
   ───────────────────────────────────────────────────────────── */
function _showTimerSection() {
  const section = document.getElementById("timer-section");
  if (section) {
    section.removeAttribute("style");
    section.style.setProperty("display", "block", "important");
  }
}

function _updateTimerButtons() {
  const startBtn = document.getElementById("timer-start");
  const pauseBtn = document.getElementById("timer-pause");
  const resetBtn = document.getElementById("timer-reset");
  if (!startBtn) return;

  const state = TimerModule.getState().timerState;
  if (state === "running") {
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    pauseBtn.textContent = "Pause";
    resetBtn.disabled = false;
  } else if (state === "paused") {
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    pauseBtn.textContent = "Resume";
    resetBtn.disabled = false;
  } else {
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = "Pause";
    resetBtn.disabled = true;
  }
}

/* ─────────────────────────────────────────────────────────────
   DOM wiring — runs after DOMContentLoaded
   ───────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  /* ── Task 3.4: Preset buttons ── */
  const presetBtns = document.querySelectorAll(".preset-buttons [data-minutes]");
  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const minutes = parseInt(btn.dataset.minutes, 10);
      const result = TimerModule.setDuration(minutes);
      if (result.ok) {
        _showTimerSection();
        renderCountdown(TimerModule.getState().remainingSeconds);
        localStorage.setItem("timerDuration", minutes);
        presetBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const customError = document.getElementById("custom-error");
        if (customError) { customError.textContent = ""; customError.hidden = true; }
      }
    });
  });

  /* ── Task 3.4: Custom duration input ── */
  const customInput = document.getElementById("custom-minutes");
  const customError = document.getElementById("custom-error");

  function applyCustomDuration() {
    if (!customInput) return;
    const val = customInput.value.trim();
    const result = TimerModule.setDuration(val === "" ? NaN : Number(val));
    if (result.ok) {
      _showTimerSection();
      renderCountdown(TimerModule.getState().remainingSeconds);
      localStorage.setItem("timerDuration", val);
      if (customError) { customError.textContent = ""; customError.hidden = false; }
      presetBtns.forEach((b) => b.classList.remove("active"));
    } else {
      if (customError) { customError.textContent = result.error; customError.hidden = false; }
    }
  }

  if (customInput) {
    customInput.addEventListener("change", applyCustomDuration);
    customInput.addEventListener("keydown", (e) => { if (e.key === "Enter") applyCustomDuration(); });
  }

  /* ── Task 3.4: Restore last duration from localStorage ── */
  const saved = localStorage.getItem("timerDuration");
  if (saved) {
    const minutes = parseInt(saved, 10);
    if (!isNaN(minutes)) {
      TimerModule.setDuration(minutes);
      // Don't show timer section on restore — wait for user to set it explicitly
      presetBtns.forEach((b) => {
        if (parseInt(b.dataset.minutes, 10) === minutes) b.classList.add("active");
      });
    }
  }

  /* ── Task 3.5: Start / Pause / Reset buttons ── */
  const startBtn = document.getElementById("timer-start");
  const pauseBtn = document.getElementById("timer-pause");
  const resetBtn = document.getElementById("timer-reset");

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      TimerModule.start();
      _updateTimerButtons();
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      const s = TimerModule.getState().timerState;
      if (s === "running") TimerModule.pause();
      else if (s === "paused") TimerModule.resume();
      _updateTimerButtons();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      TimerModule.reset();
      renderCountdown(TimerModule.getState().remainingSeconds);
      const banner = document.getElementById("timer-end-banner");
      if (banner) banner.setAttribute("hidden", "");
      _updateTimerButtons();
    });
  }

  _updateTimerButtons();
});

/* ─────────────────────────────────────────────────────────────
   MusicModule — YouTube IFrame player, volume, duck/unduck
   ───────────────────────────────────────────────────────────── */

// Internal state
const musicState = {
  ytPlayer: null,
  currentVolume: 50,
  isMuted: false,
  isDucked: false,
  preduckedVolume: 50,
  apiReady: false,
  apiError: false,
};

/* Task 6.1 — YouTube IFrame API init */
window.onYouTubeIframeAPIReady = function () {
  try {
    musicState.ytPlayer = new YT.Player("yt-player", {
      height: "100%",
      width: "100%",
      playerVars: { autoplay: 0 },
    });
    musicState.apiReady = true;
  } catch (err) {
    const ytError = document.getElementById("yt-error");
    if (ytError) ytError.removeAttribute("hidden");
    musicState.apiError = true;
  }
};

export const MusicModule = {
  /* ── Task 7.1 — search ── */
  async search(query, { autoplay = false } = {}) {
    const searchError = document.getElementById("search-error");
    if (!query || !query.trim()) {
      if (searchError) { searchError.textContent = "Please enter a search term."; searchError.removeAttribute("hidden"); }
      return;
    }
    if (searchError) { searchError.textContent = ""; searchError.setAttribute("hidden", ""); }

    const container = document.getElementById("yt-player-container");
    if (!container) return;

    // Show loading state
    const musicSection = document.getElementById("music-section");
    if (musicSection) musicSection.style.display = "block";
    container.style.display = "block";
    container.innerHTML = `<div style="padding:1rem;color:#8a7060;font-size:0.9rem;">Searching...</div>`;

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.results) {
        container.innerHTML = `<div style="padding:1rem;color:#b05c5c;font-size:0.85rem;">${data.error || "Search failed."}</div>`;
        return;
      }

      if (data.results.length === 0) {
        container.innerHTML = `<div style="padding:1rem;color:#8a7060;font-size:0.85rem;">No results found.</div>`;
        return;
      }

      // If voice-triggered, auto-play the first result
      if (autoplay) {
        const videoId = data.results[0].videoId;
        container.innerHTML = `
          <div id="yt-player" style="width:100%;aspect-ratio:16/9;">
            <iframe
              src="https://www.youtube.com/embed/${videoId}?autoplay=1"
              width="100%" height="100%"
              style="border:0;border-radius:0.4rem;"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>`;
        const controls = document.getElementById("music-controls");
        if (controls) controls.style.display = "flex";
        return;
      }

      // Manual search — show results list
      container.innerHTML = `
        <div id="yt-results" style="display:flex;flex-direction:column;gap:0.5rem;max-height:280px;overflow-y:auto;">
          ${data.results.map((v) => `
            <button class="yt-result-item" data-video-id="${v.videoId}" style="
              display:flex;align-items:center;gap:0.6rem;padding:0.5rem;
              background:#faf8f5;border:1px solid #e0d8d0;border-radius:0.4rem;
              cursor:pointer;text-align:left;font-family:inherit;width:100%;
            ">
              ${v.thumbnail ? `<img src="${v.thumbnail}" style="width:60px;height:45px;object-fit:cover;border-radius:0.25rem;flex-shrink:0;" />` : ""}
              <div style="overflow:hidden;">
                <div style="font-size:0.82rem;color:#3a3228;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${v.title}</div>
                <div style="font-size:0.75rem;color:#8a7060;">${v.channel}</div>
              </div>
            </button>
          `).join("")}
        </div>
        <div id="yt-player" style="display:none;width:100%;aspect-ratio:16/9;margin-top:0.5rem;"></div>
      `;

      // Wire result clicks to embed the video
      container.querySelectorAll(".yt-result-item").forEach((btn) => {
        btn.addEventListener("click", () => {
          const videoId = btn.dataset.videoId;
          document.getElementById("yt-results").style.display = "none";
          const playerDiv = document.getElementById("yt-player");
          playerDiv.style.display = "block";
          playerDiv.innerHTML = `<iframe
            src="https://www.youtube.com/embed/${videoId}?autoplay=1"
            width="100%" height="100%"
            style="border:0;border-radius:0.4rem;"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>`;
          const controls = document.getElementById("music-controls");
          if (controls) controls.style.display = "flex";
        });
      });

    } catch (err) {
      container.innerHTML = `<div style="padding:1rem;color:#b05c5c;font-size:0.85rem;">Search failed. Please try again.</div>`;
    }
  },

  /* ── Task 7.4 — setVolume ── */
  setVolume(v) {
    const clamped = Math.max(0, Math.min(100, v));
    musicState.currentVolume = clamped;
    if (!musicState.ytPlayer) return;
    if (!musicState.isDucked) {
      musicState.ytPlayer.setVolume(clamped);
    }
    const slider = document.getElementById("volume-slider");
    if (slider) slider.value = clamped;
  },

  /* ── Task 7.4 — toggleMute ── */
  toggleMute() {
    if (!musicState.ytPlayer) return;
    musicState.isMuted = !musicState.isMuted;
    if (musicState.isMuted) {
      musicState.ytPlayer.setVolume(0);
    } else {
      musicState.ytPlayer.setVolume(musicState.currentVolume);
    }
    const muteBtn = document.getElementById("mute-btn");
    if (muteBtn) muteBtn.textContent = musicState.isMuted ? "Unmute" : "Mute";
  },

  /* ── Task 7.4 — stop ── */
  stop() {
    if (!musicState.ytPlayer) return;
    musicState.ytPlayer.pauseVideo();
    musicState.ytPlayer.seekTo(0, true);
  },

  /* ── Task 8.1 — duck ── */
  duck() {
    if (!musicState.ytPlayer) return;
    // No-op if not playing (getPlayerState() === 1 means playing)
    if (typeof musicState.ytPlayer.getPlayerState === "function" &&
        musicState.ytPlayer.getPlayerState() !== 1) return;
    musicState.preduckedVolume = musicState.currentVolume;
    musicState.ytPlayer.setVolume(Math.round(musicState.currentVolume * 0.5));
    musicState.isDucked = true;
  },

  /* ── Task 8.1 — unduck ── */
  unduck() {
    if (!musicState.ytPlayer) return;
    musicState.ytPlayer.setVolume(musicState.preduckedVolume);
    musicState.isDucked = false;
  },

  /* ── Task 8.1 — fadeOutAndPause ── */
  fadeOutAndPause(ms) {
    if (!musicState.ytPlayer) return;
    if (typeof musicState.ytPlayer.getPlayerState === "function" &&
        musicState.ytPlayer.getPlayerState() !== 1) return;

    const startVolume = musicState.currentVolume;
    const steps = 20;
    const stepMs = ms / steps;
    const volumeStep = startVolume / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      const newVolume = Math.max(0, Math.round(startVolume - volumeStep * currentStep));
      musicState.ytPlayer.setVolume(newVolume);
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        musicState.ytPlayer.pauseVideo();
      }
    }, stepMs);
  },

  /* ── Test helper ── */
  _getState() { return { ...musicState }; },
  _setState(patch) { Object.assign(musicState, patch); },
};

/* ── Task 7.1 / 7.4 — DOM wiring for music controls ── */
document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("music-search-btn");
  const searchInput = document.getElementById("music-search");
  const volumeSlider = document.getElementById("volume-slider");
  const muteBtn = document.getElementById("mute-btn");
  const stopBtn = document.getElementById("stop-btn");

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      MusicModule.search(searchInput ? searchInput.value : "");
    });
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") MusicModule.search(searchInput.value);
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener("input", () => {
      MusicModule.setVolume(Number(volumeSlider.value));
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener("click", () => MusicModule.toggleMute());
  }

  if (stopBtn) {
    stopBtn.addEventListener("click", () => MusicModule.stop());
  }
});

/* ─────────────────────────────────────────────────────────────
   Voice Definition Agent — existing IIFE (unchanged behaviour)
   ───────────────────────────────────────────────────────────── */
(function () {
  const toggleBtn = document.getElementById("toggleBtn");
  const statusEl = document.getElementById("status");
  const micDenied = document.getElementById("micDenied");
  const reconnectBtn = document.getElementById("reconnectBtn");
  const defCard = document.getElementById("definition-card");
  const defWord = document.getElementById("definition-word");
  const defPos = document.getElementById("definition-pos");
  const defText = document.getElementById("definition-text");
  const defExtra = document.getElementById("definition-extra");

  let conversation = null;
  let lastUserWord = null;
  let idleTimer = null;
  const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (conversation) {
        stopSession();
        setStatus("idle (timed out)");
      }
    }, IDLE_TIMEOUT_MS);
  }

  function clearIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = null;
  }

  function setStatus(text) {
    statusEl.textContent = text;
    statusEl.className = "";
    const knownStates = ["idle", "connecting", "listening", "speaking", "error", "disconnected"];
    const match = knownStates.find((s) => text === s || text.startsWith(s));
    if (match) statusEl.classList.add(match);
  }

  function setButtonActive(active) {
    toggleBtn.textContent = active ? "Stop" : "Start";
    active ? toggleBtn.classList.add("active") : toggleBtn.classList.remove("active");
  }

  function resetToIdle() {
    setStatus("idle");
    setButtonActive(false);
    reconnectBtn.style.display = "none";
    conversation = null;
  }

  function handleAgentMessage(text) {
    if (!text || !text.trim()) return;

    const match = text.match(/^([A-Za-z\-']+)\s*(?:\(([^)]+)\))?[:\-–]\s*(.+)/);
    if (match) {
      const word = match[1];
      const pos = match[2] || "";
      const definition = match[3];

      const extraMatch = definition.match(/^(.*?)\.\s*(Origin:|Example:)(.*)$/s);
      const mainDef = extraMatch ? extraMatch[1] + "." : definition;
      const extra = extraMatch ? (extraMatch[2] + extraMatch[3]).trim() : "";

      defWord.textContent = word;
      defPos.textContent = pos;
      defText.textContent = mainDef;
      defExtra.textContent = extra;
      defExtra.style.display = extra ? "block" : "none";
      defCard.style.display = "block";
    } else if (lastUserWord) {
      defWord.textContent = lastUserWord;
      defPos.textContent = "";
      defText.textContent = text;
      defExtra.textContent = "";
      defExtra.style.display = "none";
      defCard.style.display = "block";
    }
  }

  async function startSession() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (_err) {
      micDenied.style.display = "block";
      return;
    }

    micDenied.style.display = "none";
    setStatus("connecting");
    setButtonActive(true);

    let signedUrl;
    try {
      const res = await fetch("/api/signed-url");
      if (!res.ok) throw new Error("non-2xx response");
      const data = await res.json();
      signedUrl = data.signedUrl;
    } catch (_err) {
      statusEl.textContent = "Could not connect to the server. Please try again.";
      setButtonActive(false);
      return;
    }

    try {
      conversation = await Conversation.startSession({
        signedUrl,
        clientTools: {
          play_music: async ({ query }) => {
            await MusicModule.search(query, { autoplay: true });
            return { success: true, query };
          },
          pause_music: async () => {
            MusicModule.stop();
            return { success: true };
          },
          start_timer: async ({ minutes }) => {
            console.log("[client tool] start_timer called with minutes:", minutes);
            const result = TimerModule.setDuration(minutes);
            if (!result.ok) return { success: false, error: result.error };
            _showTimerSection();
            renderCountdown(TimerModule.getState().remainingSeconds);
            TimerModule.start();
            _updateTimerButtons();
            return { success: true, minutes };
          },
          pause_timer: async () => {
            const s = TimerModule.getState().timerState;
            if (s === "running") TimerModule.pause();
            else if (s === "paused") TimerModule.resume();
            _updateTimerButtons();
            return { success: true };
          },
          reset_timer: async () => {
            TimerModule.reset();
            renderCountdown(TimerModule.getState().remainingSeconds);
            const banner = document.getElementById("timer-end-banner");
            if (banner) banner.setAttribute("hidden", "");
            _updateTimerButtons();
            return { success: true };
          },
        },
        onConnect: () => {
          setStatus("ready — speak now");
          setTimeout(() => setStatus("listening"), 1000);
          resetIdleTimer();
        },
        onDisconnect: () => {
          clearIdleTimer();
          setStatus("disconnected");
          setButtonActive(false);
          reconnectBtn.style.display = "inline-block";
          conversation = null;
        },
        onError: (err) => {
          setStatus("error: " + ((err && err.message) ? err.message : String(err)));
          setButtonActive(false);
          conversation = null;
        },
        onModeChange: ({ mode }) => {
          if (mode === "listening" || mode === "speaking") setStatus(mode);
          if (mode === "speaking" && typeof MusicModule !== "undefined" && MusicModule) MusicModule.duck && MusicModule.duck();
          if (mode === "listening" && typeof MusicModule !== "undefined" && MusicModule) MusicModule.unduck && MusicModule.unduck();
        },
        onMessage: ({ message, source }) => {
          if (source === "user") {
            resetIdleTimer();
            lastUserWord = message.trim().replace(/^(what does |define |what is )/i, "").replace(/\?.*$/, "").trim();
          } else if (source === "ai") {
            handleAgentMessage(message);
          }
        },
      });
    } catch (err) {
      setStatus("error: " + ((err && err.message) ? err.message : String(err)));
      setButtonActive(false);
      conversation = null;
    }
  }

  async function stopSession() {
    clearIdleTimer();
    if (conversation) {
      try { await conversation.endSession(); } catch (_) {}
    }
    resetToIdle();
  }

  toggleBtn.addEventListener("click", () => conversation ? stopSession() : startSession());
  reconnectBtn.addEventListener("click", () => {
    reconnectBtn.style.display = "none";
    startSession();
  });
})();
