# 외부 강의 연계 학습 · 2026-10-02 개정

이전 9~15강은 소개·목차에서 주제를 골라 일반적인 실습을 붙였습니다. 원수업의 구체적인 설명과 실습을 충분히 반영하지 못한 부분을 개정했습니다. 1~8강은 변경하지 않았습니다.

## 실제 읽은 범위

| 자료 | 실제 확인한 내용 | 반영 |
|---|---|---|
| [한빛 원영상 4강](https://www.youtube.com/watch?v=v4kZ4ErsxlU&t=531s) | 자동 생성 한국어 자막 08:51~20:09: 모호한 퀴즈의 기준·자료 확인과 수정 | 9강 유지·수정·보류, 조건·정답·해설·출처 검수 |
| [한빛 원영상 6강](https://www.youtube.com/watch?v=_kKX2kqBD58&t=53s) | 자동 생성 한국어 자막 00:53~07:01: 역할과 도구를 나누는 코드 검토자 | 10강 읽기 전용 설정, 파일 근거와 미실행 결과 구분 |
| [한빛 원영상 7강](https://www.youtube.com/watch?v=owhCgXcax_o&t=99s) | 자동 생성 한국어 자막 01:39~08:15: MCP 클라이언트·서버와 로컬/원격 연결 | 11강 입력 계약·결과 근거, 실행 위치와 설정 scope |
| [한빛 저자 저장소](https://github.com/taehojo/vibecoding) | README의 예제·장별 보완 안내; 인프런 1강 공개 스크립트 시작 부분도 확인 | 영상 번호와 책 번호 구분 |
| [DeepLearning.AI L2 노트](https://github.com/https-deeplearning-ai/sc-claude-code-files/blob/main/reading_notes/L2_notes.md) | 요청·검색·모델·자료 처리의 코드 탐색 노트 | 12강 질문 하나의 실제 함수 추적 |
| [DeepLearning.AI L3 노트](https://github.com/https-deeplearning-ai/sc-claude-code-files/blob/main/reading_notes/L3_notes.md) | 출처 링크·새 대화·강좌 개요 도구의 기능 추가 노트 | 12강 출처 링크 변경 계획; 나머지는 후속 범위 |
| [DeepLearning.AI L4 노트](https://github.com/https-deeplearning-ai/sc-claude-code-files/blob/main/reading_notes/L4_notes.md) | MAX_RESULTS=0 고장 재현, 계층별 검사, 도구 루프 리팩터링 노트 | 13강 검색 설정 오류의 재현·최소 수정·경계 검사 |
| [공식 RAG 시작 코드](https://github.com/https-deeplearning-ai/starting-ragchatbot-codebase) | frontend/script.js; backend/app.py, rag_system.py, ai_generator.py, search_tools.py, vector_store.py, config.py | 노트의 샘플 AI 답변과 실제 함수·자료형·분기를 대조 |
| [freeCodeCamp 원영상](https://www.youtube.com/watch?v=gh2_PhgZGsM&t=9962s) | 자동 생성 영어 자막 09:42~12:52, 02:46:02~02:56:20: 규칙 파일과 구조 점검·상세 검토; [공식 소개](https://www.freecodecamp.org/news/claude-code-for-beginners/) | 14강 근거 있는 책임 분리와 기존 동작 보존 |
| [FlowCoder 강의](https://www.inflearn.com/course/giving-ai-its-first) | 공개 소개·목차; [CLAUDE.md 미리보기](https://www.inflearn.com/courses/lecture?courseId=341870&unitId=435980)의 스크립트 00:01~00:36, 01:18~01:51 | 15강은 공개 안내를 참고한 독립 CSV 실습; 데이터 분석 본편은 미확인 |

자동 생성 자막을 읽는 것은 전체 영상 수강이나 화면 동작 확인과 같지 않습니다. 고유명사·명령어가 잘못 적힐 수 있어 기술 사실은 공식 문서와 대조했습니다. 전체 자막은 공개 저장소에 저장하지 않았으며 설명·예제·문항은 새로 작성했습니다. 원수업 전체의 요약으로 표시하지 않습니다.

## 현재 문서와 대조한 부분

- [Claude Code subagents](https://code.claude.com/docs/en/sub-agents): 별도 문맥·도구·Markdown 설정을 확인했습니다. 현재 문서에서 과거 /agents 생성 메뉴가 제거된 점을 반영해 파일 작성 방식으로 안내합니다.
- [Claude Code MCP](https://code.claude.com/docs/en/mcp): stdio/HTTP 연결과 local/project/user 설정 범위를 구분합니다. local scope를 PC 내부 실행이나 외부 통신 없음의 보증으로 설명하지 않습니다.
- [Claude Code memory](https://code.claude.com/docs/en/memory): CLAUDE.md는 읽는 지침이며 구현 성공이나 보안 통제를 자동 보증하지 않습니다.
- [SQLite SELECT](https://www.sqlite.org/lang_select.html)와 [MDN 200 OK](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/200): SQL 조건과 HTTP 응답 의미를 대조합니다. 상태 코드만으로 특정 DB 구현의 저장 완료를 단정하지 않습니다.

공식 RAG 시작 코드의 설정은 MAX_RESULTS=5입니다. L4의 지시대로 0으로 변경해 고장을 만드는 과정이며 원본이 처음부터 고장났다고 쓰지 않습니다. 공식 RAG 서버는 실행하지 않았고 실제 Chroma의 오류 문구나 검색 품질을 측정하지 않았습니다.

## 60분 구성과 완료 산출물

각 레슨은 목표 5분, 지정 자료·해설 20분, 실습 20분, 회상 질문 15분입니다. 한빛·freeCodeCamp는 지정 구간을 보고 DeepLearning.AI는 지정 함수를 따라갑니다. 개인 속도에 따라 60분을 넘길 수 있으며 전체 강의 수강 시간과 별개입니다.

| 강 | 완료 산출물 | 평가 기준 |
|---|---|---|
| 9 | 세 문항 판단과 수정 문항·정답·해설 | 정답 유일성, 출처 범위, 직접 계산, 근거 부족 보류 |
| 10 | 설정 이유와 근거 있는 리뷰 한 건 | 관찰·영향·제안·미확인, 실행하지 않은 검사 표시 |
| 11 | 유효 호출과 결과 기반 주장 | 자료형·범위, 반환 증거, 실행 위치/scope 구분 |
| 12 | 함수별 추적표와 출처 링크 변경 계획 | 조건부 tool_use, 데이터 전달, 읽기/실행 구분 |
| 13 | 수정 전 실패·설정 수정·검사 기록 | 원인 좁히기, 정상/빈 결과/오류 구분, 검증 한계 |
| 14 | 책임 분리와 기존 동작 검사 | 파일 근거, 독립 검사 가능성, 변경 비용 |
| 15 | 정상/오류 행·통계·반복 실행 비교 | 누락/0 구분, 분모, 오류 보존, CSV 형식의 제한 |

[실습 자료](../docs/practice/README.md)는 이 블로그용 독립 예제입니다. 사이트가 Node.js를 사용하므로 검색·구조·CSV 예제도 Node.js로 만들었습니다. 패키지 설치와 모델 API 없이 실행하며 원강의의 Python·Chroma·LLM을 그대로 복제한 것이 아닙니다. PC에서 실행하지 못했으면 예상 결과로 구분하고 실제 실행했다고 쓰지 않습니다.

13강 검색 starter 검사 1개와 15강 CSV starter 검사 2개는 의도적으로 실패합니다. 저장소 자동 검사는 임시 복사본에서 이 실패를 확인하고 수정 후 같은 검사의 통과를 확인합니다. 14강은 처음부터 동작 검사가 통과하는 코드를 리팩터링합니다.

강의 무료 표시·수강평·CLI 비용은 변동 정보이며 학습 평가의 근거로 사용하지 않습니다. AI 리뷰는 제출한 판단·산출물·근거를 각 레슨의 평가 기준과 비교합니다.
