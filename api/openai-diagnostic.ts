import { buildAiReflectionPrompt } from '../src/lib/ai-reflection-api';
import { validateAiReflectionOutput } from '../src/lib/ai-reflection-runtime';
import { type AiBehaviorCoachingSafePayload } from '../src/lib/ai-coaching';

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function sanitizeMessage(message: unknown, apiKey: string) {
  return String(message ?? '')
    .replace(apiKey, '[REDACTED]')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[REDACTED]')
    .slice(0, 320);
}

function extractOutputText(data: any) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text;
  return data?.output
    ?.flatMap((item: any) => item.content ?? [])
    ?.find((item: any) => item.type === 'output_text' && typeof item.text === 'string')?.text;
}

const payload: AiBehaviorCoachingSafePayload = {
  schemaVersion: 'coinmirror.aiReflection.v1',
  generalMbti: 'INTJ',
  coachingType: 'trade_frequency_check',
  keySignals: [
    {
      metricId: 'F6',
      displayName: '거래 빈도',
      scoreBand: 'caution',
      scoreBucket: '0_54',
      sampleSizeBucket: '10_49',
    },
    {
      metricId: 'F7',
      displayName: '새벽거래',
      scoreBand: 'observe',
      scoreBucket: '55_79',
      sampleSizeBucket: '10_49',
    },
  ],
  comparisonHint: 'self_perception_available',
  requestedOutput: ['observedPattern', 'reduceAction', 'reinforceAction', 'nextQuestion'],
};

export async function GET() {
  const apiKey = process.env.COINMIRROR_AI_REFLECTION_OPENAI_API_KEY?.trim() ?? '';
  const model = process.env.COINMIRROR_AI_REFLECTION_MODEL?.trim() || 'gpt-6-luna';

  if (!apiKey) {
    return jsonResponse({ ok: false, runtimeKey: 'absent', model, secretValuePrinted: false });
  }

  const prompt = buildAiReflectionPrompt(payload);
  const started = Date.now();

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        max_output_tokens: 420,
        text: { format: { type: 'json_object' } },
      }),
    });

    const durationMs = Date.now() - started;
    const text = await response.text();
    let parsed: any = undefined;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = undefined;
    }

    if (!response.ok) {
      const error = parsed?.error ?? {};
      return jsonResponse({
        ok: false,
        runtimeKey: 'present',
        model,
        durationMs,
        openaiStatus: response.status,
        openaiErrorType: error.type ?? null,
        openaiErrorCode: error.code ?? null,
        openaiErrorParam: error.param ?? null,
        openaiErrorMessageHead: sanitizeMessage(error.message, apiKey),
        secretValuePrinted: false,
      });
    }

    const outputText = extractOutputText(parsed);
    let output: unknown = undefined;
    try {
      output = JSON.parse(outputText ?? '');
    } catch {
      output = undefined;
    }
    const validation = validateAiReflectionOutput(output);

    return jsonResponse({
      ok: true,
      runtimeKey: 'present',
      model,
      durationMs,
      openaiStatus: response.status,
      responseStatus: parsed?.status ?? null,
      incompleteReason: parsed?.incomplete_details?.reason ?? null,
      hasOutputText: typeof outputText === 'string' && outputText.trim().length > 0,
      outputTextLength: typeof outputText === 'string' ? outputText.length : 0,
      outputParseOk: output !== undefined,
      validationOk: validation.ok,
      validationError: validation.ok ? null : validation.error,
      outputKeys:
        output && typeof output === 'object' && !Array.isArray(output)
          ? Object.keys(output as Record<string, unknown>)
          : [],
      secretValuePrinted: false,
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      runtimeKey: 'present',
      model,
      durationMs: Date.now() - started,
      openaiStatus: null,
      openaiErrorType: error instanceof Error ? error.name : typeof error,
      openaiErrorCode: null,
      openaiErrorMessageHead: sanitizeMessage(
        error instanceof Error ? error.message : error,
        apiKey
      ),
      secretValuePrinted: false,
    });
  }
}
