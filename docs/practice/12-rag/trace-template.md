# 질문 하나의 RAG 코드 추적

대상: https://github.com/https-deeplearning-ai/starting-ragchatbot-codebase

읽은 날짜 / 대상 브랜치 또는 커밋:

질문: 이 강좌에서 MCP 연결은 어떻게 설명하나요?

| 순서 | 파일·함수 | 받은 값 | 반환값 / 다음 호출 | 코드에서 확인한 사실 | 실행하지 않아 모르는 것 |
|---|---|---|---|---|---|
| 1 | frontend/script.js · sendMessage | | | | |
| 2 | backend/app.py · query_documents | | | | |
| 3 | backend/rag_system.py · query | | | | |
| 4 | backend/ai_generator.py · generate_response | | | | |
| 5 | backend/search_tools.py · execute | | | | |
| 6 | backend/vector_store.py · search | | | | |

`ai_generator`가 항상 검색하는지, 모델이 도구 호출을 요청했을 때 검색하는지 구분한다.

원본 코드에서 `sources`의 자료형은 무엇인가?

출처 제목을 링크로 바꾸려면 어느 위치에서 무엇을 전달해야 하는가?

API 키 없이 확인할 수 있는 것 / 실제 실행이 필요한 것:
