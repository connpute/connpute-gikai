---
name: create-pr
description: 現在のブランチからmasterへのPRを作成する
argument-hint: '[タイトルまたは概要]'
disable-model-invocation: true
---

# create-pr

現在のブランチから `master` へのPRを作成します。

## 引数

`$ARGUMENTS` にはPRのタイトルまたは概要を指定できます（省略可）。

## 手順

### 1. 現在のブランチ状態を確認

```bash
git status
git log --oneline master..HEAD
```

- 現在のブランチ名を確認し、`master` でないことを確認してください
- コミット済みの変更内容を把握してください
- 未コミットの変更がある場合は、先にコミットするか確認してください

### 2. リモートへプッシュ

```bash
git push -u origin $(git branch --show-current)
```

### 3. 品質チェックの実行

以下のコマンドを**すべて実行**し、**すべて成功**することを確認してください。

```bash
pnpm build
```

```bash
pnpm test
```

いずれかが失敗した場合は修正し、再度すべてのチェックを実行してください。すべて成功するまでPR作成に進んではいけません。

### 4. PR内容の作成

ブランチのコミット履歴と変更差分を確認してください:

```bash
git diff master...HEAD --stat
git log --oneline master..HEAD
```

以下の情報を整理してください:

- **タイトル**: 変更内容を簡潔に表すタイトル（引数が指定されていればそれを参考に）
- **概要**: 何を変更したか
- **変更内容**: 具体的な変更点のリスト
- **関連Issue**: ブランチ名からIssue番号を抽出する（下記参照）

#### 関連Issueの抽出

ブランチ名に `issue-XX` が含まれる場合（例: `feature/issue-5-add-adapter`）、Issue番号を抽出してPR本文に `Closes #XX` を含めてください。これによりPRマージ時にIssueが自動クローズされます。

```bash
# ブランチ名からIssue番号を抽出（POSIX互換）
git branch --show-current | grep -o 'issue-[0-9]\+' | grep -o '[0-9]\+'
```

Issue番号が取得できた場合は、PR本文の「関連Issue」セクションに `Closes #XX` を記載してください。取得できない場合は「なし」としてください。

### 5. PR作成

```bash
gh pr create --base master --title "タイトル" --body "$(cat <<'EOF'
## 概要
変更の概要を記載

## 変更内容
- 変更点1
- 変更点2

## テスト
- [x] `pnpm build` を実行した
- [x] `pnpm test` を実行した

## 関連Issue
Closes #XX（ブランチ名からIssue番号を抽出した場合）
EOF
)"
```

### 6. PR作成後のフロー

1. PRのURLを共有してください
2. **このPRに対して `/resolve-review` の手順を直ちに実行してください**
   - Copilot code reviewの完了を待機
   - レビューコメントの取得と対応
   - 変更のコミット/プッシュ
   - 各コメントへの返信
   - 完了報告

> **Note**: `/resolve-review` のスキルファイル（`.claude/skills/resolve-review/SKILL.md`）を参照し、そのステップ1から順に手順に従ってください。PRのURLが分かっている場合は、そのURLからPR番号を取得して `$ARGUMENTS` として渡してもかまいません。レビューコメントがない場合でもフローは正常に完了します。

## 注意事項

- PRのベースブランチは `master` です
- `master` への直接プッシュは避けてください（PR必須）
