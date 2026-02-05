---
name: resolve-review
description: PRのレビューコメントに対応する
argument-hint: '[PR番号]'
disable-model-invocation: true
---

# resolve-review

PRのレビューコメントに対応します。

## 引数

- `$ARGUMENTS`: PR番号（省略可能）

## 手順

### 1. 対象PRの特定

引数でPR番号が指定されている場合はそのPRを、指定されていない場合は現在のブランチに関連するPRを対象とします。

```bash
# PR番号が指定されている場合
gh pr view $ARGUMENTS

# PR番号が指定されていない場合（現在のブランチのPR）
gh pr view
```

PRが見つからない場合は、ユーザーにPR番号の入力を求めてください。

PRの概要（タイトル、ベースブランチ、ヘッドブランチ、状態、PR番号）を確認し、以降のステップで使用するPR番号を特定してください。

### 2. GitHub Copilot code reviewのステータス確認

PRに関連するチェックステータスを確認し、Copilot code reviewが完了しているかを確認します。

> **Note**: Copilot code reviewはGitHubの組み込み機能であり、リポジトリ設定で有効化されています。`.github/workflows/`内のワークフローファイルとしては存在しません。

```bash
# PRのチェックステータスを確認
gh pr checks <PR番号>
```

#### ステータスの判定

出力結果の中から「Copilot」を含むチェック（大文字小文字を区別しない）を探し、2列目のステータスを確認します:

- **pass**: Copilotレビューが完了 → ステップ3へ進む
- **pending / in_progress**: Copilotレビューが実行中 → 待機処理へ
- **fail / failure**: Copilotレビューが失敗 → ユーザーに通知し、続行するか確認
- **Copilotのチェックが見つからない**: リポジトリでCopilot code reviewが未設定の可能性 → ユーザーに「Copilot code reviewが有効でないようです。手動レビューを前提として続行します」と通知し、ステップ3へ進む

#### 待機処理

Copilot code reviewが実行中の場合:

1. 「Copilot code reviewが実行中です。完了までお待ちください...」と表示
2. 初回チェック後、**30秒間隔で最大9回**（合計10回のチェック、最大待機約4分半）リトライする
3. 各リトライ時に `gh pr checks <PR番号>` を再実行し、ステータスを確認
4. 完了したら次のステップへ進む
5. 最大リトライ回数に達しても完了しない場合は、ユーザーに通知し、続行するか確認する

### 3. レビューコメントの取得

GraphQL APIを使用して、レビュースレッドとコメントを取得します。スレッドIDは後のResolve処理で使用します。

```bash
# PRのレビュースレッドを取得
# 注: 100件を超えるスレッドがある場合はpageInfo.hasNextPageを確認し、
#     endCursorを使用して追加取得してください
gh api graphql -f query='
query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      reviewThreads(first: 100) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          isResolved
          comments(first: 10) {
            nodes {
              id
              databaseId
              body
              path
              line
              author {
                login
              }
            }
          }
        }
      }
    }
  }
}' -f owner=connpute -f repo=connpute-gikai -F number=<PR番号>
```

未解決のスレッド（`isResolved: false`）のみを対応対象とします。

#### Copilotコメントの確認

ステップ2でCopilot code reviewのチェックが「pass」であっても、コメントがまだ反映されていない場合があります。コメントの中に `copilot` (GitHub Copilot) による投稿が1件もない場合は、少し待機してください:

1. 「Copilotのレビューコメントを待機中...」と表示
2. 初回取得後、**10秒間隔で最大3回**（合計最大30秒）リトライする
3. 各リトライ時に上記のGraphQL APIを再実行し、`copilot` のコメントがあるか確認
4. 待機中にコメントが見つかったら、次のステップへ進む
5. 最大リトライ回数に達してもコメントがない場合:
   - ステップ2でCopilotチェックが「pass」だった場合は、ユーザーに「Copilotのチェックはpassしましたが、コメントがありません。今回はCopilotからの指摘がなかったと判断してよいですか？」と確認する
   - 確認が取れたら、他のコメントがあれば対応を続行

#### コメントの整理

取得したレビュースレッドを以下の項目で整理してください:

- **スレッドID**（GraphQL IDの `id` フィールド。Resolve処理で使用）
- コメントID（`databaseId`。返信時に使用）
- コメント内容
- 対象ファイル・行
- コメント投稿者

### 4. 作業ブランチへの切り替え

現在のブランチがPRのヘッドブランチでない場合は、チェックアウトしてください。

```bash
gh pr checkout <PR番号>
```

### 5. レビューコメントへの対応

各コメントを分析し、必要な対応を行ってください:

- **コード修正が必要な場合**: 指摘に従ってコードを修正
- **説明・回答が必要な場合**: 返信内容を準備
- **対応不要な場合**: その理由を準備

TodoWriteツールを使用して、各コメントへの対応状況を追跡してください。

### 6. 変更のコミットとプッシュ

修正が必要な場合、変更をコミットしてプッシュしてください。

```bash
git add <修正したファイル>
git commit -m "Address review comments

- 対応内容1
- 対応内容2

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
git push
```

### 7. 各コメントへの返信とスレッドのResolve

対応完了後、各レビューコメントに**日本語で**返信し、スレッドをResolveします。

#### 7.1 コメントへの返信

```bash
gh api repos/connpute/connpute-gikai/pulls/<PR番号>/comments -X POST -F body="対応内容" -F in_reply_to=<コメントID>
```

返信には以下を含めてください:

- 対応した内容の説明
- 修正した場合はコミットハッシュへの言及
- 対応しない場合はその理由

#### 返信例

| 状況                    | 返信例                                                                         |
| ----------------------- | ------------------------------------------------------------------------------ |
| コード修正した場合      | `コミット abc1234 で修正しました。`                                            |
| 説明で対応した場合      | `ご指摘ありがとうございます。この実装は〇〇の理由で現状のままとしています。`   |
| 対応しない場合          | `ご指摘の点について検討しましたが、〇〇の理由により現状維持とさせてください。` |
| 別 Issue で対応する場合 | `ご指摘ありがとうございます。この件は Issue #XX として別途対応します。`        |

#### 7.2 スレッドのResolve

返信投稿後、該当スレッドを自動的にResolveします。

```bash
# スレッドをResolve（thread_idはステップ3で取得したGraphQL IDを使用）
gh api graphql -f query='
mutation($threadId: ID!) {
  resolveReviewThread(input: {threadId: $threadId}) {
    thread {
      isResolved
    }
  }
}' -f threadId=<thread_id>
```

#### Resolve処理の注意

- **Resolveに失敗した場合**: エラーメッセージを表示するが、処理は継続する（次のコメントへ進む）
- **対応しないと判断したコメント**: ユーザーに確認し、Resolveするかどうかを選択させる

#### 処理フロー（各コメントごと）

```
コメントへの対応
      │
      ▼
┌─────────────────┐
│  返信を投稿     │
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│ スレッドResolve │
└───────┬─────────┘
        │
        ▼
   次のコメントへ
```

### 8. 完了報告

すべてのコメントへの対応が完了したら、対応サマリーを報告してください:

- 対応したコメント数
- 修正内容の概要
- 未対応のコメントがあればその理由

## 注意事項

- 返信投稿後、該当スレッドを自動的にResolveする（手動でのResolve操作は不要）
- 対応しないと判断したコメントは、ユーザーに確認の上でResolveするかどうかを選択
- 修正が必要な場合は、build/testを実行してから push すること
- 返信は各コメントに個別に行う（まとめて1つのコメントにしない）
