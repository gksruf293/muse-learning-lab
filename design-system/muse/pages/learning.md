# Muse 학습 화면 적용 기준

2026-10-02 · index.html / guide.html / assets/style.css / assets/app.mjs

## 출처와 선택

- 적용 스킬: [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), 커밋 `09170eec67eefd46a7ae85de61b40c194020f997`.
- 프로젝트 설치 경로: `.agents/skills/ui-ux-pro-max/`; MIT 원문과 출처를 함께 보관한다.
- 최초 질의 `education learning journal content-first`는 어린이 교육·Claymorphism으로 연결되어 채택하지 않았다.
- 한 차례 좁힌 질의 `knowledge base reading editorial`의 Minimalism & Swiss Style / 문서 중심 추천을 검토한 뒤 MASTER.md로 저장했다.
- 보조 UX 질의: `error summary validation`, `focus not obscured`, `heading long token wrapping`.
- 실제 구현은 HTML / CSS / JavaScript ES modules다. 스킬의 특정 프레임워크 예제를 이식하지 않는다.
- 다음 명령으로 추천의 출발점을 재현할 수 있다: `python .agents/skills/ui-ux-pro-max/scripts/search.py "knowledge base reading editorial" --design-system -p Muse -f markdown`.

## MASTER.md에 대한 프로젝트 예외

- 한국어 본문은 기존 Pretendard를 유지한다. Atkinson Hyperlegible의 영문 중심 추천으로 한국어 글꼴을 대체하지 않는다.
- 지식 베이스의 검색·읽기·명확한 상태 표시는 사용하되, FAQ 랜딩의 영업용 CTA·후기·지원 문의 섹션은 추가하지 않는다.
- 연한 슬레이트 배경 `#F8FAFC`, 흰 문서 카드, 본문 `#1E293B`, 보조문 `#475569`, 링크·주 행동 `#2563EB`를 사용한다.
- 본문 17px / 줄 간격 1.85 / 최대 38em; 제목은 자연스럽게 균형 잡아 줄을 나누며 강제 줄바꿈을 사용하지 않는다.
- 다크 모드는 기존 OS 설정 연동을 유지하고 별도 대비 색을 사용한다.
- hover는 색 변화만 180ms; 콘텐츠 위치를 움직이지 않으며 감소된 모션 설정을 존중한다.
- 44 CSS px 높이는 웹 조작 편의를 위한 선택이다. 스킬의 네이티브 pt/dp 규칙을 웹의 법적 필수 요건처럼 설명하지 않는다.

## 학습과 탐색

- 5분 목표 → 20분 원문·핵심 설명 → 20분 실습 → 15분 답변의 실제 배치를 일치시킨다.
- 검색은 제목·분야·목표를 함께 찾고 여러 단어는 모두 일치해야 한다. 검색 중 본문·초안을 다시 만들지 않는다.
- 넓은 화면은 검색 가능한 강의 목록, 860px 이하에서는 같은 검색 결과를 네이티브 강의 선택 상자로 제공한다.
- 검색 결과 밖의 현재 강의는 유지하고 선택 상자에 명시한다. 검색 결과 수를 완료율이나 진척도로 표현하지 않는다.
- 강의 선택은 URL에 남기고 브라우저 뒤로 가기를 지원한다. 답변은 기존 강의·한국시간 날짜별 초안으로 복원한다.

## 입력·가독성

- 필수/선택을 글자로 표시한다. 제출 실패 시 입력값을 유지하고 위쪽의 포커스 가능한 오류 요약 및 입력별 오류를 함께 제공한다.
- 오류 요약의 링크는 실제 입력으로 이동한다. `aria-invalid`와 기존 힌트를 보존한 `aria-describedby`를 사용한다.
- 모든 조작에 키보드 포커스를 보여 주고 고정 헤더 아래 여백을 확보한다. 모바일 완료 막대는 고정하지 않아 키보드 공간을 막지 않는다.
- 긴 URL·기술명·리뷰 문장은 줄바꿈하고, grid/flex 텍스트는 줄어들 수 있게 한다. 코드만 블록 안에서 가로 스크롤한다.
- 저장·리뷰 상태는 실제 상태를 표시한다. 공개 페이지에서 GitHub 최종 저장을 누르기 전에는 저장 완료라고 쓰지 않는다.
- 학습 자료·질문·평가 기준·공개 저장 형식·PC CLI 연동을 디자인을 위해 축약하거나 변경하지 않는다.

## 검수 범위

자동 검사와 실제 브라우저 결과는 `handoff/VERIFICATION.md`에 남긴다. 개별 대비·키보드·화면 폭 검사 통과를 전체 WCAG 인증으로 표현하지 않는다. 실제 사용자 답변이나 외부 Issue를 검수용으로 생성하지 않는다.
