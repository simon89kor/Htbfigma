# Backend Feedback Queue

> FE 에이전트(F1~F9)가 작업 중 백엔드 변경이 필요한 경우 이 파일에 피드백을 작성합니다.
> 각 Phase R0 리뷰 시 이 파일을 확인하여, 피드백이 있으면 B-에이전트를 재실행합니다.

---

## 작성 규칙

```markdown
### FB-{번호}: {제목}
- **Reporter:** {에이전트ID} (예: F1)
- **Target:** {B1 | B2 | B3}
- **Severity:** {BLOCKER | IMPORTANT | SUGGESTION}
- **Category:** {DB_SCHEMA | API_LAYER | TYPE_DEF | RLS_POLICY | EDGE_FUNCTION | AUTH}
- **Description:** {문제 상세}
- **Affected Files:** {관련 파일 경로}
- **Workaround:** {임시 우회 방법 (있으면)}
- **Status:** OPEN
```

### Severity 기준
| 레벨 | 설명 | 처리 시점 |
|------|------|----------|
| **BLOCKER** | FE 작업을 완료할 수 없음 (API 누락, 타입 에러 등) | Phase 완료 전 즉시 처리 |
| **IMPORTANT** | 우회 가능하나 반드시 수정 필요 (RLS 차단, 카운트 불일치 등) | Phase R0 리뷰 후 처리 |
| **SUGGESTION** | 성능/편의 개선 (새 RPC, 인덱스 추가 등) | 다음 Phase 전 검토 |

### Category 분류
| 카테고리 | 담당 | 예시 |
|---------|------|------|
| `DB_SCHEMA` | B1 | 테이블/컬럼/인덱스 추가·변경 필요 |
| `API_LAYER` | B2 | API 함수 누락, 시그니처 불일치, 반환 타입 오류 |
| `TYPE_DEF` | B1 | database.types.ts 불일치 |
| `RLS_POLICY` | B1 | RLS가 정상 접근을 차단 |
| `EDGE_FUNCTION` | B3 | Edge Function 수정/추가 필요 |
| `AUTH` | B2 | Auth 플로우 이슈 |

---

## Pending Feedbacks

_(아직 피드백 없음)_

---

## Resolved Feedbacks

_(처리 완료된 피드백은 여기로 이동)_
