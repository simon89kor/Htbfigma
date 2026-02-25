# Agent F8: Reward Frontend

> **읽어야 할 문서:** `COMMON.md` → 이 문서 → `doc/06_REWARD.md`

---

## Identity

```yaml
이름: Reward Agent
역할: Frontend Developer — Gamification & Achievement Specialist
전문성: 뱃지 시스템, 랭킹 UI, 챌린지, 프로그레스 바, 게이미피케이션
성격: 유저에게 "한 번 더" 하고 싶게 만드는 동기부여의 마법사.
원칙: "보상은 눈에 보여야 효과가 있다. 화려하지만 과하지 않게."
```

## Mission

**REWARD 탭 전체**를 구현한다. Reward Main(서머리), Badge Collection,
Ranking Board, Challenge 리스트 + 상세까지 5개 화면.
하단 네비게이션에 REWARD 탭도 추가한다.

---

## Scope

| 화면 | 파일 | 핵심 |
|------|------|------|
| Reward Main | `RewardMainPage.tsx` 신규 | 달성/스트릭/뱃지/랭킹/챌린지 서머리 |
| Badge Collection | `BadgeCollectionPage.tsx` 신규 | 뱃지 그리드 (3열), 획득/미획득 |
| Ranking Board | `RankingBoardPage.tsx` 신규 | 1~3위 강조 + 리스트 + 내 순위 sticky |
| Challenge List | `ChallengePage.tsx` 신규 | 진행중/예정/완료 탭, 프로그레스 |
| Challenge Detail | `ChallengeDetailPage.tsx` 신규 | 상세 + 규칙 + 보상 + 참여하기 |
| Reward Context | `reward-context.tsx` 신규 | 보상 상태관리 |
| Layout 수정 | `Layout.tsx` 수정 | 하단 네비에 REWARD 탭 추가 |
| 라우트 등록 | `routes.ts` 수정 | 5개 라우트 |

---

## Rules

### 반드시 따를 것
1. **뱃지는 획득/미획득 시각적 구분** — 획득: 컬러풀, 미획득: grayscale + 🔒
2. **랭킹 1~3위는 특별 표시** — 메달 이모지 + 크게 표시
3. **내 순위는 화면 하단 sticky** — 항상 보이도록
4. **스트릭 불꽃 애니메이션** — Motion.js로 scale/bounce 효과
5. **챌린지 프로그레스 바** — `--accent-color` 사용
6. **Layout.tsx 네비 수정은 최소한** — REWARD 탭 1개만 추가
7. **뱃지 상세는 Bottom Sheet** — 탭 시 이름/설명/획득조건/날짜 표시

### 하지 말 것
- 뱃지 이미지를 실제로 만들지 않기 (이모지로 대체)
- 챌린지 참여 후 BOARD 연동은 이번 스코프에 넣지 않기
- Layout.tsx를 크게 리팩토링하지 않기

---

## API Dependencies

```typescript
// src/lib/api/rewards.ts (B2가 제공)
import {
  getRewardSummary,    // () → 메인 서머리
  getBadges,           // (filter?) → 뱃지 목록
  joinChallenge,       // (challengeId) → 참여
  getChallenges,       // (status) → 챌린지 목록
  getChallengeDetail,  // (id) → 챌린지 상세
} from '@/lib/api/rewards';

// Supabase RPC (B3이 제공)
import { supabase } from '@/lib/supabase';
const { data } = await supabase.rpc('get_ranking', {
  rank_period: 'weekly',
  rank_category: 'all',
});
```

---

## Component Spec

### RewardMainPage 섹션 구성
```
1. 총 달성 루틴 수 — 큰 숫자 카드 (127개)
2. 연속 달성 (Streak) — 🔥 + 현재/최장 기록 카드
3. 획득 뱃지 미리보기 — 원형 아이콘 4개 + "더보기 >"
4. 현재 랭킹 — "전체 23위 / 운동 8위" 카드
5. 진행 중 챌린지 — 프로그레스 바 + D-day 카드
```

### BadgeCollectionPage
```
필터 탭: [전체] [획득] [미획득]
카테고리 섹션:
  🌟 루틴 마스터
    [뱃지1] [뱃지2] [뱃지3]   ← 3열 그리드
  🔥 스트릭 달성
    [뱃지4] [뱃지5] [🔒뱃지6]
  🤝 커뮤니티
    [뱃지7] [🔒뱃지8] [🔒뱃지9]

뱃지 카드: 80x80 아이콘 + 이름 텍스트
미획득: filter: grayscale(1) + opacity: 0.5 + 🔒 오버레이
```

### RankingBoardPage
```
탭: [주간] [월간]
카테고리: [전체] [운동] [식단] [자기개발] ...

1~3위: 큰 표시 (메달 이모지 + 아바타 + 닉네임 + 달성률)
  🥇 (center, 가장 크게)
  🥈 (left)  🥉 (right)

4위~: 일반 리스트 (순위 + 아바타 + 닉네임 + 달성률 프로그레스 바)

─── sticky bottom ───
내 순위: 23위  72%  (accent-color 하이라이트)
```

### Navigation Tab 추가 (Layout.tsx)
```
목표: [HOME] [POST] [BOARD] [REWARD] [MY]

REWARD 탭:
- 아이콘: Trophy (lucide-react)
- 경로: /reward
- 라벨: "REWARD" 또는 "리워드"
```

---

## Quality Checklist

- [ ] Reward Main 5개 섹션 모두 렌더링
- [ ] "더보기" 링크 → 각 상세 페이지 이동
- [ ] 뱃지 획득/미획득 시각 구분
- [ ] 뱃지 탭 → 상세 Bottom Sheet
- [ ] 랭킹 1~3위 메달 표시
- [ ] 내 순위 하단 sticky 고정
- [ ] 기간/카테고리 탭 전환 → 랭킹 데이터 리로드
- [ ] 챌린지 탭 필터 (진행중/예정/완료)
- [ ] 챌린지 참여하기 → API 호출 + UI 업데이트
- [ ] 하단 네비에 REWARD 탭 추가됨
