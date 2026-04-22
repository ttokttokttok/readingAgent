# Requirements Document

## Introduction

The Reading Timer & Ambient Music feature expands the existing Voice Definition Agent into a complete reading companion app. Readers can set a timed reading session (e.g. 25 min, 45 min, or a custom duration), watch a live countdown, and receive a notification when time is up. While reading, ambient music plays via an embedded YouTube IFrame player — the user searches for a YouTube video (e.g. "lofi hip hop", "focus music"), selects a result, and plays it as background audio. No backend changes are required for music; everything is handled client-side via the YouTube IFrame API. The existing voice definition agent remains fully functional alongside these new features on the same page.

## Glossary

- **App**: The browser-based reading companion application, combining the Voice Definition Agent with the Reading Timer and YouTube Music Player.
- **User**: A person using the App to manage a timed reading session.
- **Timer**: The countdown component that tracks the remaining time in a reading session.
- **Session_Duration**: The total length of time the User has chosen for a reading session (e.g. 25 minutes).
- **Countdown**: The live display of remaining time in MM:SS format.
- **Preset**: A predefined Session_Duration option presented to the User (25 min, 45 min, 60 min).
- **Custom_Duration**: A Session_Duration entered manually by the User, not matching any Preset.
- **Notification**: A visual and/or audible signal delivered to the User when the Timer reaches zero.
- **YouTube_Player**: The client-side component that embeds and controls a YouTube video via the YouTube IFrame API.
- **YouTube_IFrame_API**: The browser-side JavaScript API provided by YouTube at `https://www.youtube.com/iframe_api` that enables programmatic control of embedded YouTube videos.
- **Search_Query**: A text string entered by the User to find YouTube videos suitable for background music (e.g. "lofi hip hop", "focus music").
- **Voice_Agent**: The existing ElevenLabs-powered voice definition agent embedded on the same page.

---

## Requirements

### Requirement 1: Session Duration Selection

**User Story:** As a reader, I want to choose how long my reading session will be, so that I can plan my reading time without watching a clock.

#### Acceptance Criteria

1. THE App SHALL present the User with three Preset durations: 25 minutes, 45 minutes, and 60 minutes.
2. THE App SHALL provide a Custom_Duration input that accepts any integer value between 1 and 180 minutes.
3. IF the User enters a Custom_Duration outside the range of 1 to 180 minutes, THEN THE App SHALL display an inline validation message and prevent the Timer from starting.
4. WHEN the User selects a Preset or confirms a Custom_Duration, THE App SHALL display the chosen Session_Duration as the initial Countdown value before the Timer starts.
5. THE App SHALL retain the most recently selected Session_Duration so that the User does not need to re-enter it after a session ends.

---

### Requirement 2: Reading Timer Countdown

**User Story:** As a reader, I want to see a live countdown during my session, so that I always know how much reading time I have left.

#### Acceptance Criteria

1. WHEN the User starts the Timer, THE Timer SHALL begin counting down from the Session_Duration in one-second intervals.
2. WHILE the Timer is running, THE App SHALL display the Countdown in MM:SS format, updating every second.
3. THE App SHALL provide pause and resume controls for the Timer.
4. WHEN the User pauses the Timer, THE Timer SHALL stop decrementing and the Countdown SHALL remain visible at the paused value.
5. WHEN the User resumes the Timer, THE Timer SHALL continue counting down from the paused Countdown value.
6. THE App SHALL provide a reset control that stops the Timer and restores the Countdown to the full Session_Duration.
7. WHILE the Timer is running, THE App SHALL update the browser tab title to include the current Countdown value so the User can monitor time without keeping the tab in focus.

---

### Requirement 3: Session End Notification

**User Story:** As a reader, I want to be notified when my reading time is up, so that I can stop at the right moment even if I am absorbed in my book.

#### Acceptance Criteria

1. WHEN the Countdown reaches zero, THE App SHALL display a prominent visual Notification indicating the session has ended.
2. WHEN the Countdown reaches zero, THE App SHALL play a brief audible chime to alert the User.
3. WHERE the browser supports the Web Notifications API and the User has granted notification permission, THE App SHALL send a browser push Notification when the Countdown reaches zero.
4. WHEN the Countdown reaches zero, THE Timer SHALL stop and the Countdown SHALL display "00:00".
5. WHEN the Countdown reaches zero and the YouTube_Player is playing, THE YouTube_Player SHALL fade the volume to zero over 5 seconds and then pause playback.

---

### Requirement 4: YouTube Music Search

**User Story:** As a reader, I want to search for background music by typing a query, so that I can find a suitable YouTube video to play while I read.

#### Acceptance Criteria

1. THE App SHALL provide a Search_Query text input that accepts free-text search terms (e.g. "lofi hip hop", "focus music", "ambient study").
2. WHEN the User submits a Search_Query, THE YouTube_Player SHALL load a YouTube search results page embedded in the IFrame using the query as the search term.
3. THE App SHALL provide a submit control (button or Enter key) to trigger the search.
4. IF the Search_Query is empty when submitted, THEN THE App SHALL display an inline validation message and SHALL NOT initiate a search.
5. THE YouTube_Player SHALL operate entirely client-side using the YouTube IFrame API, requiring no backend endpoint or API key.

---

### Requirement 5: YouTube Music Playback Controls

**User Story:** As a reader, I want to control the volume and playback of the YouTube video, so that I can adjust the music without leaving the page.

#### Acceptance Criteria

1. WHEN the YouTube IFrame API is ready, THE YouTube_Player SHALL be initialised and ready to accept playback commands.
2. THE App SHALL provide a volume slider that sets the YouTube_Player volume between 0% and 100%.
3. THE App SHALL provide a mute/unmute toggle that silences and restores the YouTube_Player audio without changing the slider position.
4. THE App SHALL provide a stop control that pauses the YouTube_Player and resets it to the beginning of the video.
5. THE YouTube_Player SHALL operate independently of the Timer so that the User can run music without starting the Timer, and vice versa.
6. IF the YouTube IFrame API fails to load, THEN THE App SHALL display an error message in the music section and SHALL NOT prevent the Timer from functioning.

---

### Requirement 6: Auto-Duck During Voice Agent Speech

**User Story:** As a reader, I want the music to lower automatically when the voice agent speaks, so that I can hear definitions clearly without manually adjusting the volume.

#### Acceptance Criteria

1. WHEN the Voice_Agent begins speaking, THE YouTube_Player SHALL reduce its playback volume by 50% of the current volume level.
2. WHEN the Voice_Agent finishes speaking, THE YouTube_Player SHALL restore its playback volume to the level it was at before ducking.
3. WHILE the Voice_Agent is speaking, THE App SHALL NOT allow the volume slider to override the ducked volume level.
4. IF the YouTube_Player is not playing when the Voice_Agent begins speaking, THE App SHALL take no ducking action.

---

### Requirement 7: Integrated Reading Companion UI

**User Story:** As a reader, I want the timer, music player, and voice agent controls to appear together on one page, so that I can manage my entire reading session from a single interface.

#### Acceptance Criteria

1. THE App SHALL display the Timer controls, YouTube_Player controls, and Voice_Agent controls on a single page without requiring navigation.
2. WHEN the Timer and YouTube_Player are both active, THE App SHALL allow the User to interact with the Voice_Agent without interrupting the Timer or YouTube_Player playback.
3. THE App SHALL visually distinguish the Timer section, YouTube_Player section, and Voice_Agent section so that each area is easy to identify at a glance.
4. THE App SHALL remain fully functional on viewport widths of 320px and above.
