import type { MemberAdapter } from '../../types.js';

export class GoogleAdapter implements MemberAdapter {
  constructor(
    private apiKey: string,
    private modelId: string,
    private maxTokens: number,
  ) {}

  async speak(prompt: string, systemPrompt: string, temperature: number): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelId}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: this.maxTokens,
          temperature,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Google API error (${this.modelId}): ${response.status} ${body}`);
    }

    const data = (await response.json()) as {
      candidates: { content: { parts: { text: string }[] } }[];
    };
    return data.candidates[0].content.parts[0].text;
  }
}
