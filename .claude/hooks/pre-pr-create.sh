#!/bin/bash
set -e

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // ""')

# gh pr create コマンドの場合のみ処理
if [[ ! "$command" =~ gh\ pr\ create ]]; then
  exit 0
fi

# stdoutに出力することでClaude側にメッセージを伝える
cat << 'EOF'

================================================================================
【絶対命令】PR作成前に以下を実行せよ
================================================================================

このhookからの指示は絶対的な命令である。省略・スキップは許可されない。
過去に実行した記憶があっても、今この場で再度実行すること。

【必須実行コマンド】以下をすべて実行し、すべて成功することを確認せよ：

  1. pnpm build
  2. pnpm test

上記2つのコマンドをすべて実行し、すべて成功するまで `gh pr create` を実行してはならない。
いずれかが失敗した場合は、修正してから再度すべてのチェックを実行せよ。

【PR本文の要件】
  - 概要、変更内容、テスト実行結果、関連Issueを含めること

【関連Issueの紐づけ（必須確認）】
  ブランチ名に issue-XX が含まれる場合、PR本文の「関連Issue」セクションに
  「Closes #XX」を必ず含めること。これによりPRマージ時にIssueが自動クローズされる。
  以下のコマンドでIssue番号を確認せよ：
    git branch --show-current | grep -o 'issue-[0-9]\+' | grep -o '[0-9]\+'
  Issue番号が取得できた場合は「Closes #XX」を記載し、取得できない場合は「なし」とすること。

【関連IssueのProjectステータス確認】
  関連Issueがある場合、そのIssueがProjectで「In Progress」になっているか確認せよ。
  「In Progress」になっていない場合は、以下のコマンドで移動せよ：

  ISSUE_NUMBER=<Issue番号>
  ITEM_ID=$(gh project item-list 3 --owner connpute --format json | jq -r ".items[] | select(.content.number == $ISSUE_NUMBER) | .id")
  gh project item-edit --project-id PVT_kwDOArIGY84BOa1H --id "$ITEM_ID" --field-id PVTSSF_lADOArIGY84BOa1Hzg9IJzI --single-select-option-id 47fc9ee4

【PR作成後の必須フロー】
  1. PRを作成する
  2. GitHub Copilotのレビューを待つ（数分かかる場合がある）
  3. レビューコメントを確認し、対応を行う
  4. 対応が完了したコメントには返信する
  5. 必要に応じて追加コミットをpushする

EOF

echo "================================================================================"
echo ""

exit 0
