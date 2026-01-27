import type { MemberAdapter } from '../../types.js';

export class OpenAICompatibleAdapter implements MemberAdapter {
  constructor(
    private baseUrl: string,
    private apiKey: string | null,
    private modelId: string,
    private maxTokens: number,
  ) {}

  async speak(prompt: string, systemPrompt: string, temperature: number): Promise<string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: this.maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`API error (${this.modelId}): ${response.status} ${body}`);
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };
    return data.choices[0].message.content;
  }
}
