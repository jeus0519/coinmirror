import { buildAiReflectionPrompt, AI_REFLECTION_TIMEOUT_MS } from './ai-reflection-api';
import { type AiReflectionGenerator } from './ai-reflection-runtime';

export const DEFAULT_AI_REFLECTION_OPENAI_MODEL = 'gpt-6-luna';

export type OpenAiReflectionGeneratorOptions = {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  fetch?: typeof fetch;
};

type ChatCompletionResponse = {
  choices?: { message?: { content?: string } }[];
};

function completionTokenLimitForModel(model: string) {
  return /^gpt-[56]/i.test(model) ? { max_completion_tokens: 420 } : { max_tokens: 420 };
}

export function createOpenAiReflectionGenerator(
  options: OpenAiReflectionGeneratorOptions = {}
): AiReflectionGenerator {
  return async (payload) => {
    const apiKey = options.apiKey?.trim();
    if (!apiKey) throw new Error('ai_reflection_not_configured');

    const fetchImpl = options.fetch ?? fetch;
    const prompt = buildAiReflectionPrompt(payload);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_REFLECTION_TIMEOUT_MS);

    try {
      const model = options.model ?? DEFAULT_AI_REFLECTION_OPENAI_MODEL;
      const response = await fetchImpl(
        options.endpoint ?? 'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model,
            temperature: 0.4,
            ...completionTokenLimitForModel(model),
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: prompt.system },
              { role: 'user', content: prompt.user },
            ],
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) throw new Error(`ai_reflection_http_${response.status}`);
      const data = (await response.json()) as ChatCompletionResponse;
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('ai_reflection_empty_response');
      return JSON.parse(content) as unknown;
    } finally {
      clearTimeout(timer);
    }
  };
}
