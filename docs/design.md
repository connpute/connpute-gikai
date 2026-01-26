# connpute-gikai 設計書

## AI議会式意思決定システム

**バージョン:** 0.1.0
**作成日:** 2026-01-27
**ステータス:** 設計完了・実装前

---

## 1. 概要

### 1.1 目的

複数のAIモデルを「議員」として並列実行し、議会形式で議論・採決を行う意思決定システム。
単一のAI（Claude Code）が中立な「議長」として議事を進行し、異なるAIモデルが所属する「党」の立場から意見を述べることで、多角的な視点からの意思決定を実現する。

### 1.2 設計方針

- **ハイブリッド構成**: 議長 = AI Agent (Claude Code)、議員 = 各社APIの直接呼び出し
- **コスト効率**: 議長はClaude Code Proライセンス内、議員は安価なAPIモデルを使用
- **多様性**: 異なるプロバイダのモデルを混在させ、推論スタイルの自然な差を活用
- **柔軟性**: YAML設定ファイルで党・議員・モデル・議事規則を変更可能

### 1.3 コンセプト図

```
┌─────────────────────────────────────────────────────┐
│              議長 (Speaker)                           │
│         Claude Code (Opus 4.5)                       │
│         Pro ライセンス - 追加コストなし                 │
│                                                       │
│  ┌─────────────┐  ┌──────────┐  ┌────────────┐      │
│  │ 議題管理     │  │ 発言管理  │  │ 採決管理    │      │
│  │ Agenda Mgr   │  │ Floor Ctl │  │ Vote Tally  │      │
│  └─────────────┘  └──────────┘  └────────────┘      │
└────────────────────┬────────────────────────────────┘
                     │ 議題を配布 / 発言を収集
     ┌───────────────┼───────────────┬──────────────┐
     ▼               ▼               ▼              ▼
┌─────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ 革新党   │   │ 安定党    │   │ 実用党    │   │ 自由党    │
│ (2名)   │   │ (2名)    │   │ (1名)    │   │ (1名)    │
├─────────┤   ├──────────┤   ├──────────┤   ├──────────┤
│GPT-5    │   │Claude    │   │Gemini    │   │DeepSeek  │
│ nano    │   │ Haiku    │   │2.0 Flash │   │ V3       │
│Grok 4.1 │   │Ollama    │   │          │   │          │
│ Fast    │   │(Llama 3) │   │          │   │          │
└─────────┘   └──────────┘   └──────────┘   └──────────┘
```

---

## 2. アーキテクチャ

### 2.1 システム構成

```
Node.js オーケストレーター
├── 議会セッション管理 (Parliament)
├── 議長AI呼び出し (Speaker) ─── claude --print (CLI)
├── 議員API呼び出し (Members) ─── 各社REST API
├── 議事進行制御 (Protocol)
├── 議事録管理 (Records)
└── 設定管理 (Config) ─── YAML
```

### 2.2 議長 = Claude Code (Agent)

議長は Claude Code CLI (`claude --print`) 経由で呼び出す。
Pro ライセンス ($20/月) 内で動作するため、追加のAPIコストは発生しない。

**議長にAgentが必要な理由:**

| 議長の役割 | 必要な能力 | Claude Code での実現方法 |
|---|---|---|
| 各議員へ議題を配布し発言を収集 | 並列プロセス実行 | `bash` / `Task` ツール |
| 発言を集約・論点を整理 | 高品質な推論・要約 | Opus 4.5 の推論能力 |
| 議事進行の制御 | 条件分岐・ループ | Agent的なフロー制御 |
| 議事録の保存 | ファイルI/O | `Write` / `Edit` ツール |
| 採決の集計・最終決定 | 構造化された判断 | Opus 4.5 + コード実行 |

### 2.3 議員 = API直接呼び出し

議員の役割は「与えられた議題について、党の立場から意見を述べる」テキスト入出力処理。
Agentの能力（ファイルI/O、コード実行）は不要なため、API直接呼び出しが最適。

**API呼び出しの利点:**
- 1発言 = 1 APIコールでコスト最小
- `system prompt` で党の綱領を完全制御
- `temperature` 等のパラメータで発言のバリエーションを調整可能
- 安価なモデルを戦略的に混在可能
- 出力フォーマットを統一しやすい

