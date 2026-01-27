import type { MemberAdapter, AdapterConfig, ModelsConfig, MemberConfig, Member, MemberIdentity } from '../types.js';
import { OpenAICompatibleAdapter } from './adapters/openai-compatible.js';
import { AnthropicAdapter } from './adapters/anthropic.js';
import { GoogleAdapter } from './adapters/google.js';

function getApiKey(envVar: string | null): string | null {
  if (!envVar) return null;
  const key = process.env[envVar];
  if (!key) {
    console.warn(`Warning: ${envVar} is not set`);
    return null;
  }
  return key;
}

function createAdapter(adapterName: string, adapterConfig: AdapterConfig, modelName: string): MemberAdapter {
  const modelConfig = adapterConfig.models[modelName];
  if (!modelConfig) {
    throw new Error(`Model "${modelName}" not found in adapter "${adapterName}"`);
  }

  const apiKey = getApiKey(adapterConfig.api_key_env);

  switch (adapterName) {
    case 'anthropic':
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required');
      return new AnthropicAdapter(apiKey, modelConfig.id, modelConfig.max_tokens);

    case 'google':
      if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is required');
      return new GoogleAdapter(apiKey, modelConfig.id, modelConfig.max_tokens);

    // OpenAI, DeepSeek, xAI, Ollama are all OpenAI-compatible
    case 'openai':
    case 'deepseek':
    case 'xai':
    case 'ollama':
      return new OpenAICompatibleAdapter(
        adapterConfig.base_url,
        apiKey,
        modelConfig.id,
        modelConfig.max_tokens,
      );

    default:
      throw new Error(`Unknown adapter: ${adapterName}`);
  }
}

export function createMember(
  memberConfig: MemberConfig,
  partyName: string,
  modelsConfig: ModelsConfig,
): Member {
  const adapterConfig = modelsConfig.adapters[memberConfig.adapter];
  if (!adapterConfig) {
    throw new Error(`Adapter "${memberConfig.adapter}" not found in models config`);
  }

  const adapter = createAdapter(memberConfig.adapter, adapterConfig, memberConfig.model);

  const identity: MemberIdentity = {
    name: memberConfig.name,
    partyName,
    adapterName: memberConfig.adapter,
    model: memberConfig.model,
  };

  return { identity, adapter };
}
