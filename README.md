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
  activities       [{ activity, caregivers[] }]，勾選時預設帶入主要照顧者，可再加人
  childStatus      孩子狀況（可複選，「正常」與其他互斥）
  caregiverNotes   以照顧者為 key 的自由文字
  importantEvents  重要事件標籤，選了才展開文字欄位
  expenses         同一天可多筆
  createdAt / updatedAt / schemaVersion
```

Today 頁可以切換日期回頭補記（`‹ ›` 或點日期叫出系統日曆）。未來日期一律不開放——還沒發生的照顧行為不該先被記下來（SPEC §16.5）。補記時 `date` 是被記錄的那一天，`createdAt` 仍是實際輸入的時間，紀錄詳細頁兩者都看得到，所以補記不會被誤認成當天寫的。

與最初 SPEC §6 的差異：`fatherCareNote` / `motherCareNote` 改為 `caregiverNotes`（讓外婆、爺爺奶奶也能被記錄），`expense` 改為 `expenses`，`activities[].caregiver` 改為 `caregivers` 陣列（同一項活動可能多人協助），並新增 `importantEvents` 與 `schemaVersion`。匯入備份與讀取舊資料時都能吃下舊形狀（見 `src/lib/validation.ts` 的 `legacyCareRecordSchema`），CSV 匯出仍保留「爸爸照顧紀錄／媽媽照顧紀錄」欄位。

活動項目共 13 項：早晨準備、送托／送學、接托／接學、吃飯／餵食、泡奶／餵奶、副食品、換尿布、餵藥、陪玩、外出活動、洗澡／清潔、哄睡、夜間照顧。要增減項目改 `src/types/common.ts` 的 `CareActivity` 與 `src/lib/constants.ts` 的三張對照表即可，新增是向後相容的（列舉值只能追加，不能改名或刪除）。

## Schema 版本

- **v1**：活動只記一位照顧者（`caregiver`）。
- **v2**：活動改記多位照顧者（`caregivers`），新增泡奶、副食品、換尿布、餵藥、外出活動。

升級由 `src/db/migrations.ts` 的 Dexie v2 `upgrade()` 自動完成，只把既有值搬進陣列，不新增也不刪除任何照顧者，`createdAt` 不變。即使升級因故沒跑到，repository 讀取時也會用相容 schema 把舊格式轉過來，舊紀錄不會消失。

## 資料可靠度

- 儲存時保留 `createdAt`，只更新 `updatedAt`。
- 使用者寫的「約晚上」這類描述原樣保留，不做正規化。
- 沒有填寫的照顧行為不會被推測或補值；統計只呈現次數，不做評分或排名。
- 從 IndexedDB、表單或匯入檔進入 domain model 的資料一律經過 Zod 驗證；備份格式不符時顯示訊息而不是 crash。
- 完全空白的一天不會建立資料列。

## 備份（只用 CSV）

備份格式只有一種：CSV（UTF-8 加 BOM，Excel / Google 試算表可直接開）。同一份檔案既是給人看的表格，也是唯一的還原來源，所以每個欄位都設計成可逆：

- 重要事項的「標籤」與「說明」各自成欄。
- 每位照顧者的紀錄各自成欄（媽媽／爸爸／外婆／外公／奶奶／爺爺／其他照顧紀錄）。
- 活動欄位填參與者，多人以頓號並列；所有標籤本身都不含頓號。
- 費用明細每筆一行，格式 `類別|金額|付款人|備註`；備註在最後一段，即使含有 `|` 也能正確還原。
- 「費用」與「付款人」是方便閱讀的衍生欄位，匯入時忽略並由明細重算。
- 「建立時間」「最後修改」原樣帶進帶出。

匯入以 (childId, date) 為鍵合併：檔案裡有的日期覆寫現有紀錄（沿用原 `id`、保留較早的 `createdAt`），檔案裡沒有的日期保留不動。要完整還原成某份備份，先「清除所有資料」再匯入。孩子名稱不在 CSV 裡，清除後會回到預設值。

任何一列有無法辨識的內容（日期格式錯誤、不認得的照顧者、費用明細格式不符、日期重複）就整份不匯入，並回報是第幾列、哪一欄。

清除瀏覽器網站資料會一併清掉紀錄，請定期匯出備份。
