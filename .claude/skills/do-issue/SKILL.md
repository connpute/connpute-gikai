---
name: do-issue
description: GitHub issueの対応を開始し、Worktreeを作成してProjectをIn Progressに移動する
argument-hint: '<issue番号>'
disable-model-invocation: true
---

# do-issue

GitHub issue #$ARGUMENTS の対応を開始します。

## 手順

### 1. Issueの確認

```bash
gh issue view $ARGUMENTS
```

issueの内容（タイトル、説明、ラベル、関連情報）を確認し、要件を整理してください。

### 2. ProjectステータスをIn Progressに移動

Issue対応開始時に、ProjectのステータスをBacklogからIn Progressに変更します。

```bash
# Issue番号からProject Item IDを取得
ITEM_ID=$(gh project item-list 3 --owner connpute --format json | jq -r ".items[] | select(.content.number == $ARGUMENTS) | .id")

# In Progressに移動
gh project item-edit --project-id PVT_kwDOArIGY84BOa1H --id "$ITEM_ID" --field-id PVTSSF_lADOArIGY84BOa1Hzg9IJzI --single-select-option-id 47fc9ee4
```

### 3. Worktreeと作業ブランチの作成

issueの内容に基づいて適切なブランチ名を決定し、Worktreeとブランチを同時に作成します。

命名規則:

- 機能追加: `feature/issue-$ARGUMENTS-簡潔な説明`
- バグ修正: `fix/issue-$ARGUMENTS-簡潔な説明`
- リファクタリング: `refactor/issue-$ARGUMENTS-簡潔な説明`
- ドキュメント: `docs/issue-$ARGUMENTS-簡潔な説明`

```bash
# Worktreeパスとブランチ名を設定
MAIN_REPO=$(git rev-parse --show-toplevel)
REPO_NAME=$(basename "$MAIN_REPO")
WORKTREE_PATH="${MAIN_REPO}/../${REPO_NAME}-issue-$ARGUMENTS"
BRANCH_NAME="<ブランチ名>"

# masterを最新化し、Worktreeとブランチを同時に作成
git fetch origin master
git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" origin/master

# Worktreeに移動
cd "$WORKTREE_PATH"

# リモートにプッシュしてIssueに紐づけ
git push -u origin "$BRANCH_NAME"
gh issue develop $ARGUMENTS --base master --name "$BRANCH_NAME" || true

# バグ回避: gh issue develop --name が空のブランチセクションを作成するバグを回避
if git config --get 'branch..gh-merge-base' > /dev/null 2>&1; then
  git config --unset 'branch..gh-merge-base'
  echo "Note: gh issue develop によって作成された空のブランチセクションをクリーンアップしました"
else
  echo "Note: gh issue develop が空のブランチセクションを作成しなかったか、コマンド自体が失敗した可能性があります（バグが修正されたか、ネットワーク/認証エラーなど）"
fi
```

これにより、Worktreeが作成され、Issueの「Development」セクションにブランチが紐づけられます。

### 4. 依存関係のインストール

Worktreeは新しいディレクトリなので、依存関係をインストールします。

```bash
pnpm install
```

### 5. コードベースの調査

issueに関連するファイルやコードを調査し、影響範囲を把握してください。

### 6. 作業計画の作成

TodoWriteツールを使用して、以下の形式で作業項目を整理してください:

- TDD（テスト駆動開発）に従う: Red → Green → Refactor
- 各タスクは具体的かつ実行可能な単位に分割
- テストの作成を実装より先に計画

### 7. 実装開始

計画に従ってTDDで実装を進めてください:

1. **Red**: 失敗するテストを書く
2. **Green**: テストを通す最小限のコードを書く
3. **Refactor**: コードをリファクタリングする

### 8. 完了時

実装が完了したら、以下を確認してください:

```bash
pnpm build && pnpm test
```

すべてのチェックがパスしたら、`/create-pr` で `master` へのPRを作成してください。

**PRがマージされたら** `/done-issue $ARGUMENTS` を実行してWorktreeをクリーンアップしてください。

## Worktree情報

- **Worktreeパス**: `../<リポジトリ名>-issue-<Issue番号>`
- **例**: `../connpute-gikai-issue-5`

## Project情報（参照用）

- **Project ID**: `PVT_kwDOArIGY84BOa1H`
- **Project Number**: `3`
- **Status Field ID**: `PVTSSF_lADOArIGY84BOa1Hzg9IJzI`
- **Backlog Option ID**: `f75ad846`
- **In Progress Option ID**: `47fc9ee4`
- **Done Option ID**: `98236657`