### 2.4 コンテキスト管理

議長（オーケストレーター）が各議員に提供するコンテキストを制御する。

```
各議員へのAPI呼び出し時に渡すもの:
┌──────────────────────────────────────┐
│ 1. system prompt = 党の綱領 (固定)     │
│ 2. 今回の議題                         │
│ 3. 議事録の関連部分 (前ラウンドの要約)   │
│ 4. 今回答えるべき質問/論点             │
└──────────────────────────────────────┘
```

議長が各議員に見せるコンテキストを戦略的に制御できる点がAgentベースより優位：
- 反論ラウンドでは、対立する党の意見だけを提示
- 修正案ラウンドでは、全党の論点一覧を提示

### 2.5 ディレクトリ構成

```
connpute-gikai/
├── src/
│   ├── index.ts                 # エントリーポイント (CLI)
│   ├── orchestrator/
│   │   ├── parliament.ts        # 議会セッション管理
│   │   ├── speaker.ts           # 議長 (Claude Code 呼び出し)
│   │   └── floor.ts             # 発言フロー制御
│   ├── members/
│   │   ├── member.ts            # 議員の基底インターフェース
│   │   ├── adapters/
│   │   │   ├── anthropic.ts     # Claude Haiku API
│   │   │   ├── openai.ts        # GPT-4o mini / GPT-5 nano
│   │   │   ├── google.ts        # Gemini Flash API
│   │   │   ├── deepseek.ts      # DeepSeek API
│   │   │   ├── xai.ts           # Grok API
│   │   │   └── ollama.ts        # ローカルLLM (Ollama)
│   │   └── factory.ts           # アダプタ生成
│   ├── parties/
│   │   ├── party.ts             # 党の定義
│   │   └── manifesto/           # 各党の綱領 (システムプロンプト)
│   │       ├── innovation.md    # 革新党
│   │       ├── stability.md     # 安定党
│   │       ├── pragmatic.md     # 実用党
│   │       └── liberty.md       # 自由党
│   ├── protocol/
│   │   ├── agenda.ts            # 議題管理
│   │   ├── debate.ts            # 討論ラウンド制御
│   │   ├── vote.ts              # 採決ロジック
│   │   └── rules.ts             # 議事規則
│   ├── records/
│   │   ├── minutes.ts           # 議事録管理
│   │   └── transcript.ts        # 全文記録
│   └── config/
│       ├── parliament.yaml      # 議会構成設定
│       └── models.yaml          # モデル設定
├── records/                     # 議事録出力ディレクトリ
├── docs/
│   └── design.md                # 本設計書
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 3. 党派システム

### 3.1 意見分化の仕組み

同じ議題に対して異なる意見を生成するために、2つの軸で多様性を確保する:

**軸1: システムプロンプト（党の綱領）** → 意見の **方向性** を制御
**軸2: モデルの特性差** → 推論 **スタイル** の自然な違いを活用

システムプロンプトだけでも意見の分化は可能だが、同じモデルに異なるプロンプトを与えた場合、推論パターンや語彙選択が似通いやすい。
異なるモデルを混ぜることで、論理の組み立て方自体が変わる。

### 3.2 デフォルト党派構成

| 党 | モデル | 割り当て理由 |
|---|---|---|
| **革新党** | GPT-5 nano, Grok 4.1 Fast | OpenAIモデルは新技術に楽観的傾向。Grokは率直で大胆な意見を出す傾向 |
| **安定党** | Claude Haiku 3.5, Ollama (Llama 3) | Claudeは慎重でリスクに敏感。ローカルLLMは最新技術への言及が控えめ |
| **実用党** | Gemini 2.0 Flash | Google系はWeb上の実務情報を豊富に学習、実用的・バランス重視 |
| **自由党** | DeepSeek V3 | 学習データとアライメントが他と大きく異なり、予測不能な多様性を提供 |

> **注意:** モデル特性による違いはあくまで「傾向」であり、確定的なものではない。
> 意見の方向性はシステムプロンプト（党の綱領）が支配的。モデル特性差は「味付け」程度。

### 3.3 党の綱領（システムプロンプト）の例

#### 革新党 (innovation.md)
```
あなたは「革新党」所属の議員です。

