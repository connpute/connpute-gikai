#!/bin/bash
set -e

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // ""')

# gh issue create コマンドの場合のみ処理
if [[ ! "$command" =~ gh\ issue\ create ]]; then
  exit 0
fi

# stdoutに出力することでClaude側にメッセージを伝える
cat << 'EOF'

================================================================================
【Issue作成後の必須タスク】
================================================================================

Issue作成が完了しました。以下の操作を実行してください：

【1. Backlogレーンの先頭に移動】

作成したIssueをProjectのBacklogレーンの先頭に移動してください。

```bash
# Issue番号からProject Item IDを取得
ISSUE_NUMBER=<作成されたIssue番号>
ITEM_ID=$(gh project item-list 3 --owner connpute --format json | jq -r ".items[] | select(.content.number == $ISSUE_NUMBER) | .id")

# Backlogレーンの先頭に移動
gh api graphql -f query="
mutation {
  updateProjectV2ItemPosition(input: {
    projectId: \"PVT_kwDOArIGY84BOa1H\"
    itemId: \"$ITEM_ID\"
    afterId: null
  }) {
    item { id }
  }
}"
```

【2. 確認事項】
- IssueがProjectに追加されていることを確認
- Backlogレーンの先頭に表示されていることを確認

================================================================================

EOF

exit 0
