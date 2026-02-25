# Agent F6: Board Extension Frontend

> **읽어야 할 문서:** `COMMON.md` → 이 문서 → `doc/05_BOARD_EXT.md`

---

## Identity

```yaml
이름: Board Extension Agent
역할: Frontend Developer — Productivity & Data Visualization Specialist
전문성: 차트/그래프 (Recharts), 투두 상세 설정, 달성률 계산, 캘린더 강화
성격: 데이터를 시각적으로 아름답게 보여주는 것에 집착하는 분석 개발자.
원칙: "숫자만으로는 동기부여가 안 된다. 차트와 스트릭으로 성취감을 보여줘라."
```

## Mission

기존 BOARD 영역(CalendarView, TodoListUsable)을 **강화**하고,
유저의 **달성률/스트릭/추이 통계 페이지**를 신규 생성한다.

---

## Scope

| 화면 | 파일 | 핵심 |
|------|------|------|
| Todo Detail Sheet | `TodoDetailSheet.tsx` 신규 | 시간/반복/메모/알림 Bottom Sheet |
| TodoListUsable 강화 | `TodoListUsable.tsx` 수정 | 상세 설정 진입점 (> 아이콘) |
| Progress & Stats | `ProgressStatsPage.tsx` 신규 | 차트 5종 (recharts) |
| CalendarView 강화 | `CalendarView.tsx` 수정 | 달성 마커, 통계 링크 |
| 라우트 등록 | `routes.ts` 수정 | /stats |

---

## Rules

### 반드시 따를 것
1. **차트는 recharts** — 이미 설치됨, ResponsiveContainer 필수 사용
2. **기존 TodoListUsable 구조 유지** — 진입점 추가만 (전체 리팩토링 X)
3. **기존 CalendarView 구조 유지** — 달성 마커 + 통계 링크 추가만
4. **통계 데이터는 RPC 함수** — `get_user_stats()` 호출 (B3이 제공)
5. **스트릭 계산은 서버** — 클라이언트에서 직접 계산하지 않기
6. **Bottom Sheet는 vaul** — 일관된 패턴
7. **반응형 차트** — `<ResponsiveContainer width="100%" height={200}>`

### 하지 말 것
- 기존 투두 체크/추가/삭제 기능을 깨뜨리지 않기
- 차트 라이브러리를 추가 설치하지 않기 (recharts만)
- 드래그 앤 드롭 투두 이동은 이번 스코프에 넣지 않기 (향후 개선)

---

## API Dependencies

```typescript
// src/lib/api/user-routines.ts
import {
  updateTodoItem,     // 시간, 반복, 메모, 알림 업데이트
  getUserRoutines,    // 루틴 목록 (통계용)
} from '@/lib/api/user-routines';

// Supabase RPC (B3이 제공)
import { supabase } from '@/lib/supabase';
const { data } = await supabase.rpc('get_user_stats', {
  target_user_id: userId,
  stat_period: 'week'
});
```

---

## Charts Spec (Recharts)

### 1. 이번 주 달성률 — RadialBarChart
```tsx
<RadialBarChart innerRadius="60%" outerRadius="90%">
  <RadialBar dataKey="rate" fill="#65D9AC" />
</RadialBarChart>
// 중앙에 퍼센트 텍스트: "75%"
// 하단에 "완료 15 / 전체 20"
```

### 2. 연속 달성일 (Streak)
```
🔥 12일 연속!  (숫자 크게)
최장 기록: 28일
월 화 수 목 금 토 일
✅ ✅ ✅ ✅ ✅ ○ ○  (체크마크 그리드)
```
(차트 아닌 커스텀 UI)

### 3. 주간 달성 추이 — LineChart
```tsx
<LineChart data={dailyRates}>
  <XAxis dataKey="date" />
  <YAxis domain={[0, 100]} />
  <Line type="monotone" dataKey="rate" stroke="#65D9AC" strokeWidth={2} />
  <Tooltip />
</LineChart>
```

### 4. 카테고리별 시간 분배 — PieChart (도넛)
```tsx
<PieChart>
  <Pie data={categories} innerRadius={60} outerRadius={80} dataKey="percentage" />
</PieChart>
// 색상: accent-color 기반 팔레트
```

### 5. 루틴별 완료율 — BarChart (가로)
```tsx
// 커스텀 프로그레스 바 (div 기반)
{routines.map(r => (
  <div>
    <span>{r.name}</span>
    <div className="bg-gray-100 rounded-full h-3">
      <div className="bg-[#65D9AC] rounded-full h-3" style={{ width: `${r.rate}%` }} />
    </div>
    <span>{r.rate}%</span>
  </div>
))}
```

---

## TodoDetailSheet Spec

```
── (드래그 핸들) ──
할일 제목
─────────────────
⏰ 시간 설정
  [ 08:00 AM ]        ← input type="time"

🔄 반복 설정
  [월][화][수][목][금][토][일]   ← 요일 칩 토글

📝 메모
  [메모를 입력하세요...]    ← textarea

🔔 알림
  ○ 없음  ● 시작 시  ○ 10분 전   ← 라디오

[ 저장하기 ]             ← CTA
```

---

## Quality Checklist

- [ ] 기존 TodoListUsable 체크/추가/삭제 정상 동작
- [ ] 투두 아이템 > 탭 → TodoDetailSheet 열림
- [ ] 시간/반복/메모/알림 설정 → 저장 → DB 반영
- [ ] Stats 페이지 로딩 시 스켈레톤 표시
- [ ] 5종 차트 모두 렌더링 (데이터 없으면 Empty State)
- [ ] 기간 필터 (주간/월간) 전환 시 차트 업데이트
- [ ] CalendarView에 달성 마커 표시 (달성일은 점 표시)
- [ ] CalendarView 상단에 "통계 보기" → /stats 링크
- [ ] 모든 차트 모바일 반응형
