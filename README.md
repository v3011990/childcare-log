# 3 分鐘育兒紀錄

手機優先的育兒生活紀錄 PWA。每天約 3 分鐘，記下孩子當天由誰照顧、做了哪些事、狀況如何，以及必要時的重要事件與費用。

所有資料只存在使用者自己的瀏覽器（IndexedDB），沒有帳號、沒有後端、沒有任何分析或追蹤程式。

## 開發

```bash
npm install
npm run dev        # 本機開發
npm run typecheck  # TypeScript 檢查
npm run lint       # oxlint
npm run test       # Vitest（含 UI 測試）
npm run build      # 產出 dist/（含 PWA service worker）
npm run preview    # 預覽 production build
```

## 技術

React 19、TypeScript、Vite、Tailwind CSS v4、React Router（hash router）、Dexie.js / IndexedDB、Zod、date-fns、vite-plugin-pwa。測試用 Vitest + React Testing Library + fake-indexeddb。

## 資料模型

一個孩子每一天最多一筆 `CareRecord`，由 `records` 表的 `&[childId+date]` 唯一複合索引保證。

```
CareRecord
  date             YYYY-MM-DD（裝置當地日期，不做 UTC 轉換）
  primaryCaregiver 今天的主要照顧者
  activities       [{ activity, caregiver }]，勾選時預設帶入主要照顧者
  childStatus      孩子狀況（可複選，「正常」與其他互斥）
  caregiverNotes   以照顧者為 key 的自由文字
  importantEvents  重要事件標籤，選了才展開文字欄位
  expenses         同一天可多筆
  createdAt / updatedAt / schemaVersion
```

與最初 SPEC §6 的差異：`fatherCareNote` / `motherCareNote` 改為 `caregiverNotes`（讓外婆、爺爺奶奶也能被記錄），`expense` 改為 `expenses`，並新增 `importantEvents` 與 `schemaVersion`。匯入備份時仍可讀入舊形狀的資料（見 `src/lib/validation.ts` 的 `legacyCareRecordSchema`），CSV 匯出仍保留「爸爸照顧紀錄／媽媽照顧紀錄」欄位。

## 資料可靠度

- 儲存時保留 `createdAt`，只更新 `updatedAt`。
- 使用者寫的「約晚上」這類描述原樣保留，不做正規化。
- 沒有填寫的照顧行為不會被推測或補值；統計只呈現次數，不做評分或排名。
- 從 IndexedDB、表單或匯入檔進入 domain model 的資料一律經過 Zod 驗證；備份格式不符時顯示訊息而不是 crash。
- 完全空白的一天不會建立資料列。

## 備份

設定頁可以匯出 JSON（完整資料，含 metadata）與 CSV（UTF-8 BOM，Excel / Google Sheets 可直接開）。匯入會取代這台裝置上的現有資料，動作前會先確認。

清除瀏覽器網站資料會一併清掉紀錄，請定期匯出備份。
