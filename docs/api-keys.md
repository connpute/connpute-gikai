# APIキー取得ガイド

connpute-gikai で使用する各AIプロバイダのAPIキー取得手順を記載します。

**調査日:** 2026-01-27

> **注意:** 各サービスの画面構成や手順は変更される可能性があります。
> 最新情報は各プロバイダの公式ドキュメントを参照してください。

---

## 目次

1. [OpenAI (GPT-4o mini / GPT-5 nano)](#1-openai)
2. [Anthropic (Claude Haiku)](#2-anthropic)
3. [Google AI (Gemini Flash)](#3-google-ai)
4. [DeepSeek (DeepSeek V3)](#4-deepseek)
5. [xAI (Grok)](#5-xai)
6. [Ollama (ローカルLLM)](#6-ollama)
7. [環境変数の設定](#7-環境変数の設定)
8. [最小構成で始める](#8-最小構成で始める)

---

## 1. OpenAI

**使用モデル:** GPT-4o mini, GPT-5 nano
**環境変数:** `OPENAI_API_KEY`
**料金:** GPT-4o mini: $0.15/$0.60 per 1M tokens (input/output)
**公式サイト:** https://platform.openai.com

### 取得手順

1. **アカウント作成**
   - [platform.openai.com](https://platform.openai.com) にアクセス
   - 「Sign up」をクリック
   - メールアドレス、Google、Microsoft、Apple のいずれかで登録
   - メール認証 + 電話番号によるSMS認証が必要

2. **APIキーの生成**
   - ログイン後、右上の設定アイコンをクリック
   - 左メニューから「API keys」を選択
   - 「+ Create new secret key」をクリック
   - キーの名前を設定（例: `connpute-gikai`）
   - **生成されたキーを即座にコピー**（再表示不可）

3. **クレジットの追加**
   - 左メニューの「Billing」→「Add payment details」
   - クレジットカードを登録
   - 新規アカウントには **$5の無料クレジット** が付与される（3ヶ月有効）

### キーの形式

```
sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 参考リンク

- [APIキー管理ページ](https://platform.openai.com/api-keys)
- [クイックスタートガイド](https://platform.openai.com/docs/quickstart)
- [料金表](https://openai.com/api/pricing/)

---

## 2. Anthropic

**使用モデル:** Claude 3.5 Haiku
**環境変数:** `ANTHROPIC_API_KEY`
**料金:** Claude 3.5 Haiku: $0.80/$4.00 per 1M tokens (input/output)
**公式サイト:** https://console.anthropic.com

> **注意:** Claude Code の Pro ライセンス ($20/月) とは別に、
> API利用には Anthropic Console でのアカウント登録とクレジット追加が必要です。

### 取得手順

1. **アカウント作成**
   - [console.anthropic.com](https://console.anthropic.com) にアクセス
   - メールまたは Google アカウントで登録
   - 電話番号によるSMS認証が必要
   - 地域やユースケースによっては審査が入る場合がある

2. **APIキーの生成**
   - ログイン後、左メニューから「API Keys」を選択
   - 右上の「+ Create Key」をクリック
   - キーの名前を入力（例: `connpute-gikai`）
   - **生成されたキーを即座にコピー**（再表示不可）

3. **クレジットの追加**
   - 左メニューの「Billing」を開く
   - クレジットカードを登録
   - プリペイド方式: 最低 **$5** から（まずは $5 で十分）

### キーの形式

```
sk-ant-apiXX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 参考リンク

- [Anthropic Console](https://console.anthropic.com)
- [APIドキュメント](https://docs.anthropic.com/en/api/getting-started)
- [料金表](https://docs.anthropic.com/en/docs/about-claude/pricing)

---

## 3. Google AI

**使用モデル:** Gemini 2.0 Flash
**環境変数:** `GOOGLE_AI_API_KEY`
**料金:** Gemini 2.0 Flash: $0.10/$0.40 per 1M tokens (input/output)
**無料枠:** あり（1,000リクエスト/日）
**公式サイト:** https://aistudio.google.com

> **Gemini は無料枠が最も充実しているプロバイダです。**
> クレジットカード不要で始められます。

### 取得手順

1. **Google AI Studio にアクセス**
   - [aistudio.google.com](https://aistudio.google.com) にアクセス
   - Google アカウントでログイン
   - 利用規約に同意

2. **APIキーの取得**
   - 左サイドバーの「Get API key」をクリック
   - または [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) に直接アクセス
   - 「Create API Key」をクリック
   - 既存の Google Cloud プロジェクトを選択するか、新規作成
   - 初回利用の場合、デフォルトプロジェクトが自動作成される
   - **生成されたキーをコピー**

3. **無料枠**
   - クレジットカード不要で利用開始可能
   - 無料枠の制限: 1,000リクエスト/日、250,000トークン/分
   - 無料枠ではデータが Google の製品改善に使用される可能性がある
   - 有料枠に切り替えるとデータ利用が停止される

### キーの形式

```
AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 参考リンク

- [APIキー管理ページ](https://aistudio.google.com/app/apikey)
- [APIキー利用ガイド](https://ai.google.dev/gemini-api/docs/api-key)
- [料金表](https://ai.google.dev/gemini-api/docs/pricing)

---

## 4. DeepSeek

**使用モデル:** DeepSeek V3 (deepseek-chat)
**環境変数:** `DEEPSEEK_API_KEY`
**料金:** $0.19/$0.87 per 1M tokens (input/output)、キャッシュヒット時は $0.07/1M input
**公式サイト:** https://platform.deepseek.com

> **OpenAI互換API:** DeepSeek の API は OpenAI と互換性があるため、
> OpenAI SDK をそのまま利用できます。

### 取得手順

1. **アカウント作成**
   - [platform.deepseek.com](https://platform.deepseek.com) にアクセス
   - 「Sign Up」をクリック
   - メールアドレスまたは Google / Apple ID で登録
   - メール認証を完了

2. **APIキーの生成**
   - ログイン後、左メニューから「API Keys」を選択
   - 「Create new API key」をクリック
   - キーの名前を入力
   - **生成されたキーを即座にコピー**（再表示不可）

3. **クレジットの追加**
   - 左メニューの「Billing」を開く
   - 従量課金制（プリペイドまたはポストペイド）
   - 無料トライアルクレジットが付与される場合あり

### キーの形式

```
sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 注意事項

- 人気の急増によりサービスが一時的に制限される場合がある
- API は OpenAI と互換のため、`base_url` を `https://api.deepseek.com/v1` に変更するだけで OpenAI SDK から利用可能

### 参考リンク

- [DeepSeek Platform](https://platform.deepseek.com)
- [APIドキュメント](https://api-docs.deepseek.com/)
- [料金表](https://api-docs.deepseek.com/quick_start/pricing)

---

## 5. xAI

**使用モデル:** Grok 4.1 Fast
**環境変数:** `XAI_API_KEY`
**料金:** $0.20/$0.50 per 1M tokens (input/output)
**公式サイト:** https://console.x.ai

> **OpenAI互換API:** xAI の API も OpenAI と互換性があるため、
> OpenAI SDK をそのまま利用できます。

### 取得手順

1. **アカウント作成**
   - [console.x.ai](https://console.x.ai) にアクセス
   - xAI アカウントを作成（X/Twitter アカウントは不要）

2. **APIキーの生成**
   - ログイン後、「API Keys」ページを開く
   - 「Create API Key」をクリック
   - **生成されたキーを即座にコピー**（再表示不可）

3. **クレジットの追加**
   - 「Billing」セクションでクレジットカードを登録
   - 従量課金制
   - 使用量は xAI Console の Usage ページで確認可能

### キーの形式

```
xai-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 参考リンク

- [xAI Console](https://console.x.ai)
- [APIドキュメント](https://docs.x.ai/docs/overview)
- [チュートリアル](https://docs.x.ai/docs/tutorial)
- [料金表](https://docs.x.ai/docs/models)

---

## 6. Ollama

**使用モデル:** Llama 3（その他任意のローカルモデル）
**環境変数:** 不要
**料金:** 無料（ローカル実行）
**公式サイト:** https://ollama.com

> **APIキー不要:** Ollama はローカルでLLMを実行するツールです。
> インターネット接続もAPIキーも不要です（モデルの初回ダウンロード時を除く）。

### インストール手順

#### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### macOS

- [ollama.com/download](https://ollama.com/download) からインストーラをダウンロード
- または Homebrew: `brew install ollama`

#### Windows

- [ollama.com/download](https://ollama.com/download) からインストーラをダウンロード

### モデルのダウンロードと起動

```bash
# Llama 3 をダウンロード・起動（初回のみダウンロード、約4.7GB）
ollama run llama3

# バックグラウンドでサーバーを起動（APIとして利用する場合）
ollama serve
```

### 動作確認

```bash
# API が動作しているか確認
curl http://localhost:11434/api/tags
```

### ハードウェア要件

| モデルサイズ | 必要RAM | GPU |
|---|---|---|
| 7B (Llama 3 等) | 8GB以上 | なくても動作（遅い） |
| 13B | 16GB以上 | 推奨 |
| 70B | 32GB以上 | 必須（NVIDIA/AMD） |

### 参考リンク

- [Ollama 公式サイト](https://ollama.com)
- [利用可能なモデル一覧](https://ollama.com/library)
- [GitHub リポジトリ](https://github.com/ollama/ollama)

---

## 7. 環境変数の設定

### 方法1: `.env` ファイル（推奨）

プロジェクトルートに `.env` ファイルを作成:

```bash
# connpute-gikai/.env

# OpenAI (革新党/議員A)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx

# xAI (革新党/議員B)
XAI_API_KEY=xai-xxxxxxxxxxxxxxxxxxxx

# Anthropic (安定党/議員C)
ANTHROPIC_API_KEY=sk-ant-apiXX-xxxxxxxxxxxxxxxxxxxx

# Google AI (実用党/議員E)
GOOGLE_AI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# DeepSeek (自由党/議員F)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# Ollama (安定党/議員D) - キー不要
```

> **重要:** `.env` ファイルは `.gitignore` に含まれているため、git にコミットされません。

### 方法2: シェルで直接設定

```bash
export OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxx"
export XAI_API_KEY="xai-xxxxxxxxxxxxxxxxxxxx"
export ANTHROPIC_API_KEY="sk-ant-apiXX-xxxxxxxxxxxxxxxxxxxx"
export GOOGLE_AI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
export DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxxxxxx"
```

### 方法3: シェルの設定ファイルに追加

`~/.bashrc` または `~/.zshrc` に追記:

```bash
# connpute-gikai API keys
export OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxx"
# ... (他のキーも同様)
```

追記後に反映:

```bash
source ~/.bashrc  # または source ~/.zshrc
```

---

## 8. 最小構成で始める

全てのAPIキーを一度に取得する必要はありません。
`parliament.yaml` を編集して、利用可能なプロバイダのみで議会を構成できます。

### 最小構成例: Gemini 無料枠 + Ollama のみ

コスト: **$0**（完全無料）

```yaml
# src/config/parliament.yaml を以下に書き換え
parties:
  - name: 革新党
    manifesto: innovation.md
    members:
      - name: 議員A
        adapter: google
        model: gemini-2.0-flash

  - name: 安定党
    manifesto: stability.md
    members:
      - name: 議員B
        adapter: ollama
        model: llama3
```

必要な環境変数: `GOOGLE_AI_API_KEY` のみ（無料で取得可能）
必要なソフトウェア: Ollama（無料インストール）

### 2プロバイダ構成例: OpenAI + Ollama

コスト: ~$0.05/セッション

```yaml
parties:
  - name: 革新党
    manifesto: innovation.md
    members:
      - name: 議員A
        adapter: openai
        model: gpt-4o-mini

  - name: 安定党
    manifesto: stability.md
    members:
      - name: 議員B
        adapter: ollama
        model: llama3
```

必要な環境変数: `OPENAI_API_KEY` のみ

---

## コスト早見表

| プロバイダ | モデル | Input/1M tokens | Output/1M tokens | 無料枠 | APIキー取得の難易度 |
|---|---|---|---|---|---|
| Ollama | Llama 3 | $0 | $0 | 完全無料 | 不要（インストールのみ） |
| Google AI | Gemini 2.0 Flash | $0.10 | $0.40 | 1,000回/日 | 簡単（カード不要） |
| OpenAI | GPT-4o mini | $0.15 | $0.60 | $5クレジット | 簡単 |
| DeepSeek | DeepSeek V3 | $0.19 | $0.87 | 場合による | 簡単 |
| xAI | Grok 4.1 Fast | $0.20 | $0.50 | なし | 簡単 |
| Anthropic | Claude 3.5 Haiku | $0.80 | $4.00 | なし | 簡単（審査の場合あり） |
