# 프로젝트 연결 정보

기록 기준: 2026-10-08, 한국 시간. 다른 프로젝트를 잘못 수정하지 않도록 배포 전에 실제 조회 결과와 아래 정보를 대조합니다.

| 항목 | 현재 상태 |
| --- | --- |
| 프로젝트 | 훈민정음: 사라진 글자를 찾아라 |
| Vercel 팀 표시 이름 | smh's projects |
| Vercel 팀 slug | smh-s-projects |
| Vercel orgId | team_jWOKc9uPTAoRFeZxYePdneO3 |
| Vercel projectId | 미생성·미확인 |
| GitHub 저장소 URL | 저장소 미생성 |
| 공개 배포 주소 | 없음: 배포 성공 미확인 |
| Supabase project ref | 해당 없음: 생성하지 않음 |

## 배포 시도에서 확인한 문제

- Vercel MCP `create_project`가 HTTP 403 권한 거부로 실패했습니다. 프로젝트가 생성됐다고 간주하지 않습니다.
- Vercel CLI에서는 비 ASCII 문자와 관련된 `ByteString` 오류가 발생했습니다. 원인이 해결되기 전에는 CLI 배포 성공으로 보고하지 않습니다.
- 계정·팀 권한 및 CLI 실행 환경을 확인하고, 생성 성공 후 실제 projectId를 이 문서에 기록합니다. 다른 팀이나 기존 운영 프로젝트로 임의 변경하지 않습니다.
- 배포 전 `.vercel/project.json`의 projectId·orgId와 조회한 대상을 대조합니다. 존재하지 않는 식별자를 추측해 채우지 않습니다.
- GitHub 저장소와 원격 주소를 실제 생성·확인하기 전에는 commit·push 완료로 보고하지 않습니다.

## 저장 방식과 정보 보호

- 앱 데이터는 각 브라우저의 `localStorage`에 저장합니다. 서버와 공동 순위 DB가 필요 없는 현재 구조에서는 Supabase를 만들지 않습니다.
- Vercel 팀·프로젝트 식별자는 비밀 키가 아닙니다. 토큰·API 키·인증 파일·`.env.local`·`.vercel`과 학생 개인정보는 Git에 넣지 않습니다.
- 기존 운영 데이터 삭제, 접근 통제 완화, 유료 결제 등은 대상과 이유를 설명하고 별도 확인을 받습니다.
- `AGENTS.md` 덮어쓰기는 자동 승인 검토에서 거부되었습니다. 해당 파일을 수정하지 않고 프로젝트 연결 현황을 이 별도 문서에 기록했습니다.

구현 설명은 `README.md`, 행사 운영은 `FESTIVAL_GUIDE.md`, 검사 현황은 `artifacts/final-evidence.md`를 참고합니다.
