# 初めてのコードベースを短時間で把握する方法

> Claude が `claude-plugin-dashboard` を初見で理解し、"Update All Plugins" 機能の実装計画を立てるまでの全プロセスを記録したドキュメント。

---

## 全体の方法論: ファンネル（漏斗）パターン

```
  ┌─────────────────────────────────────────┐
  │         Step 1: プロジェクト全体像        │  ← 最も広い（ls, package.json, README）
  │    「何のプロジェクト？どんな技術スタック？」  │
  └──────────────────┬──────────────────────┘
                     ▼
       ┌─────────────────────────────┐
       │    Step 2: アーキテクチャ     │  ← 中程度（CLAUDE.md, ディレクトリ構造）
       │  「どこに何がある？設計方針は？」  │
       └───────────┬─────────────────┘
                   ▼
          ┌──────────────────────┐
          │  Step 3: 関連コード   │  ← 狭い（変更が必要なファイル群）
          │ 「既存パターンは？」   │
          └────────┬─────────────┘
                   ▼
            ┌────────────────┐
            │ Step 4: 実装計画 │  ← 最も具体的
            └────────────────┘
```

🎯 **原則: 広い → 狭い → 具体的。最初から特定のファイルに飛び込まない。**

---

## Step 1: プロジェクトの第一印象を掴む

### 1-1. ルートディレクトリの一覧

```bash
ls -la /Users/ryotamurakami/laststance/claude-plugin-dashboard/
```

**🤔 なぜこれが最初か:**
ルートディレクトリを見るだけで、プロジェクトの「種類」がわかる。設定ファイルが語る。

**📊 得られた情報:**

| 発見したファイル/ディレクトリ | 推測                                            |
| ----------------------------- | ----------------------------------------------- |
| `package.json`                | Node.js/JavaScript プロジェクト                 |
| `tsconfig.json`               | TypeScript                                      |
| `source/`                     | ソースコードの場所（`src/` ではなく `source/`） |
| `dist/`                       | ビルド成果物 → コンパイル型（TSからJS）         |
| `.venv/`                      | Python仮想環境 → E2Eテスト？                    |
| `e2e/`                        | E2Eテストがある                                 |
| `.serena/`                    | Serena MCPの設定                                |
| `vitest.config.ts`            | テストフレームワーク = Vitest                   |
| `.husky/`                     | Git フック（品質ゲート）                        |
| `pnpm-lock.yaml`              | パッケージマネージャー = pnpm                   |

**💡 この時点での仮説:** TypeScript + pnpm のCLIツール。テストは充実してそう（Vitest + E2E）。

---

### 1-2. 3つのキーファイルを並列で読む

```
Read package.json    ← 技術スタック + 依存関係
Read CLAUDE.md       ← 開発者ガイド（アーキテクチャ、パターン、ルール）
Read README.md       ← ユーザー向け説明（機能、使い方）
```

**🎯 なぜこの3つか:**

| ファイル                  | 教えてくれること                 | 読む優先度      |
| ------------------------- | -------------------------------- | --------------- |
| `package.json`            | 何で作られているか（技術的事実） | 🔴 最優先       |
| `CLAUDE.md` / `README.md` | なぜこう作られているか（意図）   | 🔴 最優先       |
| メインエントリポイント    | どう動くか（実装）               | 🟡 次のステップ |

**⚡ 重要: この3つは互いに依存しないので並列で読める。**
これだけでプロジェクト理解の約80%が得られる。

#### package.json から得た情報

```json
{
  "name": "@laststance/claude-plugin-dashboard",
  "description": "Interactive CLI dashboard to manage Claude Code plugins",
  "bin": { "claude-plugin-dashboard": "./dist/cli.js" },
  "dependencies": {
    "@reduxjs/toolkit": "^2.11.2", // ← 状態管理 = Redux
    "fullscreen-ink": "^0.1.0", // ← ターミナル全画面
    "ink": "^5.1.0", // ← React for CLI（UIフレームワーク）
    "react": "^18.3.1", // ← React 18
    "react-redux": "^9.2.0", // ← Redux + React統合
    "ts-pattern": "^5.9.0" // ← パターンマッチング
  }
}
```

**🤔 推論チェーン:**

1. `"bin"` フィールドがある → npmパッケージとして配布されるCLIツール
2. `ink` → ターミナルUI は React コンポーネントで構成される
3. `react-redux` → 状態管理は Redux Toolkit（`useState`ではない）
4. `ts-pattern` → switch 文の代わりにパターンマッチング使用
5. `"type": "module"` → ESM（`import/export`、`.js` 拡張子必須）

