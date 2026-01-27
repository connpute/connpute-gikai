import type { SessionMinutes, RoundRecord, VoteResult } from '../types.js';

export function generateMinutes(minutes: SessionMinutes): string {
  const lines: string[] = [];

  // Header
  lines.push(`# 議事録: ${minutes.agenda}`);
  lines.push('');
  lines.push(`**日時:** ${formatDate(minutes.date)}`);
  lines.push(`**議題:** ${minutes.agenda}`);
  lines.push(`**決定事項:** ${minutes.decisionRequired}`);
  const totalMembers = minutes.parties.reduce((s, p) => s + p.memberCount, 0);
  const partyDetail = minutes.parties.map((p) => `${p.name}${p.memberCount}名`).join('、');
  lines.push(`**出席:** ${totalMembers}名（${partyDetail}）`);
  lines.push(`**判断基準:** ${minutes.criteria.join('、')}`);
  if (minutes.context) {
    lines.push(`**補足情報:** ${minutes.context}`);
  }
  lines.push('');
  lines.push('---');

  // Rounds
  for (const round of minutes.rounds) {
    lines.push('');
    lines.push(`## ${round.round}`);
    lines.push('');
    lines.push(renderRound(round));
  }

  // Provisional votes
  if (minutes.provisionalVotes.length > 0) {
    lines.push('');
    lines.push('## 仮投票（第1読会終了時点）');
    lines.push('');
    lines.push('| 議員 | 推奨 |');
    lines.push('|------|------|');
    for (const pv of minutes.provisionalVotes) {
      lines.push(`| ${pv.member} | ${pv.choice} |`);
    }
    lines.push('');
  }

  // Vote result
  lines.push('');
  lines.push('## 採決結果');
  lines.push('');
  lines.push(renderVoteResult(minutes.voteResult));

  // Opinion shifts
  if (minutes.opinionShifts.length > 0) {
    lines.push('');
    lines.push('### 意見変更の記録');
    lines.push('');
    lines.push('| 議員 | 仮投票 | 最終投票 | 変更理由 |');
    lines.push('|------|--------|---------|---------|');
    for (const shift of minutes.opinionShifts) {
      lines.push(`| ${shift.member} | ${shift.from} | ${shift.to} | ${shift.reason} |`);
    }
    lines.push('');
  }

  // Final decision
  lines.push('');
  lines.push('## 最終決定');
  lines.push('');
  lines.push(`**${minutes.finalDecision}**`);
  lines.push('');
  lines.push('### 決定理由');
  lines.push('');
  lines.push(minutes.rationale);
  lines.push('');

  if (minutes.conditions.length > 0) {
    lines.push('### 付帯条件');
    lines.push('');
    for (const cond of minutes.conditions) {
      lines.push(`- ${cond}`);
    }
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(`*本議事録は connpute-gikai (AI議会式意思決定システム) により自動生成されました。*`);

  return lines.join('\n');
}

function renderRound(round: RoundRecord): string {
  const lines: string[] = [];

  // Group speeches by party
  const byParty = new Map<string, typeof round.speeches>();
  for (const speech of round.speeches) {
    const party = speech.member.partyName;
    if (!byParty.has(party)) byParty.set(party, []);
    byParty.get(party)!.push(speech);
  }

  for (const [party, speeches] of byParty) {
    lines.push(`### ${party}`);
    lines.push('');
    for (const speech of speeches) {
      lines.push(`**${speech.member.name}** (${speech.member.model})`);
      lines.push('');
      lines.push(speech.content);
      lines.push('');
    }
  }

  // Summary
  lines.push('### 議長による要約');
  lines.push('');
  lines.push(round.summary);
  lines.push('');

  if (round.issues.length > 0) {
    lines.push('### 争点');
    lines.push('');
    for (const issue of round.issues) {
      lines.push(`- ${issue}`);
    }
  }

  return lines.join('\n');
}

function renderVoteResult(result: VoteResult): string {
  const lines: string[] = [];

  lines.push(`**投票方式:** ${translateMethod(result.method)}`);
  lines.push('');
  lines.push('| 選択肢 | 得票数 | 投票者 |');
  lines.push('|--------|--------|--------|');
  for (const detail of result.details) {
    lines.push(`| ${detail.option} | ${detail.count}票 | ${detail.voters.join(', ')} |`);
  }

  if (result.castingVote) {
    lines.push('');
    lines.push('*同数のため議長が決定票を投じました。*');
  }

  return lines.join('\n');
}

function translateMethod(method: string): string {
  switch (method) {
    case 'ranked': return '順位付き投票';
    case 'simple_majority': return '単純多数決';
    case 'consensus': return 'コンセンサス方式';
    default: return method;
  }
}

function formatDate(date: Date): string {
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  });
}
