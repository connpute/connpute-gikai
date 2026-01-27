import type { MemberAdapter } from '../../types.js';

export class AnthropicAdapter implements MemberAdapter {
  constructor(
    private apiKey: string,
    private modelId: string,
    private maxTokens: number,
  ) {}

  async speak(prompt: string, systemPrompt: string, temperature: number): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.modelId,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        temperature,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic API error (${this.modelId}): ${response.status} ${body}`);
    }

    const data = (await response.json()) as {
      content: { type: string; text: string }[];
    };
    return data.content[0].text;
  }
}
