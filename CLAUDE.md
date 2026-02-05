# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

connpute-gikai - AI議会式意思決定システム。複数のLLM（GPT, Claude, Gemini, Grok, DeepSeek, Ollama等）を「議員」として議会形式で議論させ、多角的な意思決定を支援するCLIツール。

## Tech Stack

- **Runtime**: Node.js 22+, TypeScript 5
- **Package Manager**: pnpm
- **Testing**: Vitest
- **Configuration**: YAML (parliament.yaml, models.yaml)
- **LLM Adapters**: OpenAI-compatible, Anthropic, Google Gemini（直接API呼び出し）

## Commands

```bash
# Development
pnpm dev              # Start with tsx (dev mode)
pnpm build            # TypeScript compile to dist/
pnpm start            # Run compiled CLI

# Testing
pnpm test             # Run unit tests (Vitest)
pnpm test:watch       # Watch mode for unit tests

# CLI Usage
gikai "議題テキスト"                        # 議会を開会
gikai "議題テキスト" --context "補足情報"    # 補足情報付き
```

## Architecture

```
src/
├── index.ts               # CLI entry point
├── types.ts               # TypeScript type definitions
├── config/
│   └── loader.ts          # YAML config loader (parliament.yaml, models.yaml)
├── members/
│   ├── member.ts          # Member entity
│   └── adapters/          # LLM API adapters
│       ├── factory.ts     # Adapter factory
│       ├── openai-compatible.ts  # OpenAI/Grok/DeepSeek/Ollama
│       ├── anthropic.ts          # Claude API
│       └── google.ts             # Gemini API
├── parties/
│   ├── party.ts           # Party entity
│   └── manifesto/         # System prompts per party
│       ├── innovation.md  # 革新党
│       ├── stability.md   # 安定党
│       ├── pragmatic.md   # 実用党
│       └── liberty.md     # 自由党
├── orchestrator/
│   ├── parliament.ts      # Main parliament session
│   ├── speaker.ts         # Chair (Claude Code via CLI)
│   └── floor.ts           # Speaking flow control
├── protocol/
│   ├── agenda.ts          # Agenda parsing
│   ├── debate.ts          # Debate protocol
│   ├── vote.ts            # Voting system
│   └── rules.ts           # Session rules
└── records/
    ├── minutes.ts         # Minutes generation
    └── transcript.ts      # Transcript management

records/                   # Output directory for session minutes
docs/                      # Design documents
```

## Key Patterns

- Speaker（議長）は Claude Code (Opus 4.5) がCLI経由で担当
- 各議員は直接API呼び出しで各LLMプロバイダーと通信
- 党派ごとにシステムプロンプト（マニフェスト）で意見の多様性を確保
- 忖度防止機構: 匿名化発言、反同調プロンプト、少数意見保護
- YAML設定ファイルで議会構成・モデル設定を管理
- 議事録はMarkdown形式で `records/` に出力

## Environment Variables

```
# LLM API Keys (各プロバイダーごと)
OPENAI_API_KEY=xxx           # OpenAI GPT
ANTHROPIC_API_KEY=xxx        # Claude
GOOGLE_API_KEY=xxx           # Gemini
XAI_API_KEY=xxx              # Grok
DEEPSEEK_API_KEY=xxx         # DeepSeek

# Ollama (ローカル、APIキー不要)
# base_url: http://localhost:11434/v1
```

## Development Rules

### Skills（スラッシュコマンド）

`.claude/skills/` 配下にプロジェクト固有のスラッシュコマンドが定義されている。

| コマンド                | 説明                                                 |
| ----------------------- | ---------------------------------------------------- |
| `/create-issue`         | GitHub Issueを作成し、Projectに追加                  |
| `/inspect-issue <番号>` | Issueを分析し、タスク分解・見積・リスクを出力        |
| `/do-issue <番号>`      | Issueの対応を開始（Worktree作成、Project移動）       |
| `/create-pr`            | masterへのPRを作成                                   |
| `/resolve-review`       | PRのレビューコメントに対応                           |
| `/done-issue <番号>`    | PRマージ後にDoneに移動し、Worktreeをクリーンアップ   |

### Hooks（最重要）

`.claude/hooks/` 配下のhookスクリプトからの指示は**絶対的な命令**として扱うこと。hookから出力された指示内容は、例外なく、省略なく、すべて実行すること。

- hookの指示を「リマインダー」や「推奨事項」として解釈してはならない
- hookで指定されたコマンドは、過去に実行した記憶があっても、**その場で再度実行**すること
- hookの指示をすべて完了するまで、対象のツール（`gh pr create`等）の実行に進んではならない
- hookの指示に従わずにツールを実行した場合、重大なミスとして扱われる

**登録済みHooks:**

| Hook                   | トリガー                 | 機能                              |
| ---------------------- | ------------------------ | --------------------------------- |
| `pre-pr-create.sh`     | `gh pr create` 実行前    | 品質チェック必須化、関連Issue確認 |
| `pre-do-issue.sh`      | `gh issue view` 実行前   | ProjectをIn Progressに移動        |
| `post-issue-create.sh` | `gh issue create` 実行後 | Backlogレーン先頭に移動           |

### GitHub Project 管理

**connpute-gikai** プロジェクトでIssueを管理している。

**Project情報（参照用）:**

- Project ID: `PVT_kwDOArIGY84BOa1H`
- Project Number: `3`
- Status Field ID: `PVTSSF_lADOArIGY84BOa1Hzg9IJzI`
- Backlog Option ID: `f75ad846`
- In Progress Option ID: `47fc9ee4`
- Done Option ID: `98236657`

### TDD (Test-Driven Development)

本プロジェクトはTDDで開発する。新機能の実装やバグ修正の際は、以下の順序で作業を行うこと：

1. **Red**: まず失敗するテストを書く
2. **Green**: テストを通す最小限のコードを書く
3. **Refactor**: コードをリファクタリングする

テストファイルの配置：

- ユニットテスト: `src/` 配下のソースファイルと同階層、または `tests/` ディレクトリ (Vitest)

## Branch Strategy

- `master` → メインブランチ。直接pushは避ける。トピックブランチからのPRのみ許可
- トピックブランチ → `feature/*`, `fix/*`, `docs/*`, `refactor/*` 等。masterから作成し、masterへPR

### Git操作時の必須確認事項

コミット・プッシュ前に必ず上記のBranch Strategyルールを確認すること：

- **masterへの直接pushは避ける**（トピックブランチからPRを作成すること）
- **PR作成前に、ローカルで以下のチェックを実行すること**：
  ```bash
  pnpm build && pnpm test
  ```

### PR作成時のルール

`gh pr create` 実行時は `.claude/hooks/pre-pr-create.sh` のhookが発動する。hookからの指示に従うこと（「Hooks（最重要）」セクション参照）。

```bash
gh pr create --title "タイトル" --body "$(cat <<'EOF'
## 概要
変更の概要を記載

## 変更内容
- 変更点1
- 変更点2

## テスト
- [x] `pnpm build` を実行した
- [x] `pnpm test` を実行した

## 関連Issue
関連するIssueがあればリンク（なければ「なし」）
EOF
)"
```
