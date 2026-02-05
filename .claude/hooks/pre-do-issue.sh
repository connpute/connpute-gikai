#!/bin/bash
set -e

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // ""')

# gh issue view コマンドの場合のみ処理（do-issueの最初のステップ）
if [[ ! "$command" =~ gh\ issue\ view ]]; then
  exit 0
fi

# Issue番号を抽出
issue_number=$(echo "$command" | grep -oE 'gh issue view [0-9]+' | grep -oE '[0-9]+' || true)

if [[ -z "$issue_number" ]]; then
  exit 0
fi

# stdoutに出力することでClaude側にメッセージを伝える
cat << EOF

================================================================================
【Issue対応開始時の必須タスク】Issue #${issue_number}
================================================================================

Issue対応を開始する際は、以下の操作を必ず実行してください：

【1. ProjectステータスをIn Progressに移動】

\`\`\`bash
# Issue番号からProject Item IDを取得
ITEM_ID=\$(gh project item-list 3 --owner connpute --format json | jq -r '.items[] | select(.content.number == ${issue_number}) | .id')

# In Progressに移動
gh project item-edit --project-id PVT_kwDOArIGY84BOa1H --id "\$ITEM_ID" --field-id PVTSSF_lADOArIGY84BOa1Hzg9IJzI --single-select-option-id 47fc9ee4
\`\`\`

【Project情報（参照用）】
- Project ID: PVT_kwDOArIGY84BOa1H
- Status Field ID: PVTSSF_lADOArIGY84BOa1Hzg9IJzI
- In Progress Option ID: 47fc9ee4

================================================================================

EOF

exit 0
