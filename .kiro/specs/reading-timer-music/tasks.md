# Implementation Plan: Reading Timer & Ambient Music

## Overview

Extend `public/index.html` and `public/client.src.js` to add a Reading Timer, YouTube Ambient Music player, and auto-duck integration with the existing Voice Agent. All work is purely client-side. After any JS change run `npm run build` to rebundle `client.src.js → client.js`.

## Tasks

- [x] 1. Restructure HTML and CSS for the three-section layout
  - Widen `.container` to `max-width: 900px`
  - Replace the existing single-column markup with an `.app-grid` CSS Grid (three column-cards on desktop, single column ≤ 600 px)
  - Add `<section class="card" id="timer-section">` with preset buttons, custom-duration input, `#timer-display`, start/pause/reset controls, and `#timer-end-banner`
  - Add `<section class="card" id="music-section">` with search input, `#yt-player` container, `#yt-error`, volume slider, mute, and stop controls
  - Move existing Voice Agent markup into `<section class="card" id="agent-section">`
  - Add `<script src="https://www.youtube.com/iframe_api">` tag to `<head>` (YouTube IFrame API)
  - Add CSS for `.card`, `.app-grid`, `.countdown`, `.preset-buttons`, `.music-controls`, `.end-banner`, `.inline-error`
  - _Requirements: 7.1, 7.3, 7.4_

- [x] 2. Implement `TimerModule` — state, duration selection, and countdown
  - [x] 2.1 Implement `TimerModule` core: state object, `setDuration(minutes)`, `start()`, `pause()`, `resume()`, `reset()`, `getState()`, and `_setState()` (test helper)
    - `setDuration` validates 1–180 and returns `{ ok: true }` or `{ ok: false, error }`
    - `start()` sets `timerState = 'running'` and starts a `setInterval` that decrements `remainingSeconds` each second
    - `pause()` clears the interval, sets `timerState = 'paused'`
    - `resume()` restarts the interval from the current `remainingSeconds`
    - `reset()` clears the interval, restores `remainingSeconds = sessionDuration`, sets `timerState = 'idle'`
    - _Requirements: 1.2, 1.3, 2.1, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 2.2 Write property test for duration validation (Property 1)
    - **Property 1: Duration validation accepts valid range and rejects invalid range**
    - **Validates: Requirements 1.2, 1.3**

  - [ ]* 2.3 Write property test for countdown tick accuracy (Property 3)
    - **Property 3: Countdown decrements by exactly 1 per tick**
    - **Validates: Requirements 2.1**

  - [ ]* 2.4 Write property test for pause/resume round-trip (Property 4)
    - **Property 4: Pause/resume round-trip preserves remaining time**
    - **Validates: Requirements 2.4, 2.5**

  - [ ]* 2.5 Write property test for reset (Property 5)
    - **Property 5: Reset always restores full session duration**
    - **Validates: Requirements 2.6**

- [x] 3. Implement `TimerModule` — display, tab title, and preset wiring
  - [x] 3.1 Implement `renderCountdown(remainingSeconds)` — updates `#timer-display` and `document.title` with `formatCountdown(remainingSeconds)`
    - Implement `formatCountdown(totalSeconds)` as a pure exported helper
    - _Requirements: 2.2, 2.7_

  - [ ]* 3.2 Write property test for countdown format (Property 2)
    - **Property 2: Countdown format is always valid MM:SS**
    - **Validates: Requirements 2.2**

  - [ ]* 3.3 Write property test for tab title (Property 6)
    - **Property 6: Tab title always contains the current countdown**
    - **Validates: Requirements 2.7**

  - [x] 3.4 Wire preset buttons (`data-minutes` attributes) to `TimerModule.setDuration()` and update `#timer-display` immediately on selection
    - Persist the last selected duration to `localStorage` and restore on page load
    - Show `#custom-error` inline when custom input is invalid; clear it on valid input
    - _Requirements: 1.1, 1.4, 1.5_

  - [x] 3.5 Wire start/pause/resume/reset buttons to `TimerModule` methods and update button enabled/disabled states
    - Start → disabled while running; Pause ↔ Resume toggle; Reset → disabled while idle
    - _Requirements: 2.3, 2.6_

- [x] 4. Implement `TimerModule` — session-end notification
  - [x] 4.1 Implement `onTimerEnd()`: clear interval, set `timerState = 'idle'`, show `#timer-end-banner`, synthesise chime via Web Audio API (880 Hz sine, 0.6 s fade-out), request/fire browser push notification
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 4.2 Write property test for terminal state at zero (Property 7)
    - **Property 7: Timer reaches terminal state at zero**
    - **Validates: Requirements 3.4**

  - [ ]* 4.3 Write unit tests for session-end side effects
    - Verify `#timer-end-banner` becomes visible when `remainingSeconds` reaches 0
    - Verify `AudioContext` oscillator is created and started on `onTimerEnd`
    - Verify `Notification` constructor is called when permission is `'granted'`
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Checkpoint — timer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement `MusicModule` — YouTube IFrame API initialisation
  - [x] 6.1 Implement `window.onYouTubeIframeAPIReady` callback that constructs `YT.Player` on `#yt-player`; set `apiReady = true`; catch constructor errors and show `#yt-error`
    - Guard all player calls with `if (!ytPlayer) return;`
    - If the API script fails to load, show `#yt-error` and set `apiError = true`
    - _Requirements: 5.1, 5.6_

  - [ ]* 6.2 Write unit test for API initialisation
    - Verify `YT.Player` is constructed with `#yt-player` container ID
    - Verify `#yt-error` is shown and no throw occurs when constructor fails
    - _Requirements: 5.1, 5.6_

