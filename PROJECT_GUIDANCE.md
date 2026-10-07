# 프로젝트 연결 정보

기준: 2026-10-08 (한국 시간)

- 앱: 훈민정음: 사라진 글자를 찾아라
- GitHub: https://github.com/seominho2026-tech/hangul
- 학생용 공개 주소: https://seominho2026-tech.github.io/hangul/
- 배포: GitHub Pages, main 브랜치의 /docs, HTTPS
- Vercel orgId: team_jWOKc9uPTAoRFeZxYePdneO3 (smh-s-projects)
- Vercel projectId: 미생성. API 403 및 CLI ByteString 오류로 Vercel 배포는 수행하지 않음.
- Supabase project ref: 해당 없음. 기록은 브라우저 localStorage에만 저장.

## 배포 갱신

npm run build로 일반 배포 빌드를 생성한 뒤 dist 산출물을 docs에 반영하고 main에 push합니다.
테스트 전용 dist-test는 배포하지 않습니다. 변경 파일의 비밀값 검사 후 커밋합니다.
게시 완료 상태와 공개 주소의 HTTP 응답 및 화면 동작을 확인합니다.
.env, .vercel, 인증 파일, 비밀값, 학생 개인정보는 Git에 넣지 않습니다.
AGENTS.md 및 사용자 보안 지침은 덮어쓰지 않습니다.

## 확인 결과

2026-10-08 공개 주소에 로그인 없이 접속하여 PC 1440x900 및 모바일 390x844에서
시작, 닉네임 입력, 책 펼치기, 궁궐 진입, 키보드/조이스틱 입력을 확인했습니다.
브라우저 오류와 가로 넘침이 없으며 공개 빌드에 테스트용 훅이 없음을 확인했습니다.
전체 게임의 모든 과정을 공개 주소에서 다시 검사한 것은 아닙니다.
