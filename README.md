# QANDA 튜터 PWA

콴다과외 튜터용 모바일 PWA. 마이페이지 + 교재 검색 + 인기 교재 카탈로그.

## 기술 스택

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Router**: react-router-dom v7
- **PWA**: vite-plugin-pwa (manifest + service worker 자동)
- **Backend**: Express (CommonJS) — 검색 프록시
- **External**: 네이버 책 검색 API + Google Sheets (공개 CSV) 계약 확인

## 페이지

| 경로 | 컴포넌트 | 설명 |
|---|---|---|
| `/` | `HomePage` | 마이페이지 — 프로필 카드 + 4×2 메뉴 그리드 |
| `/search` | `TextbookSearchPage` | 교재 검색 — 디바운스 입력 + 결과 드롭다운 |
| `/popular?cat=<key>` | `PopularBooksPage` | 인기 교재 — 카테고리 사이드바 + 슬라이드 picker |

## 셋업

```bash
npm install
cp .env.example .env   # .env에 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 채우기
npm run dev            # web(5173) + api(3001) 동시 실행
```

네이버 API 키는 https://developers.naver.com/apps/#/list 에서 발급.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | Vite + Express 동시 실행 (concurrently) |
| `npm run dev:web` | Vite만 실행 |
| `npm run dev:api` | Express만 실행 |
| `npm run build` | 프로덕션 빌드 (tsc + vite build) |
| `npm run preview` | 빌드 결과 미리보기 |

## 검색 동작

1. 사용자 입력 → 600ms 디바운스 → `/api/naver-book-search?query=...`
2. 백엔드: 네이버 책 검색 → 출판사 화이트/블랙리스트 분류
   - `restricted` (비상교육 등) → "사용 불가"
   - `contract-check` (쎄듀 등) → Google Sheets `bookcontract` ISBN 매칭
     - `ALLOWED` → "사용 가능"
     - `DENIED` / `EXPIRED` → "사용 불가"
     - `NOT_FOUND` → "계약 확인 필요"
   - `allowed` → "사용 가능"
   - `not-allowed` (기타) → 응답에서 제외
3. 결과 카드(표지+제목+출판사+ISBN+상태 배지) 리스트
4. "사용 가능" 카드 탭 → 네이버 검색 새 탭

## 인기 교재 페이지

- 좌측 카테고리(상시): 자습서/평가문제집/단어장/유형서/기출문제집/모의고사
- 가운데 picker(슬라이드 오버레이):
  - 데스크탑: 좌측 카테고리에 hover → 슬라이드 in
  - 모바일: breadcrumb 칩 탭 → 슬라이드 in
  - 학년 선택 시 자동 닫힘
  - backdrop 탭으로 닫힘
- 본문: 카테고리/레벨/과목/학년에 따른 책 10개 (현재 더미 데이터)

## 디렉터리

```
qanda-tutor-pwa/
├── public/              # PWA 아이콘, favicon
├── scripts/             # 빌드 보조 스크립트 (PWA 아이콘 생성)
├── server/              # Express API 서버
│   ├── index.cjs        # 라우트 정의
│   └── publisherRules.cjs # 출판사 분류 규칙
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   └── TopBar.tsx
│   ├── lib/
│   │   └── bookSearch.ts
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── TextbookSearchPage.tsx
│   │   └── PopularBooksPage.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vite.config.ts       # Vite + PWA 플러그인 + /api proxy
├── tailwind.config.js
└── package.json
```

## TODO

- [ ] 인기 교재 더미 데이터 → 실제 DB(Supabase 등) 연결
- [ ] 어드민 페이지(CSV 업로드 + 자동 표지 채우기)
- [ ] 표지 이미지 자체 호스팅(Supabase Storage / R2)
- [ ] 마이페이지 메뉴 항목별 실제 페이지 구현
- [ ] PWA 아이콘 정식 디자인 적용 (현재 단색 placeholder)