#### CLAUDE.md から得た情報

最も価値が高かったセクション:

```
Architecture:
Entry: source/cli.tsx → source/app.tsx
Directories: components/ → tabs/ → services/ → types/
```

**🎯 これで全体の構造が見えた:**

```
cli.tsx (CLIパース)
  └── app.tsx (メインコンポーネント、1518行)
        ├── components/  (再利用可能UIコンポーネント)
        ├── tabs/        (タブビュー: Enabled, Installed, Discover...)
        ├── services/    (ビジネスロジック: plugin操作, 設定管理)
        ├── store/       (Redux slices)
        └── types/       (TypeScript型定義)
```

#### README.md から得た情報

- 5つのタブ: Enabled, Installed, Discover, Marketplaces, Errors
- キーバインド一覧（`i`=install, `u`=uninstall, `Space`=toggle）
- `~/.claude/` 配下の設定ファイルを読み書きする
- `claude plugin install/uninstall` をサブプロセスで実行する

**💡 この時点で分かったこと:**

> 「`claude plugin update` も同じサブプロセスパターンで追加できるはず」

---

## Step 2: ソースコードのマップを作る

### 2-1. 全ソースファイルの一覧

```bash
Glob: source/**/*.{ts,tsx}
```

**🤔 なぜか:** ファイル名とディレクトリ構造から、各ファイルの役割を推測する。

**📊 結果:** 69ファイル（テスト含む）。主要な構成:

```
source/
├── app.tsx                        # メインコンポーネント（1518行）
├── cli.tsx                        # CLIエントリポイント
├── components/
│   ├── PluginList.tsx             # プラグイン一覧
│   ├── PluginDetail.tsx           # プラグイン詳細パネル
│   ├── ConfirmDialog.tsx          # 確認ダイアログ（Y/N）
│   ├── HelpOverlay.tsx            # ヘルプオーバーレイ
│   ├── KeyHints.tsx               # キーヒント表示
│   ├── SearchInput.tsx            # 検索バー
│   ├── TabBar.tsx                 # タブバー
│   └── ...
├── tabs/
│   ├── EnabledTab.tsx             # 有効タブ
│   ├── InstalledTab.tsx           # インストール済みタブ
│   ├── DiscoverTab.tsx            # 発見タブ
│   └── ...
├── services/
│   ├── pluginActionsService.ts    # ★ install/uninstall のサブプロセス実行
│   ├── pluginService.ts           # プラグインデータ読み込み
│   ├── settingsService.ts         # 設定ファイル管理
│   └── marketplaceActionsService.ts
├── store/slices/
│   ├── pluginSlice.ts             # ★ プラグイン状態管理
│   ├── uiSlice.ts                 # UI状態管理
│   └── marketplaceSlice.ts
└── types/
    └── index.ts                   # ★ 全型定義
```

**🎯 ★印のファイルが「Update All」機能に直接関係する。** これは次のステップで読む。

### 2-2. Git履歴の確認

```bash
git log --oneline -20
git status
```

**🤔 なぜか:**

- 最近何が変更されたか → プロジェクトの現在の方向性がわかる
- コミットメッセージのスタイル → 後でコミットする時の参考
- working tree の状態 → 進行中の作業があるか確認

**📊 得た情報:**

- 最新コミット: `refactor: migrate useReducer to Redux Toolkit` → Redux Toolkit移行は最近
- クリーンなワーキングツリー → 安全に作業開始できる
- バージョン 0.3.0 → まだ初期段階

---

## Step 3: 機能に関連するコードを深く読む

### 3-1. 「最も近い既存機能」を特定する

**🎯 原則: 新機能を追加する時は、最も似ている既存機能のコードをトレースする。**

> 「Update All Plugins」に最も近い既存機能 = 「Install Plugin」

なぜなら:

- 両方とも `claude plugin <action> <id>` をサブプロセスで実行する
- 両方とも非同期操作で、進捗表示が必要
- 両方とも完了後にプラグイン一覧をリロードする

### 3-2. サービス層を読む（pluginActionsService.ts: 82行）

```typescript
// source/services/pluginActionsService.ts

function executePluginAction(
  action: 'install' | 'uninstall', // ← ここに 'update' を追加するだけ
  pluginId: string,
): Promise<PluginActionResult> {
  return new Promise((resolve) => {
    const child = spawn('claude', ['plugin', action, pluginId], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    })
    // ... stdout/stderr集約 → resolve
  })
}
```

