# 9~15강 실습 자료

원강의에서 확인한 주제를 학습 블로그에 맞게 **새로 만든 예제**입니다. 강사의 원본 코드나 영상 자막을 복제하지 않았습니다. Node.js 22 이상이면 패키지 설치나 모델 API 키 없이 실행할 수 있습니다. 실행은 PC에서 하고, 결과와 판단 근거를 해당 레슨의 답변에 남깁니다.

저장소를 처음 받는다면 `git clone https://github.com/gksruf293/muse-learning-lab.git`을 실행하고 `cd muse-learning-lab`로 이동하세요. 이미 받은 저장소에서 작업 중인 변경이 있다면 먼저 별도 복사본을 만드세요. 아래 명령은 저장소 최상위 폴더에서 실행합니다.

| 강 | 자료 | 제출할 결과 |
|---|---|---|
| 9 | [검수할 퀴즈](09-quiz/questions.json) | 세 문항의 유지·수정·보류 판단, 수정 문항, 근거 |
| 10 | [읽기 전용 검토자 설정 예시](10-reviewer/learning-reviewer.example.md) | 도구 선택 이유, 파일 근거가 있는 검토 1건 |
| 11 | [도구 호출 계약](11-tool/tool-contract.json) | 호출 인자·결과를 읽고 가능한 답변과 불가능한 주장 구분 |
| 12 | [RAG 추적 기록 양식](12-rag/trace-template.md) | 공식 코드의 함수별 입력·출력·다음 호출·미확인 사항 |
| 13 | [검색 오류 실습](13-search/search.mjs), [설정](13-search/config.mjs), [검사](13-search/search.test.mjs) | 실패 기록, 설정 한 줄 수정, 성공 기록, 수정의 한계 |
| 14 | [구조 검토 예제](14-audit/app.mjs), [동작 검사](14-audit/app.test.mjs) | 근거가 있는 개선 1건, 동작을 유지한 수정과 검사 |
| 15 | [가상 학습 기록](15-csv/study.csv), [분석기](15-csv/analyze.mjs), [검사](15-csv/analyze.test.mjs) | 오류 행 목록, 합계·평균·완료율, 재실행 비교 |

## 13강: 일부러 실패하는 검색 설정

```powershell
node --test docs/practice/13-search/search.test.mjs
```

처음에는 기본 설정을 사용하는 검사 **1개가 실패**하고 나머지는 통과해야 합니다. `config.mjs`의 `MAX_RESULTS`를 0에서 5로 바꾼 뒤 같은 명령을 실행하면 모두 통과합니다. 이 예제는 단어 포함 여부로 검색합니다. 실제 강의의 Chroma·벡터 검색·LLM 응답을 구현한 것이 아닙니다.

## 14강: 구조를 고쳐도 결과는 같아야 함

```powershell
node --test docs/practice/14-audit/app.test.mjs
```

처음부터 검사가 통과합니다. `queryRoute`의 입력·출력은 유지하면서 검색과 응답 조립을 분리해 보세요. 파일을 몇 개로 나누었는지가 아니라, 검색 규칙을 HTTP 응답 없이 시험할 수 있는지가 핵심입니다.

## 15강: 빈칸을 0분으로 계산하지 않기

```powershell
node docs/practice/15-csv/analyze.mjs
node --test docs/practice/15-csv/analyze.test.mjs
```

처음에는 전체 6행이 정상으로 집계되고 검사 2개가 실패합니다. 유효성 규칙을 구현하면 정상 3행, 오류 3행, 총 150분, 평균 50분, 완료 2건으로 바뀝니다. 오류 행은 지우지 않고 행 번호와 이유를 반환합니다. 정상 행 중 완료 비율은 2/3입니다. 실제 사용자 학습 기록을 사용하지 않습니다.

실습을 먼저 해 본 뒤에만 [참고 구현](solutions/reference.mjs)을 보세요. 이 파일은 교육용 구현 하나이며 유일한 정답이 아닙니다. `npm test`는 원본 실습의 의도된 실패와 참고 수정의 통과를 별도로 검증합니다.