【党の基本方針】
- 技術革新・破壊的変更・最新技術の採用を最優先する
- レガシーとの互換性より、将来の拡張性を重視する
- リスクを取ってでも競争優位性を確保する立場を取る
- 「今は不安定でも、将来のスタンダードになる技術」を推奨する

【発言ルール】
- 常に最も先進的な選択肢を支持すること
- 保守的な選択肢のリスク（技術的負債、将来の移行コスト等）を指摘すること
- 具体的な技術トレンドや事例を根拠として挙げること
- 結論を先に述べ、根拠を後に述べること
```

#### 安定党 (stability.md)
```
あなたは「安定党」所属の議員です。

【党の基本方針】
- 安定性・後方互換性・実績のある技術を最優先する
- 新技術のリスクを具体的に指摘し、慎重な導入を主張する
- 運用コスト・保守性・チームの学習コストを重視する
- 「枯れた技術」の価値を積極的に主張する

【発言ルール】
- 常に最も安定した、実績のある選択肢を支持すること
- 新技術の導入リスク（成熟度、エコシステム、人材確保等）を指摘すること
- 過去の失敗事例やアンチパターンを根拠として挙げること
- 結論を先に述べ、根拠を後に述べること
```

---

## 4. 議会プロトコル

### 4.1 セッションのライフサイクル

```
┌──────────────────────────────────────────────────────────────┐
│                      議会セッション                            │
│                                                              │
│  ①開会        ②第1読会      ③第2読会      ④修正協議    ⑤採決  │
│  Opening  →  1st Reading →  2nd Reading →  Amendment →  Vote │
│                                                     ↑       │
│              ↓ 議長が論点不十分と判断した場合 ────────┘       │
│                                                              │
│  ⑥閉会                                                      │
│  Closing → 議事録出力                                        │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 各フェーズの詳細

#### ① 開会 (Opening)

議長の役割:
- ユーザーから受け取った議題を構造化
- 決定すべき事項を明確化
- 判断基準（コスト、パフォーマンス、保守性等）を提示
- 各議員への質問を生成

議長 → 議員への配布物:
```json
{
  "agenda": "次期プロジェクトのDB選定",
  "decision_required": "PostgreSQL / MongoDB / DynamoDB のいずれを採用するか",
  "criteria": ["コスト", "スケーラビリティ", "開発速度", "運用負荷"],
  "context": "ユーザーが提供した追加コンテキスト"
}
```

#### ② 第1読会 (First Reading): 所信表明

**目的:** 各党の基本的立場を明らかにする

**議員への指示:**
「議題に対する貴党の立場を述べてください。推奨する選択肢とその根拠を、判断基準に沿って説明してください。」

**実行方式:** 全議員に並列でAPI呼び出し

**議長の後処理:**
- 全発言を収集
- 各党の立場を一覧表にまとめる
- 主要な争点（意見が分かれている論点）を抽出
- 次ラウンドで深掘りすべき論点を決定

#### ③ 第2読会 (Second Reading): 反論・質疑

**目的:** 対立する意見を掘り下げ、各立場の強み/弱みを明確にする

**議員への提供情報:**
- 第1読会の要約（議長作成）
- 自党以外の発言の要点
- 議長が指定した「答えるべき質問」

**議員への指示:**
「他党の意見を踏まえ、以下について回答してください:
1. 他党の主張への具体的な反論
2. 自党の主張の弱点への対処方法
3. 妥協可能な点があればその条件」

**実行方式:** 全議員に並列でAPI呼び出し

**議長の後処理:**
- 反論の妥当性を評価
- 合意点と対立点を整理
- 修正協議が必要か判断

#### ④ 修正協議 (Amendment) - オプション

**発動条件:** 議長が「明確な多数派がない」と判断した場合

**議員への指示:**
「これまでの議論を踏まえ、他党も受け入れ可能な修正案・妥協案を1つ提出してください。」

**議長の後処理:**
- 修正案を整理
- 採決にかける選択肢のリストを確定