**🤔 分析:**

- `executePluginAction` は汎用的に作られている
- action パラメータの union 型に `'update'` を追加するだけで動く
- `spawn('claude', ['plugin', 'update', pluginId])` が実行される
- 82行しかない小さなファイル → 変更の影響範囲が限定的

**💡 洞察:** よく設計されたコードは、新機能の追加が最小限の変更で済む。
このファイルは Open-Closed Principle を体現している。

### 3-3. 型定義を読む（types/index.ts: 434行）

読むべきポイントを事前に絞る:

- `Plugin` 型 → プラグインのデータ構造
- `AppState` 型 → アプリケーション状態の全体像
- `Action` 型 → Reducer のアクション定義

```typescript
// Plugin型の重要フィールド
interface Plugin {
  id: string // "name@marketplace" 形式
  name: string
  marketplace: string
  isInstalled: boolean
  isEnabled: boolean
}

// AppState の operation 関連
operation: 'idle' | 'installing' | 'uninstalling' // ← 'updating' 追加が必要
operationPluginId: string | null
```

**🤔 分析:**

- `Plugin.id` = `"name@marketplace"` 形式 → これが `claude plugin update` に渡すID
- `operation` フィールドで現在の操作を追跡 → UI がこれを見てローディング表示
- `operationPluginId` で操作中のプラグインを特定 → 進捗表示に使える

### 3-4. Redux Slice を読む（pluginSlice.ts: 239行）

```typescript
export type PluginOperation = 'idle' | 'installing' | 'uninstalling'
// ↑ ここに 'updating' を追加

// startOperation / endOperation パターン
startOperation: (state, action) => {
  state.operation = action.payload.operation
  state.operationPluginId = action.payload.pluginId
},
endOperation: (state) => {
  state.operation = 'idle'
  state.operationPluginId = null
},
```

**🎯 決定:** 新しい Reducer は不要。既存の `startOperation` / `endOperation` を
`'updating'` でそのまま使える。Redux の変更は型の追加だけ。

### 3-5. app.tsx の該当箇所だけを読む（1518行中の一部）

**⚡ 重要: 1518行のファイルを全部読まない。Grep で必要な箇所だけ特定する。**

```bash
Grep: pattern="useInput|install|uninstall|operation" path="source/app.tsx"
```

これで関連する行番号がわかる → その周辺だけを Read する。

#### 読んだ箇所1: ハンドラ関数（591-634行）

```typescript
async function handleInstall(pluginId: string) {
  dispatch(startOperation({ operation: 'installing', pluginId }))
  const result = await installPlugin(pluginId)
  dispatch(endOperation())
  if (result.success) {
    const plugins = loadAllPlugins()
    dispatch(setPlugins(plugins))
    dispatch(setMessage(`✅ ${result.message}`))
  } else {
    dispatch(setMessage(`❌ ${result.message}...`))
  }
}
```

**🤔 分析:** 完全にパターン化されている:

1. `dispatch(startOperation(...))` → UI をローディング状態に
2. `await serviceFunction(id)` → 実際の操作
3. `dispatch(endOperation())` → ローディング解除
4. 結果に応じてメッセージ表示 + データリロード

**💡 `handleUpdateAll()` もこのパターンに従うべき。ただし複数プラグインをループで処理。**

#### 読んだ箇所2: キーバインド定義（useInput コールバック）

Grep の結果から、キーバインドのパターンを把握:

- `input === 'i'` → install
- `input === 'u'` → uninstall（enabled/installed/discover タブ）
- タブ条件: `state.activeTab === 'installed' || state.activeTab === 'enabled'`

**🎯 決定:** `input === 'U'` (大文字) で "Update All" を発動。
既存の `u` (小文字) = uninstall と衝突しない。

### 3-6. UI層の確認（HelpOverlay.tsx, KeyHints.tsx）

ヘルプオーバーレイとキーヒントにも `U` を追加する必要がある。
これは既存のエントリのパターンに合わせるだけ。

---

## Step 4: 情報の統合 → 実装計画

### 4-1. 「パターンマッチング」で計画を立てる

全ファイルを読んだ後、実装計画は **既存パターンの拡張** として自然に出てくる:

