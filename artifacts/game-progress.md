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
운영 저장소: https://github.com/seominho2026-tech/hangul
공개 주소: https://seominho2026-tech.github.io/hangul/
GitHub Pages main /docs 배포. 서버·DB·유료 외부 API 사용 없음.

## 2026-10-08 학습 연출 확장
- 승인 범위: 글자 생성 연출, 책·궁궐 복원, 가상 안내자와 장별 목표, 공간 효과음, 복습 도감.
- 제약: 유료 서비스 금지, 무거운 입체 모델 금지. 기존 점수·저장·인증서·출처와 검증된 기관 단면 유지.
- 구현: 기존 기관 그림 확대와 SVG 선 그리기; 다섯 장 복원; 기존 궁궐 재질 변화; 무료 효과음; 오답 문제 ID만 브라우저 기록에 추가.
- 검증 완료: 1440·390·320 너비에서 다섯 장, 글자 재생과 중복 점수 방지, 새로고침 재개, 오답 해설·출처, 인증서 PNG 저장. 화면 넘침과 실행 오류 없음. 실제 기기 성능은 별도 확인 필요.
