# Muse · 하루 한 시간

무료 공식 문서로 배우고, 질문에 답하고, 나중에 내 답변과 AI 리뷰를 함께 보는 공개 학습 노트입니다.

- 사이트: https://gksruf293.github.io/muse-learning-lab/
- PC 학습 화면: http://127.0.0.1:3847 (연결 프로그램 실행 중)
- Claude 디자인 의뢰: [작업 요청 및 상세 맥락 통합 문서](handoff/CLAUDE_DESIGN_HANDOFF.md) — 이 파일 하나만 전달하세요.

## 하루 학습 흐름

1. 자료의 목표를 확인합니다 (5분).
2. 무료 원문에서 지정한 부분을 읽습니다 (20분).
3. 작은 실습을 직접 실행합니다 (20분).
4. 문서를 닫고 이해 확인 질문에 답합니다 (15분).
5. **그날의 학습 완료**를 누릅니다.
6. GitHub에 저장된 답변을 PC의 Claude/Codex CLI가 리뷰합니다.
7. 학습 기록을 새로고침하고 펼쳐 리뷰와 다음 복습 질문을 확인합니다.

답변 초안은 기기별 localStorage에 자동 저장됩니다. 완료한 답변은 공개 GitHub Issue에 저장되고 리뷰는 그 Issue의 댓글로 남습니다. PC용 화면은 `gh`가 직접 저장합니다. 공개 페이지에서는 GitHub 새 Issue 화면에서 사용자가 최종 저장을 해야 합니다. 길이가 긴 답변은 Markdown 파일로 내려받아 Issue 본문에 붙여 넣습니다. GitHub 저장 전 초안은 다른 기기와 동기화되지 않습니다.

자료 보관함은 원문 링크와 메모를 보관합니다. PC 화면에서는 GitHub Issue에도 저장합니다. 공개 화면에서도 GitHub 자료 저장 링크를 제공하며, GitHub에서 최종 저장하면 다른 기기에서 다시 볼 수 있습니다. 저장 전에는 현재 기기 보관으로 표시합니다.

## API와 CLI의 역할

```text
PC 학습 화면
  → 로컬 API: 답변 초안 보관
  → 로컬 API: 완료 신호 {submissionId}
  → GitHub CLI: gh issue create / edit
  → PC 리뷰 프로그램: 저장소 소유자의 학습 Issue 확인
  → Claude/Codex CLI: 제공된 자료·질문·기준으로 리뷰
  → GitHub CLI: gh issue comment
  → 학습 기록 화면에서 답변·리뷰 다시 보기

휴대폰 / 공개 Pages
  → GitHub 로그인 후 학습 Issue 저장
  → PC가 다시 켜지고 리뷰 프로그램이 실행되면 같은 흐름으로 처리
```

모델 API 키나 OpenRouter 호출은 사용하지 않습니다. CLI는 로그인된 AI 서비스에 연결되므로 완전한 오프라인 추론은 아니며, 해당 서비스의 계정 사용 한도가 적용됩니다. GitHub Pages는 정적 사이트를 호스팅하고 Actions는 검사·배포만 실행합니다. AI 리뷰는 GitHub 호스팅 러너에서 실행하지 않습니다.

## PC 연결

필요한 도구: Node.js 22 이상, Git, GitHub CLI, Claude Code 또는 Codex CLI.

```powershell
git clone https://github.com/gksruf293/muse-learning-lab.git
cd muse-learning-lab
gh auth login
# 사용할 CLI의 로그인도 먼저 완료합니다.
claude
# 또는: codex login

./start-local.ps1
# Claude로 리뷰하려면:
./start-local.ps1 -Provider claude
```

브라우저에서 http://127.0.0.1:3847 을 여세요. 기본 리뷰 도구는 Codex입니다. 별도 모델을 강제로 지정하지 않습니다. Claude는 CLI 기본 모델을, 안전하게 사용자 설정을 제외해 실행하는 Codex는 CLI 내장 기본 모델을 사용합니다. 이 PC에 있는 `.npm-global` 설치와 인접 폴더의 `.tools/gh/bin/gh.exe`는 실행 스크립트가 찾습니다. 그 밖의 설치는 PATH에 도구를 등록하거나 `MUSE_GH_PATH`, `MUSE_CLAUDE_PATH`, `MUSE_CODEX_PATH`로 실행 파일의 절대 경로를 지정하세요. Codex npm 설치는 `codex.js` 경로를 사용할 수 있습니다.

