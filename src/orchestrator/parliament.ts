import type {
  Party, Member, Speech, Vote, VoteResult, Agenda,
  ParliamentConfig, ModelsConfig, ProtocolConfig,
  RoundRecord, ProvisionalVote, OpinionShift, SessionMinutes,
} from '../types.js';
import { Speaker } from './speaker.js';
import { tallyVotes } from '../protocol/vote.js';
import { loadManifesto } from '../config/loader.js';
import { createMember } from '../members/factory.js';
import { generateMinutes } from '../records/minutes.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export class Parliament {
  private speaker: Speaker;
  private parties: Party[] = [];
  private protocol: ProtocolConfig;

  constructor(
    private config: ParliamentConfig,
    private modelsConfig: ModelsConfig,
    private projectRoot: string,
  ) {
    this.speaker = new Speaker();
    this.protocol = config.protocol;
  }

  async initialize(): Promise<void> {
    const manifestoDir = resolve(this.projectRoot, 'src', 'parties', 'manifesto');

    for (const partyConfig of this.config.parties) {
      const manifesto = await loadManifesto(manifestoDir, partyConfig.manifesto);
      const members: Member[] = partyConfig.members.map((mc) =>
        createMember(mc, partyConfig.name, this.modelsConfig),
      );
      this.parties.push({ name: partyConfig.name, manifesto, members });
    }

    const total = this.parties.reduce((sum, p) => sum + p.members.length, 0);
    console.log(`議会を構成: ${this.parties.length}党, ${total}名の議員`);
  }

  async session(topic: string, context?: string): Promise<string> {
    console.log('\n══════════════════════════════════════');
    console.log('  議 会 開 会');
    console.log('══════════════════════════════════════\n');

    // ① 開会: 議題の構造化
    console.log('【開会】議題を構造化しています...');
    const agenda = await this.speaker.structureAgenda(topic, context);
    console.log(`  議題: ${agenda.topic}`);
    console.log(`  決定事項: ${agenda.decisionRequired}`);
    console.log(`  判断基準: ${agenda.criteria.join(', ')}`);
    if (agenda.options) {
      console.log(`  選択肢: ${agenda.options.join(', ')}`);
    }

    const rounds: RoundRecord[] = [];
    let allSpeeches: Speech[] = [];

    // ② 第1読会: 所信表明
    console.log('\n【第1読会】所信表明...');
    const firstReadingPrompt = this.buildFirstReadingPrompt(agenda);
    const firstReadingTemp = this.protocol.contentiousness?.first_reading ?? 0.8;
    const firstSpeeches = await this.collectSpeeches('第1読会', firstReadingPrompt, firstReadingTemp);
    allSpeeches.push(...firstSpeeches);

    const firstSummary = await this.speaker.summarizeRound(
      '第1読会',
      firstSpeeches,
      this.protocol.sycophancy_prevention?.protect_minority_opinion ?? false,
    );
    rounds.push({
      round: '第1読会',
      speeches: firstSpeeches,
      summary: firstSummary.summary,
      issues: firstSummary.issues,
    });
    console.log(`  争点: ${firstSummary.issues.join(', ')}`);

    // 仮投票の記録
    const provisionalVotes = this.extractProvisionalVotes(firstSpeeches, agenda);

    // ③ 第2読会: 反論・質疑
    if (this.protocol.rounds >= 2) {
      console.log('\n【第2読会】反論・質疑...');
      const anonymize = this.protocol.sycophancy_prevention?.anonymize_sources ?? false;
      const rebuttalPrompt = await this.speaker.generateRebuttalPrompt(
        firstSpeeches,
        firstSummary.issues,
        anonymize,
      );
      const secondReadingTemp = this.protocol.contentiousness?.second_reading ?? 0.6;
      const secondSpeeches = await this.collectSpeeches('第2読会', rebuttalPrompt, secondReadingTemp);
      allSpeeches.push(...secondSpeeches);

      const secondSummary = await this.speaker.summarizeRound(
        '第2読会',
        secondSpeeches,
        this.protocol.sycophancy_prevention?.protect_minority_opinion ?? false,
      );
      rounds.push({
        round: '第2読会',
        speeches: secondSpeeches,
        summary: secondSummary.summary,
        issues: secondSummary.issues,
      });
    }

    // ⑤ 採決
    console.log('\n【採決】投票を実施...');
    const options = agenda.options ?? this.inferOptions(allSpeeches);
    const votePrompt = this.buildVotePrompt(options, rounds);
    const votes = await this.collectVotes(votePrompt, options);
    const voteResult = tallyVotes(votes, options, this.protocol.vote_method);

    // 議長による最終決定
    const decision = await this.speaker.tallyVotes(
      votes.map((v) => ({
        member: `${v.member.partyName}/${v.member.name}`,
        vote: v.vote,
        ranking: v.ranking,
        reason: v.reason,
      })),
      options,
      this.protocol.vote_method,
    );

    // 意見変更の記録
    const opinionShifts = this.detectOpinionShifts(provisionalVotes, votes);

    console.log('\n══════════════════════════════════════');
    console.log(`  最終決定: ${decision.decision}`);
    console.log('══════════════════════════════════════\n');

    // ⑥ 閉会: 議事録の生成・保存
    const minutes: SessionMinutes = {
      date: new Date(),
      agenda: agenda.topic,
      decisionRequired: agenda.decisionRequired,
      criteria: agenda.criteria,
      context,
      parties: this.parties.map((p) => ({ name: p.name, memberCount: p.members.length })),
      rounds,
      provisionalVotes,
      voteResult,
      opinionShifts,
      finalDecision: decision.decision,
      rationale: decision.rationale,
      conditions: decision.conditions,
    };

    const markdown = generateMinutes(minutes);
    const outputPath = await this.saveMinutes(agenda.topic, markdown);
    console.log(`議事録を保存しました: ${outputPath}`);

    return outputPath;
  }

  private async collectSpeeches(
    round: string,
    prompt: string,
    temperature: number,
  ): Promise<Speech[]> {
    const allMembers = this.parties.flatMap((p) =>
      p.members.map((m) => ({ member: m, manifesto: p.manifesto })),
    );

    const results = await Promise.allSettled(
      allMembers.map(async ({ member, manifesto }) => {
        console.log(`  ${member.identity.partyName}/${member.identity.name} 発言中...`);
        const content = await member.adapter.speak(prompt, manifesto, temperature);
        return {
          member: member.identity,
          content,
          round,
          timestamp: new Date(),
        } satisfies Speech;
      }),
    );

    const speeches: Speech[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        speeches.push(result.value);
      } else {
        console.error(`  エラー: ${result.reason}`);
      }
    }
    return speeches;
  }

  private async collectVotes(prompt: string, options: string[]): Promise<Vote[]> {
    const allMembers = this.parties.flatMap((p) =>
      p.members.map((m) => ({ member: m, manifesto: p.manifesto })),
    );

    const voteTemp = 0.3; // Low temperature for voting to ensure structured output
    const results = await Promise.allSettled(
      allMembers.map(async ({ member, manifesto }) => {
        console.log(`  ${member.identity.partyName}/${member.identity.name} 投票中...`);
        const raw = await member.adapter.speak(prompt, manifesto, voteTemp);
        return this.parseVote(member.identity, raw, options);
      }),
    );

    const votes: Vote[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        votes.push(result.value);
      } else {
        console.error(`  投票エラー: ${result.reason}`);
      }
    }
    return votes;
  }

  private parseVote(
    member: Speech['member'],
    raw: string,
    options: string[],
  ): Vote {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          member,
          vote: parsed.vote ?? options[0],
          ranking: parsed.ranking,
          reason: parsed.reason ?? '',
          conditions: parsed.conditions,
        };
      }
    } catch {
      // Fall through to text-based parsing
    }

    // Fallback: find the first mentioned option
    const found = options.find((opt) => raw.includes(opt));
    return {
      member,
      vote: found ?? options[0],
      reason: raw.slice(0, 200),
    };
  }

  private buildFirstReadingPrompt(agenda: Agenda): string {
    return `以下の議題について、貴党の立場から意見を述べてください。

議題: ${agenda.topic}
決定事項: ${agenda.decisionRequired}
判断基準: ${agenda.criteria.join(', ')}
${agenda.options ? `選択肢: ${agenda.options.join(', ')}` : ''}

推奨する選択肢とその根拠を、判断基準に沿って説明してください。
結論を先に述べ、根拠を後に述べてください。`;
  }

  private buildVotePrompt(options: string[], rounds: RoundRecord[]): string {
    const summaries = rounds.map((r) => `## ${r.round}\n${r.summary}`).join('\n\n');

    return `これまでの議論を踏まえ、以下の選択肢について投票してください。

${summaries}

選択肢: ${options.join(', ')}

以下のJSON形式で回答してください（JSONのみ、他のテキストは不要）:
{
  "vote": "最も支持する選択肢",
  "ranking": ["第1希望", "第2希望", "第3希望"],
  "reason": "投票理由（1-2文）",
  "conditions": "この選択肢が採択される場合の付帯条件（あれば、なければnull）"
}`;
  }

  private extractProvisionalVotes(speeches: Speech[], agenda: Agenda): ProvisionalVote[] {
    if (!agenda.options) return [];
    return speeches.map((s) => {
      const found = agenda.options!.find((opt) => s.content.includes(opt));
      return { member: `${s.member.partyName}/${s.member.name}`, choice: found ?? '不明' };
    });
  }

  private detectOpinionShifts(provisional: ProvisionalVote[], finalVotes: Vote[]): OpinionShift[] {
    const shifts: OpinionShift[] = [];
    for (const pv of provisional) {
      const final = finalVotes.find(
        (v) => `${v.member.partyName}/${v.member.name}` === pv.member,
      );
      if (final && final.vote !== pv.choice && pv.choice !== '不明') {
        shifts.push({
          member: pv.member,
          from: pv.choice,
          to: final.vote,
          reason: final.reason,
        });
      }
    }
    return shifts;
  }

  private inferOptions(speeches: Speech[]): string[] {
    // Ask speaker to infer options from discussion
    const allContent = speeches.map((s) => s.content).join('\n');
    // Simple heuristic: this will be improved later
    return ['選択肢A', '選択肢B', '選択肢C'];
  }

  private async saveMinutes(topic: string, markdown: string): Promise<string> {
    const dir = resolve(this.projectRoot, 'records');
    await mkdir(dir, { recursive: true });
    const dateStr = new Date().toISOString().slice(0, 10);
    const safeTopic = topic.replace(/[/\\?%*:|"<>]/g, '-').slice(0, 50);
    const filename = `${dateStr}_${safeTopic}.md`;
    const filepath = resolve(dir, filename);
    await writeFile(filepath, markdown, 'utf-8');
    return filepath;
  }
}