#### ⑤ 採決 (Vote)

**投票方式** (設定で選択可能):

| 方式 | 説明 | 適用場面 |
|------|------|---------|
| **単純多数決** (simple_majority) | 各議員が1つの選択肢に投票。最多得票が採択。同数時は議長が決定票 | 2択の場合 |
| **順位付き投票** (ranked) | 各議員が選択肢を優先順位で並べる。最下位除外→票の再配分を繰り返す | 3択以上の場合 (推奨) |
| **コンセンサス方式** (consensus) | 全会一致を目指す。不一致の場合は追加の修正ラウンド。最終的に合意に至らない場合は議長裁定 | 重要な意思決定 |

**投票時の議員への指示:**
```
以下の選択肢について投票してください。

選択肢: [A, B, C]

回答形式 (JSON):
{
  "vote": "選択肢",
  "ranking": ["第1希望", "第2希望", "第3希望"],
  "reason": "理由 (1-2文)",
  "conditions": "この選択肢が採択される場合の付帯条件 (あれば)"
}
```

#### ⑥ 閉会 (Closing)

議長の役割:
- 採決結果を発表
- 決定の根拠を要約（各党の主要論点を含む）
- 付帯条件・留意事項があれば明記
- 議事録をMarkdownファイルとして出力

### 4.3 議事規則 (Standing Orders)

```yaml
speaking_rules:
  max_tokens_per_speech: 1000      # 1発言の最大トークン数
  language: ja                      # 発言言語
  require_structured_output: true   # JSON形式での回答を要求

chair_powers:
  can_extend_debate: true           # 追加ラウンドの権限
  can_call_order: true              # 議題逸脱時の注意
  casting_vote: true                # 同数時の決定票
  can_summarize_speeches: true      # 冗長な発言の要約権限

debate_rules:
  max_rounds: 5                     # 最大ラウンド数
  min_rounds: 2                     # 最小ラウンド数 (所信表明+反論)
  parallel_speeches: true           # 並列発言を許可
  cross_party_context: true         # 他党の発言を共有する

vote_rules:
  default_method: ranked            # デフォルトの投票方式
  quorum: 0.5                       # 定足数 (全議員の50%)
  abstention_allowed: true          # 棄権を許可
```

---

## 5. コスト分析

### 5.1 モデル別API料金 (1Mトークンあたり、USD)

#### 超低コスト層 (議員の主力候補)

| モデル | 提供元 | Input | Output | 無料枠 |
|--------|--------|-------|--------|--------|
| Ollama (ローカル) | 各種OSS | $0 | $0 | 完全無料 |
| DeepSeek R1 Distill 70B | DeepSeek | $0.03 | $0.11 | なし |
| GPT-5 nano | OpenAI | $0.05 | $0.40 | なし |
| Gemini 2.0 Flash | Google | $0.10 | $0.40 | 1000回/日 |
| GPT-4o mini | OpenAI | $0.15 | $0.60 | なし |
| Grok 4.1 Fast | xAI | $0.20 | $0.50 | なし |
| DeepSeek V3 | DeepSeek | $0.19 | $0.87 | なし |

#### 中コスト層 (議長・重要議員候補)

| モデル | 提供元 | Input | Output |
|--------|--------|-------|--------|
| Gemini 2.5 Flash | Google | $0.30 | $2.50 |
| DeepSeek R1 | DeepSeek | $0.70 | $2.40 |
| Claude Haiku 3.5 | Anthropic | $0.80 | $4.00 |
| Claude Haiku 4.5 | Anthropic | $1.00 | $5.00 |

#### 高コスト層 (議長の高品質集約用)

| モデル | 提供元 | Input | Output |
|--------|--------|-------|--------|
| Gemini 2.5 Pro | Google | $1.25 | $10.00 |
| Claude Sonnet 4 | Anthropic | $3.00 | $15.00 |
| GPT-4o | OpenAI | $5.00 | $15.00 |

