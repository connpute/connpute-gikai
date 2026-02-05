---
name: create-issue
description: 新しいGitHub issueを作成し、Projectに追加する
argument-hint: '[タイトルまたは概要]'
disable-model-invocation: true
---

# create-issue

新しいGitHub issueを作成します。

## 引数

`$ARGUMENTS` にはissueのタイトルまたは概要を指定できます（省略可）。

## 手順

### 1. Issue内容の確認

引数が指定されている場合はそれを元に、指定されていない場合はユーザーに以下を確認してください:

- **タイトル**: 簡潔で具体的なタイトル
- **説明**: 問題の詳細、期待する動作、再現手順など
- **種別**: 以下から選択
  - `bug`: バグ報告
  - `enhancement`: 機能追加・改善
  - `documentation`: ドキュメント関連

### 2. ラベルの選択

種別に応じて適切なラベルを選択してください。

既存のラベルを確認:

```bash
gh label list
```

### 3. Issue作成

以下のコマンドでissueを作成してください。`--project` オプションで `connpute-gikai` プロジェクトに自動追加されます:

```bash
gh issue create --title "タイトル" --body "$(cat <<'EOF'
## 概要
問題や要望の概要を記載

## 詳細
- 詳細な説明
- 期待する動作
- 現在の動作（バグの場合）

## 再現手順（バグの場合）
1. 手順1
2. 手順2
3. 手順3

## 備考
その他の情報があれば記載
EOF
)" --label "ラベル" --project "connpute-gikai"
```

### 4. Backlogレーンの先頭に移動

Issue作成後、Project内でBacklogレーンの先頭に移動します。

```bash
# Issue番号からProject Item IDを取得
gh project item-list 3 --owner connpute --format json | jq -r '.items[] | select(.content.number == <ISSUE番号>) | .id'

# Backlogレーンの先頭に移動（GraphQL APIを使用）
gh api graphql -f query='
mutation {
  updateProjectV2ItemPosition(input: {
    projectId: "PVT_kwDOArIGY84BOa1H"
    itemId: "<ITEM_ID>"
    afterId: null
  }) {
    item { id }
  }
}'
```

### 5. 作成後の確認

issueが正しく作成されたか確認してください:

```bash
gh issue view <作成されたissue番号>
```

### 6. 次のアクション

issueの作成が完了したら、以下を提案してください:

- すぐに対応する場合: `/do-issue <issue番号>` の実行を提案
- 後で対応する場合: issueのURLを共有して完了
