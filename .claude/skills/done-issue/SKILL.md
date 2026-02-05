---
name: done-issue
description: PRマージとIssueのDone移動、Worktreeクリーンアップを自動化する
argument-hint: '<issue番号>'
disable-model-invocation: true
---

# done-issue

Issue #$ARGUMENTS の完了処理を行います。PRマージ前でも実行可能で、マージまでの一連の処理を自動化します。

## 手順

### 1. 関連PRの特定

Issue番号に関連するPRを検索します。

```bash
# Issue番号を含むPRを検索（オープンなもの優先）
# タイトルまたは本文（Closes #XX）で検索
gh pr list --state open --search "issue-$ARGUMENTS in:title OR Closes #$ARGUMENTS in:body" --json number,title,state,headRefName --jq '.[0]'

# オープンなPRがない場合、マージ済みを検索
gh pr list --state merged --search "issue-$ARGUMENTS in:title OR Closes #$ARGUMENTS in:body" --json number,title,state,headRefName --jq '.[0]'
```

PRが見つからない場合は、ユーザーにPR番号の入力を求めてください。

### 2. PRマージ状態の確認

PRの状態を確認し、処理を分岐します。

```bash
PR_STATE=$(gh pr view <PR番号> --json state --jq '.state')
```

- **MERGED**: 既存フロー（手順6: Doneに移動）へスキップ
- **OPEN**: PRマージ前処理（手順3〜5）を実行
- **CLOSED**: ユーザーに確認（マージせずクローズされたPR）

### 3. 未解決レビューコメントの確認

PRに未解決のレビューコメントがあるか確認します。

```bash
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
          comments(first: 1) {
            nodes {
              body
              path
              line
            }
          }
        }
      }
    }
  }
}' -f owner=connpute -f repo=connpute-gikai -F number=<PR番号>
```

#### 未解決コメントがある場合

未解決（`isResolved: false`）のスレッドがある場合、**処理を中断**して `/resolve-review` の実行を促します。

```
未解決のレビューコメントが X 件あります。

先に `/resolve-review <PR番号>` を実行して、レビューコメントに対応してください。
対応完了後、再度 `/done-issue $ARGUMENTS` を実行してください。
```

**注意**: `/done-issue` では未解決コメントの自動Resolveは行いません。レビューコメントへの対応は `/resolve-review` の責務です。

#### 全てのコメントがResolve済みの場合

次のステップに進みます。

### 4. CIステータスの確認と待機

PRのCIチェックステータスを確認します。

```bash
gh pr checks <PR番号> --json name,state,bucket --jq '.[] | "\(.name): state=\(.state), bucket=\(.bucket)"'
```

#### ステータス判定

- **全て `state=completed` かつ `bucket=pass`**: 次のステップへ
- **実行中のチェックがある場合**: 30秒間隔で最大20回（約10分）待機
- **`state=completed` で `bucket=fail` を含む**: エラーメッセージを表示して中断
- **チェックが0件の場合**: 次のステップへ進む

### 5. PRのマージ

CIが成功したら、PRをマージします。

```bash
gh pr merge <PR番号> --merge --delete-branch
```

マージに失敗した場合（コンフリクト等）は、エラーメッセージを表示して中断します。

### 6. ProjectステータスをDoneに移動

IssueをDoneレーンに移動します。

```bash
# Issue番号からProject Item IDを取得
ITEM_ID=$(gh project item-list 3 --owner connpute --format json --limit 100 | jq -r ".items[] | select(.content.number == $ARGUMENTS) | .id")

# Doneに移動
gh project item-edit --project-id PVT_kwDOArIGY84BOa1H --id "$ITEM_ID" --field-id PVTSSF_lADOArIGY84BOa1Hzg9IJzI --single-select-option-id 98236657
```

### 7. Worktreeの削除

Worktreeを削除してクリーンアップします。

```bash
# メインリポジトリに移動
MAIN_REPO=$(git rev-parse --show-toplevel)
cd "$MAIN_REPO"

# Worktreeパスを特定
REPO_NAME=$(basename "$MAIN_REPO")
WORKTREE_PATH="${MAIN_REPO}/../${REPO_NAME}-issue-$ARGUMENTS"

# Worktreeを削除
git worktree remove "$WORKTREE_PATH" --force
```

### 8. ローカルブランチの削除（オプション）

不要になったローカルブランチを削除します。

```bash
BRANCH_NAME=$(git branch --list "*issue-$ARGUMENTS*" | tr -d ' *')

if [ -n "$BRANCH_NAME" ]; then
  git branch -d "$BRANCH_NAME"
fi
```

### 9. 完了報告

以下の内容を報告してください：

- PRがマージされたこと（PR番号とマージ方法）
- Issue #$ARGUMENTS のステータスが Done に移動したこと
- Worktree が削除されたこと
- ローカルブランチが削除されたこと（削除した場合）

## 処理フロー図

```
/done-issue <番号>
       │
       ▼
┌─────────────────┐
│  1. PRを特定    │
└───────┬─────────┘
        │
        ▼
┌─────────────────┐     MERGED
│ 2. マージ状態   │─────────────┐
│    確認         │             │
└───────┬─────────┘             │
        │ OPEN                  │
        ▼                       │
┌─────────────────┐             │
│ 3. 未解決コメ   │             │
│    ント確認     │             │
└───────┬─────────┘             │
        │                       │
   ┌────┴────┐                  │
   │         │                  │
  あり      なし                │
   │         │                  │
   ▼         ▼                  │
 中断  ┌─────────────────┐      │
       │ 4. CI待機       │      │
       │    (最大10分)   │      │
       └───────┬─────────┘      │
               │ 成功           │
               ▼                │
       ┌─────────────────┐      │
       │ 5. PRマージ     │      │
       └───────┬─────────┘      │
               │                │
               ▼                │
       ┌─────────────────┐◄─────┘
       │ 6. Doneに移動   │
       └───────┬─────────┘
               │
               ▼
       ┌─────────────────┐
       │ 7. Worktree削除 │
       └───────┬─────────┘
               │
               ▼
       ┌─────────────────┐
       │ 8. ブランチ削除 │
       └───────┬─────────┘
               │
               ▼
       ┌─────────────────┐
       │ 9. 完了報告     │
       └─────────────────┘
```

## 注意事項

- PRがマージ済みの場合は、Done移動・クリーンアップのみ実行
- CI失敗時は処理を中断し、ユーザーに対応を促す
- Worktreeに未コミットの変更がある場合は警告が表示される
- `--force` オプションで強制削除するが、重要な変更がないか事前に確認すること

## Project情報（参照用）

- **Project ID**: `PVT_kwDOArIGY84BOa1H`
- **Project Number**: `3`
- **Status Field ID**: `PVTSSF_lADOArIGY84BOa1Hzg9IJzI`
- **Done Option ID**: `98236657`