> **価格情報の出典** (2026年1月時点):
> - [IntuitionLabs LLM API Pricing Comparison](https://intuitionlabs.ai/articles/llm-api-pricing-comparison-2025)
> - [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
> - [xAI Models and Pricing](https://docs.x.ai/docs/models)
> - [DeepSeek API Pricing](https://api-docs.deepseek.com/quick_start/pricing)

### 5.2 1セッションのコスト試算

**前提条件:**
- 議員6名、3ラウンド制（所信表明 → 反論 → 修正案）+ 採決
- 1発言あたり: 入力 ~900 トークン、出力 ~800 トークン
- 議長の集約: 入力 ~4,200 トークン/ラウンド、出力 ~500 トークン
- 合計: 入力 ~31K トークン、出力 ~15.5K トークン

| 構成 | 議長コスト | 議員コスト | 合計/セッション |
|------|-----------|-----------|---------------|
| **推奨構成** | Pro内 ($0) | ~$0.10 | **~$0.10** |
| **最安構成** (Gemini無料枠+Ollama) | Pro内 ($0) | ~$0.02 | **~$0.02** |
| **高品質構成** (中コストモデル) | Pro内 ($0) | ~$0.30 | **~$0.30** |

> 議長は Claude Code Pro ライセンス ($20/月) 内で動作するため追加コストなし。

---

## 6. 設定ファイル

### 6.1 議会構成設定 (parliament.yaml)

```yaml
speaker:
  engine: claude-code
  model: opus-4.5

parties:
  - name: 革新党
    manifesto: innovation.md
    members:
      - name: 議員A
        adapter: openai
        model: gpt-5-nano
      - name: 議員B
        adapter: xai
        model: grok-4.1-fast

  - name: 安定党
    manifesto: stability.md
    members:
      - name: 議員C
        adapter: anthropic
        model: claude-3.5-haiku
      - name: 議員D
        adapter: ollama
        model: llama3

  - name: 実用党
    manifesto: pragmatic.md
    members:
      - name: 議員E
        adapter: google
        model: gemini-2.0-flash

  - name: 自由党
    manifesto: liberty.md
    members:
      - name: 議員F
        adapter: deepseek
        model: deepseek-v3

protocol:
  rounds: 3
  vote_method: ranked
  max_tokens_per_speech: 1000
  language: ja
```

### 6.2 モデル設定 (models.yaml)

```yaml
adapters:
  openai:
    base_url: https://api.openai.com/v1
    api_key_env: OPENAI_API_KEY
    default_temperature: 0.8
    models:
      gpt-5-nano:
        id: gpt-5-nano
        max_tokens: 1000
      gpt-4o-mini:
        id: gpt-4o-mini
        max_tokens: 1000

  anthropic:
    base_url: https://api.anthropic.com/v1
    api_key_env: ANTHROPIC_API_KEY
    default_temperature: 0.8
    models:
      claude-3.5-haiku:
        id: claude-3-5-haiku-20241022
        max_tokens: 1000

  google:
    base_url: https://generativelanguage.googleapis.com/v1beta
    api_key_env: GOOGLE_AI_API_KEY
    default_temperature: 0.8
    models:
      gemini-2.0-flash:
        id: gemini-2.0-flash
        max_tokens: 1000

  deepseek:
    base_url: https://api.deepseek.com/v1
    api_key_env: DEEPSEEK_API_KEY
    default_temperature: 0.8
    models:
      deepseek-v3:
        id: deepseek-chat
        max_tokens: 1000

  xai:
    base_url: https://api.x.ai/v1
    api_key_env: XAI_API_KEY
    default_temperature: 0.8
    models:
      grok-4.1-fast:
        id: grok-4.1-fast
        max_tokens: 1000

  ollama:
    base_url: http://localhost:11434
    api_key_env: null
    default_temperature: 0.8
    models:
      llama3:
        id: llama3
        max_tokens: 1000

  claude-code:
    engine: cli
    command: claude
    args: ["--print"]
```

---

## 7. 議事録フォーマット

### 7.1 出力例

```markdown
# 議事録: データベース選定

**日時:** 2026-01-27 14:30
**議題:** 次期プロジェクトのデータベース選定
**決定事項:** PostgreSQL / MongoDB / DynamoDB のいずれを採用するか
**出席:** 6名（革新党2名、安定党2名、実用党1名、自由党1名）

## 議長所見
本議題は次期プロジェクトにおけるデータベースの選定です。
判断基準: コスト、スケーラビリティ、開発速度、運用負荷

---

## 第1読会: 所信表明

### 革新党
| 議員 | モデル | 推奨 | 要旨 |
|------|--------|------|------|
| 議員A | GPT-5 nano | MongoDB | スキーマレスの柔軟性が... |
| 議員B | Grok 4.1 Fast | DynamoDB | サーバーレスの未来は... |

### 安定党
| 議員 | モデル | 推奨 | 要旨 |
|------|--------|------|------|
| 議員C | Claude Haiku | PostgreSQL | 30年の実績と... |
| 議員D | Llama 3 | PostgreSQL | RDBMSの信頼性... |

### 実用党
| 議員 | モデル | 推奨 | 要旨 |
|------|--------|------|------|
| 議員E | Gemini Flash | PostgreSQL | コスト効率と汎用性... |

### 自由党
| 議員 | モデル | 推奨 | 要旨 |
|------|--------|------|------|
| 議員F | DeepSeek V3 | MongoDB | ドキュメントモデルの... |

### 議長による争点整理
1. RDB vs NoSQL: 安定党・実用党はPostgreSQL、革新党・自由党はNoSQL
2. サーバーレス vs セルフホスト: 議員Bのみサーバーレス推奨
3. ...

---

## 第2読会: 反論・質疑

[各党の反論内容]

---

## 採決結果

### 投票詳細
| 議員 | 第1希望 | 第2希望 | 第3希望 |
|------|---------|---------|---------|
| 議員A | MongoDB | PostgreSQL | DynamoDB |
| 議員B | DynamoDB | MongoDB | PostgreSQL |
| 議員C | PostgreSQL | MongoDB | DynamoDB |
| 議員D | PostgreSQL | MongoDB | DynamoDB |
| 議員E | PostgreSQL | MongoDB | DynamoDB |
| 議員F | MongoDB | PostgreSQL | DynamoDB |

### 集計 (順位付き投票)
- 第1ラウンド: PostgreSQL 3票、MongoDB 2票、DynamoDB 1票
- DynamoDB を除外、議員Bの票が MongoDB に移動
- 第2ラウンド: PostgreSQL 3票、MongoDB 3票
- 同数のため議長が決定票 → **PostgreSQL**

## 最終決定
**PostgreSQL を採用**

### 決定理由
[議長による総括]

### 付帯条件
- JSONBを活用し、一部ドキュメント的な利用も許容する（革新党の主張を取り入れ）
- 将来的なNoSQL併用の余地を残すアーキテクチャ設計を推奨（革新党・自由党への配慮）
```

---

## 8. 技術スタック

| 項目 | 技術 |
|------|------|
| ランタイム | Node.js 22+ |
| 言語 | TypeScript 5 |
| パッケージマネージャ | pnpm |
| 設定ファイル | YAML (yaml パッケージ) |
| HTTP クライアント | fetch (Node.js 組み込み) |
| CLI | Commander.js or yargs |
| テスト | Vitest |
| 議長CLI | Claude Code (`claude --print`) |

---

## 9. 実装の優先順位

### フェーズ1: MVP (最小動作可能製品)
- [ ] プロジェクト初期化 (package.json, tsconfig.json)
- [ ] 設定ファイルの読み込み (YAML)
- [ ] 議員アダプタ: OpenAI, Ollama (最低2つ)
- [ ] 議長: Claude Code CLI 呼び出し
- [ ] 議会セッション: 1ラウンドの所信表明 + 採決
- [ ] 議事録の Markdown 出力

### フェーズ2: 基本機能完成
- [ ] 全議員アダプタ実装 (Anthropic, Google, DeepSeek, xAI)
- [ ] 複数ラウンド対応 (第1読会, 第2読会, 修正協議)
- [ ] 複数の採決方式 (ranked, simple_majority, consensus)
- [ ] 党の綱領のカスタマイズ

### フェーズ3: 拡張機能
- [ ] 議事録の検索・参照
- [ ] 過去の議事録を踏まえた議論
- [ ] Web UI (connpute-web との統合)
- [ ] コスト追跡・レポート
