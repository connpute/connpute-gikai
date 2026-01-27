import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Speech, Agenda, AnonymizedSpeech } from '../types.js';

const execFileAsync = promisify(execFile);

const SPEAKER_ROLE = `あなたは議会の議長です。中立的な立場で議事を進行してください。
あなたの役割は以下の通りです:
- 議題を構造化し、各議員に提示する
- 各議員の発言を要約・整理する
- 争点を明確にする
- 少数意見を保護し、多数派に再検討を促す
- 採決結果を集計し、最終決定を発表する

回答は日本語で行ってください。`;

export class Speaker {
  async structureAgenda(topic: string, context?: string): Promise<Agenda> {
    const prompt = `以下の議題を構造化してください。

議題: ${topic}
${context ? `補足情報: ${context}` : ''}

以下のJSON形式で回答してください（JSONのみ、他のテキストは不要）:
{
  "topic": "議題のタイトル",
  "decisionRequired": "決定すべき事項",
  "criteria": ["判断基準1", "判断基準2", "判断基準3"],
  "options": ["選択肢1", "選択肢2", "選択肢3"]
}`;

    const result = await this.callClaude(prompt);
    return JSON.parse(this.extractJson(result));
  }

  async summarizeRound(
    roundName: string,
    speeches: Speech[],
    protectMinority: boolean,
  ): Promise<{ summary: string; issues: string[] }> {
    const speechText = speeches
      .map((s) => `【${s.member.partyName} / ${s.member.name}】\n${s.content}`)
      .join('\n\n---\n\n');

    const minorityInstruction = protectMinority
      ? '\n- 少数派の意見を明示的に取り上げ、その論拠の妥当性を評価してください'
      : '';

    const prompt = `以下は「${roundName}」における各議員の発言です。

${speechText}

以下を行ってください:
1. 各党の立場を簡潔に要約する
2. 主要な争点（意見が分かれている論点）を抽出する${minorityInstruction}

以下のJSON形式で回答してください（JSONのみ、他のテキストは不要）:
{
  "summary": "各党の立場の要約（Markdown形式）",
  "issues": ["争点1", "争点2", "争点3"]
}`;

    const result = await this.callClaude(prompt);
    return JSON.parse(this.extractJson(result));
  }

  async generateRebuttalPrompt(
    speeches: Speech[],
    issues: string[],
    anonymize: boolean,
  ): Promise<string> {
    let speechList: string;

    if (anonymize) {
      const anonymized: AnonymizedSpeech[] = speeches.map((s, i) => ({
        id: `議員${String.fromCharCode(0x58 + i)}`, // X, Y, Z...
        content: s.content,
        round: s.round,
      }));
      speechList = anonymized
        .map((s) => `【${s.id}】\n${s.content}`)
        .join('\n\n---\n\n');
    } else {
      speechList = speeches
        .map((s) => `【${s.member.partyName} / ${s.member.name}】\n${s.content}`)
        .join('\n\n---\n\n');
    }

    return `以下は前ラウンドでの他の議員の発言です。

${speechList}

主要な争点:
${issues.map((i) => `- ${i}`).join('\n')}

他の議員の意見を踏まえ、以下について回答してください:
1. 他の議員の主張への具体的な反論（最低1つの反論を必須とする）
2. 自身の主張の弱点への対処方法
3. 妥協可能な点があればその条件

**重要:** 多数派の意見に同調する必要はありません。独自の分析に基づいて判断してください。`;
  }

  async tallyVotes(
    votes: { member: string; vote: string; ranking?: string[]; reason: string }[],
    options: string[],
    method: string,
  ): Promise<{ decision: string; rationale: string; conditions: string[] }> {
    const voteText = votes
      .map((v) => `${v.member}: 投票=${v.vote}, 理由=${v.reason}${v.ranking ? `, 順位=[${v.ranking.join(', ')}]` : ''}`)
      .join('\n');

    const prompt = `以下の採決結果を集計し、最終決定を行ってください。

投票方式: ${method}
選択肢: ${options.join(', ')}

各議員の投票:
${voteText}

以下のJSON形式で回答してください（JSONのみ、他のテキストは不要）:
{
  "decision": "採択された選択肢",
  "rationale": "決定理由の総括（各党の主要論点を含む、Markdown形式）",
  "conditions": ["付帯条件1", "付帯条件2"]
}`;

    const result = await this.callClaude(prompt);
    return JSON.parse(this.extractJson(result));
  }

  private async callClaude(prompt: string): Promise<string> {
    try {
      const { stdout } = await execFileAsync('claude', [
        '--print',
        '--output-format', 'text',
        '--max-turns', '1',
        '--system-prompt', SPEAKER_ROLE,
        prompt,
      ], {
        timeout: 120_000,
        maxBuffer: 1024 * 1024,
      });
      return stdout.trim();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Claude Code CLI error: ${msg}`);
    }
  }

  private extractJson(text: string): string {
    // Try to extract JSON from markdown code blocks or raw text
    const jsonBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonBlockMatch) return jsonBlockMatch[1].trim();

    // Try to find raw JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return jsonMatch[0];

    return text;
  }
}
