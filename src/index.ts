#!/usr/bin/env node

import { resolve } from 'node:path';
import { loadParliamentConfig, loadModelsConfig } from './config/loader.js';
import { Parliament } from './orchestrator/parliament.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const topic = args.filter((a) => !a.startsWith('--')).join(' ');
  const contextFlag = args.indexOf('--context');
  const context = contextFlag !== -1 ? args[contextFlag + 1] : undefined;

  if (!topic) {
    console.error('エラー: 議題を指定してください');
    printUsage();
    process.exit(1);
  }

  const projectRoot = resolve(import.meta.dirname, '..');
  const configDir = resolve(projectRoot, 'src', 'config');

  console.log('設定を読み込み中...');
  const parliamentConfig = await loadParliamentConfig(configDir);
  const modelsConfig = await loadModelsConfig(configDir);

  const parliament = new Parliament(parliamentConfig, modelsConfig, projectRoot);
  await parliament.initialize();

  const outputPath = await parliament.session(topic, context);
  console.log(`\n完了。議事録: ${outputPath}`);
}

function printUsage() {
  console.log(`
connpute-gikai - AI議会式意思決定システム

使い方:
  gikai <議題>                          議題について議会を開会する
  gikai <議題> --context <補足情報>      補足情報付きで議会を開会する

例:
  gikai "次期プロジェクトのデータベース選定: PostgreSQL vs MongoDB vs DynamoDB"
  gikai "フロントエンドフレームワーク選定" --context "チームの経験: React 3年, Vue 1年"

オプション:
  --context <text>   議題の補足情報
  --help, -h         このヘルプを表示
`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