GitHub CLI 로그인이 없지만 Git Credential Manager에 기존 GitHub 인증이 있으면 현재 프로세스에서만 사용합니다. 토큰은 저장소나 설정 파일에 쓰지 않고 AI CLI 자식 프로세스에 전달하지 않습니다. 도구는 저장소 소유자 `gksruf293` 계정으로 로그인해야 합니다.

`start-local.ps1`을 켜 두어야 자동 리뷰가 실행됩니다. PC 종료·절전·인터넷 단절 중에는 리뷰가 대기하며 GitHub에 이미 저장한 답변은 남습니다. 프로그램을 다시 켜면 미처리 기록을 확인합니다. 새 학습 기록은 기본 60초마다 확인합니다. `.local/worker-state.json`에 실행 상태와 실패 이유를 기록하고 재시도합니다. 게시 실패 후에는 생성된 리뷰를 재사용해 같은 리뷰를 다시 생성하지 않습니다. 한 번에 하나씩 처리합니다.

개발용 명령:

```powershell
npm test
npm run check
npm start
# 연결 프로그램을 끈 상태에서 미처리 답변을 한 번 확인하려면:
npm run review
```

위 직접 Node 명령은 CLI 실행 경로와 GitHub 로그인이 준비되어 있어야 합니다. `npm run review`와 상시 프로그램을 동시에 실행하지 마세요.

## 학습 문서와 새 자료

`docs/data/lessons.json`에 8개의 학습 문서를 넣었습니다. 원문을 먼저 읽고 한국어 설명·실습·질문·평가 기준을 직접 작성했습니다. 원문 링크, 읽은 날짜, 읽은 구간을 함께 기록했습니다. 자료 전문을 복제하지 않습니다. 60분은 예상 시간입니다.

학습 문서를 추가할 때:

1. 자료 보관함에 무료 원문 링크와 배우고 싶은 점을 적습니다.
2. 보관함의 학습 문서 생성 프롬프트를 Claude/Codex에 전달합니다.
3. AI가 원문을 실제로 읽었는지, 질문·평가 기준이 원문에 맞는지 확인합니다.
4. 기존 JSON 객체와 같은 형식으로 `lessons.json`에 추가합니다.
5. `npm run check`와 `npm test` 후 main에 반영합니다.

읽지 못한 원문은 읽었다고 표시하지 않습니다. 유료·비공개 자료 전문을 공개 저장소에 복사하지 않습니다. 기존 기록을 보존하려면 **이미 사용한 학습 문서의 ID·버전을 제거하지 말고** 새 ID로 개정 문서를 추가하세요. 현재 파서는 등록된 ID·버전의 기록을 읽으며, 알 수 없는 버전은 원본 Issue에서 확인해야 합니다. 기존 질문을 변경하면 그 문서를 기준으로 생성한 리뷰 지문이 달라져 새 리뷰가 필요합니다.

## 공개 범위와 실행 경계

사용자 선택에 따라 자료·완료 답변·리뷰는 모두 공개입니다. 건강·생활 일정·취업 서류가 들어 있는 기존 비공개 `muse-daily-bridge` 저장소의 내용은 가져오지 않았습니다. 공개할 학습 기록에 인증키나 회사 비공개 자료를 넣지 마세요.

로컬 API는 127.0.0.1에만 열리고 세션 토큰, JSON 요청, Origin/Host를 확인합니다. 공개 페이지에서 임의로 PC 명령을 실행하지 못합니다. API는 고정된 동작만 수행하고 사용자 답변을 셸 명령에 삽입하지 않습니다. CLI 리뷰는 저장소 소유자가 작성한 유효한 학습 기록만 처리합니다. 자료 보관용 Issue나 다른 사용자의 글은 AI 실행 대상이 아닙니다.

Claude 리뷰는 도구·MCP·세션 저장을 끄고 안전 모드로 실행합니다. Codex 리뷰는 사용자 설정을 제외하고 읽기 전용·임시 세션으로 실행하며 셸과 수정 도구를 끕니다. 답변은 평가할 데이터로 전달하고 지시문으로 따르지 않도록 명시합니다. 개인 PC 자체를 인터넷에 공개하는 터널은 구성하지 않습니다.

## 공식 참고 문서 (2026-10-02 확인)

- [GitHub CLI Issue 만들기](https://cli.github.com/manual/gh_issue_create)
- [GitHub Pages Actions 배포](https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically)
- [Claude Code 비대화형 실행](https://code.claude.com/docs/en/headless)
- [Claude Code CLI 옵션](https://code.claude.com/docs/en/cli-reference)
- [Codex 비대화형 실행](https://learn.chatgpt.com/docs/non-interactive-mode)
- 학습 원문 링크는 각 학습 문서의 `sources` 항목에 있습니다.
