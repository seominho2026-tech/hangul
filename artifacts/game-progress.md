# 훈민정음: 사라진 글자를 찾아라

## Intent and constraints
- Vite / TypeScript / Three.js, Korean school festival, no server or external DB. Local device leaderboard clearly labelled.
- Playable exploration, five puzzle stages, restoration, 60 second quiz, score, PNG certificate, ranking, restart and festival reset.
- APIs probed: TRIPO_API_KEY=MISSING, GEMINI_API_KEY=MISSING, ELEVENLABS_API_KEY=MISSING. Authored procedural palace and synthesized Web Audio fallback; no paid generation jobs.
- Main skills: threejs-game-director and all eight siblings loaded. Installer used official skill-installer helper.

## Design brief
The student becomes a travelling scholar recovering writing for everyone. Explore with movement and proximity interaction, observe shapes, connect symbols, add strokes, assemble syllables. Every 5–30 seconds a pickup or manipulation earns feedback and meaningful progress. Five stages introduce one principle at a time. Errors reveal short hints without score penalties. Speed earns a capped bonus; the finale adds a time-limited challenge. No combat or punishing fail state.

## Core loop contract
Move and observe to find letters, then manipulate letter pieces to restore the book. Route choice and the optional time bonus provide soft pressure; quiz pressure is a real 60 second deadline. Correct actions advance persistent progress and score once. Wrong answers explain and allow immediate retry. A new run clears only run progress, keeping ranking.

## Level plan
One authored palace courtyard: start at south gate, first letter near the approach, branching east/west garden routes, five letter landmarks, central hall unlock. Follow camera, WASD/arrows, drag view, E, touch joystick. Stage 2 pronunciation silhouettes, stage 3 heaven/earth/person, stage 4 seven stroke placements, stage 5 Hangul blocks. Landmark map and contextual prompt make next actions visible.

## Art and interfaces
Warm sunset, blue-green tiled roofs, vermilion pillars, gold letter seals, indigo/ivory ink UI. Lightweight custom collision; no rigid-body physics needed. World worker owns PalaceWorld.ts. Content worker owns education/quiz, ranking, certificate. Lead owns integration, state, UI, input, audio, tests and release.

## Verification plan
Production build and preview, desktop/mobile real input progression, timing and combo assertions, persistence, certificate, reset, console checks. Active-play, puzzle and result captures; renderer/pixel metrics. Hardware phone performance remains separate from viewport emulation.

## Current
Scaffold created; implementation in progress. No repository or deployment identifiers yet; verify real account/project before publication.