| 既存パターン                                      | 新機能での適用                      |
| ------------------------------------------------- | ----------------------------------- |
| `executePluginAction('install', id)`              | `executePluginAction('update', id)` |
| `PluginOperation = 'idle' \| 'installing' \| ...` | `+ 'updating'`                      |
| `handleInstall(pluginId)`                         | `handleUpdateAll()`                 |
| `input === 'i'` → install                         | `input === 'U'` → update all        |
| `ConfirmDialog` for uninstall                     | `ConfirmDialog` for update all      |
| `setMessage('✅ Installed...')`                   | `setMessage('✅ Updated 5/5...')`   |

### 4-2. 新しく設計が必要な部分

既存パターンにない唯一の新要素: **複数プラグインの逐次処理と進捗表示**

```typescript
// 設計方針: 逐次実行（並列ではない）
async function handleUpdateAll() {
  const installed = plugins.filter((p) => p.isInstalled)
  for (let i = 0; i < installed.length; i++) {
    dispatch(
      setMessage(
        `Updating (${i + 1}/${installed.length}): ${installed[i].name}...`,
      ),
    )
    dispatch(
      startOperation({ operation: 'updating', pluginId: installed[i].id }),
    )
    await updatePlugin(installed[i].id)
    dispatch(endOperation())
  }
  dispatch(setMessage(`✅ Updated ${installed.length} plugins`))
}
```

**🤔 なぜ並列ではなく逐次か:**

1. `claude` CLI が並列実行を想定していない可能性
2. 進捗表示が「2/5処理中」のように明確になる
3. エラーが起きた時にどのプラグインで止まったかわかる

---

## まとめ: 速くコードを理解するための原則

### 🔴 絶対にやること

| 原則                            | 理由                                                            |
| ------------------------------- | --------------------------------------------------------------- |
| **ルートから始める**            | `ls` → `package.json` → `README` の順で全体像を掴む             |
| **並列で読む**                  | 独立した情報源は同時に読む（package.json + README + CLAUDE.md） |
| **Grep > Read for large files** | 1518行を全部読まない。パターンで検索して必要箇所だけ読む        |
| **最も近い既存機能をトレース**  | 新機能は既存パターンの拡張。ゼロから設計しない                  |
| **型定義を読む**                | 型がドメインモデルの真実。コメントより正確                      |

### 🟡 効率を上げるコツ

| テクニック                         | 説明                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------- |
| **ファンネルパターン**             | 広い → 狭い → 具体的。最初からコードに飛び込まない                         |
| **3ファイルキックスタート**        | `package.json` + `CLAUDE.md/README` + メインエントリ = 80%の理解           |
| **Git履歴で方向性把握**            | `git log --oneline -20` で最近の開発の流れがわかる                         |
| **ファイルサイズで読み方を変える** | 82行 → 全部読む。1518行 → Grepで必要箇所だけ                               |
| **名前からの推測→検証**            | `pluginActionsService.ts` → 「install/uninstallの実行」と推測 → 読んで検証 |

### 🟢 避けるべきこと

| アンチパターン               | 問題                                               |
| ---------------------------- | -------------------------------------------------- |
| 最初から特定のファイルを読む | 全体像なしでは読んでも理解できない                 |
| 全ファイルを順番に読む       | 時間の無駄。関連ファイルだけ読む                   |
| 既存パターンを無視して設計   | コードベースに合わないものが出来上がる             |
| 型定義を後回しにする         | ドメインモデルを知らずにコードを読んでも意味がない |

---

## 実際のツール使用ログ（時系列）

```
[0:00] ls -la                          → プロジェクト種別の特定
[0:01] Read package.json               ┐
[0:01] Read CLAUDE.md                  ├→ 3ファイル並列読み（80%の理解）
[0:01] Read README.md                  ┘
[0:02] Glob source/**/*.{ts,tsx}       → 69ファイルのマップ作成
[0:02] git log --oneline -20           ┐
[0:02] git status                      ├→ プロジェクト状態の確認（並列）
                                       ┘
[0:03] Read pluginActionsService.ts    ┐
[0:03] Read types/index.ts            ├→ 機能の核心部分を並列読み
[0:03] Read pluginSlice.ts            ┘
[0:04] Grep app.tsx (パターン検索)      → 1518行から関連箇所を特定
[0:04] Read app.tsx:585-663            → ハンドラ関数パターンの理解
[0:05] Read uiSlice.ts                → メッセージ表示パターンの理解
[0:06] → 実装計画の策定完了
```

**⚡ 合計約6分。69ファイル中、実際に読んだのは10ファイル以下。**
**⚡ 1518行のメインファイルは、全体の5%程度しか読んでいない。**

---

_Generated by Claude — 2026-03-12_