- [x] 7. Implement `MusicModule` — search, playback controls, and volume
  - [x] 7.1 Implement `MusicModule.search(query)` — validates non-empty/non-whitespace, calls `ytPlayer.loadVideoByUrl()` with `youtube.com/results?search_query=<encoded query>`; shows `#search-error` on empty input
    - Wire `#music-search-btn` click and Enter key on `#music-search` to `MusicModule.search()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 7.2 Write property test for search URL encoding (Property 8)
    - **Property 8: Search URL always encodes the query**
    - **Validates: Requirements 4.2**

  - [ ]* 7.3 Write property test for empty/whitespace query rejection (Property 9)
    - **Property 9: Empty or whitespace query is always rejected**
    - **Validates: Requirements 4.4**

  - [x] 7.4 Implement `MusicModule.setVolume(v)`, `MusicModule.toggleMute()`, and `MusicModule.stop()`
    - `setVolume(v)`: updates `currentVolume`; calls `ytPlayer.setVolume(v)` only when not ducked; updates slider position
    - `toggleMute()`: toggles `isMuted`; calls `ytPlayer.setVolume(0)` or restores `currentVolume`; does not move slider
    - `stop()`: calls `ytPlayer.pauseVideo()` and `ytPlayer.seekTo(0, true)`
    - Wire `#volume-slider`, `#mute-btn`, `#stop-btn` to the above methods
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [ ]* 7.5 Write property test for volume setter (Property 10)
    - **Property 10: Volume setter always applies the given level**
    - **Validates: Requirements 5.2**

  - [ ]* 7.6 Write property test for mute/unmute round-trip (Property 11)
    - **Property 11: Mute/unmute round-trip preserves volume level**
    - **Validates: Requirements 5.3**

  - [ ]* 7.7 Write unit tests for stop and null-guard behaviour
    - Verify `stop()` calls `pauseVideo()` and `seekTo(0)`
    - Verify `duck()` is a no-op when `ytPlayer` is null
    - _Requirements: 5.4, 5.6_

- [x] 8. Implement `MusicModule` — duck/unduck and fade-out
  - [x] 8.1 Implement `MusicModule.duck()`, `MusicModule.unduck()`, and `MusicModule.fadeOutAndPause(ms)`
    - `duck()`: saves `preduckedVolume = currentVolume`, calls `ytPlayer.setVolume(Math.round(currentVolume * 0.5))`, sets `isDucked = true`; no-op if `ytPlayer` null or not playing
    - `unduck()`: calls `ytPlayer.setVolume(preduckedVolume)`, sets `isDucked = false`; no-op if `ytPlayer` null
    - `fadeOutAndPause(ms)`: steps volume from current to 0 over `ms` ms via `setInterval`, then calls `ytPlayer.pauseVideo()`; guard with player state check
    - _Requirements: 3.5, 6.1, 6.2, 6.4_

  - [ ]* 8.2 Write property test for duck/unduck round-trip (Property 12)
    - **Property 12: Duck/unduck round-trip restores pre-duck volume**
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 8.3 Write property test for volume slider blocked while ducked (Property 13)
    - **Property 13: Volume slider is blocked while ducked**
    - **Validates: Requirements 6.3**

  - [x] 8.4 Wire `MusicModule.fadeOutAndPause(5000)` as the `onTimerEnd` callback in `TimerModule`
    - _Requirements: 3.5_

- [x] 9. Extend `VoiceAgentModule` — auto-duck integration
  - [x] 9.1 Extend the existing `onModeChange` callback to call `MusicModule.duck()` when `mode === 'speaking'` and `MusicModule.unduck()` when `mode === 'listening'`
    - Wrap calls in a null-guard so they are no-ops if `MusicModule` is not yet initialised
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 9.2 Write unit tests for auto-duck integration
    - Verify `onModeChange({ mode: 'speaking' })` calls `MusicModule.duck()`
    - Verify `onModeChange({ mode: 'listening' })` calls `MusicModule.unduck()`
    - Verify `duck()` is a no-op when player is not playing
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 10. Checkpoint — full integration
  - Run `npm run build` to verify the bundle compiles without errors.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Run `npm run build` after every JS change to rebundle `client.src.js → client.js`
- Property tests use `fast-check` (already installed) with `numRuns: 100`; tag each test with `// Feature: reading-timer-music, Property N: <text>`
- All module state is module-scoped; `_setState()` helpers are exposed only for testing
- YouTube IFrame API is loaded via `<script>` tag in `index.html`; no API key required
