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

export async function GET() {
  const apiKey = process.env.COINMIRROR_AI_REFLECTION_OPENAI_API_KEY?.trim() ?? '';
  const model = process.env.COINMIRROR_AI_REFLECTION_MODEL?.trim() || 'gpt-6-luna';

  if (!apiKey) {
    return jsonResponse({ ok: false, runtimeKey: 'absent', model, secretValuePrinted: false });
  }

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
          { role: 'system', content: 'Return only JSON: {"ok": true}.' },
          { role: 'user', content: 'Return {"ok": true} as JSON.' },
        ],
        max_output_tokens: 80,
        text: { format: { type: 'json_object' } },
      }),
    });

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
        openaiStatus: response.status,
        openaiErrorType: error.type ?? null,
        openaiErrorCode: error.code ?? null,
        openaiErrorParam: error.param ?? null,
        openaiErrorMessageHead: sanitizeMessage(error.message, apiKey),
        secretValuePrinted: false,
      });
    }

    const outputText =
      typeof parsed?.output_text === 'string'
        ? parsed.output_text
        : parsed?.output
            ?.flatMap((item: any) => item.content ?? [])
            ?.find((item: any) => item.type === 'output_text')?.text;

    return jsonResponse({
      ok: true,
      runtimeKey: 'present',
      model,
      openaiStatus: response.status,
      responseStatus: parsed?.status ?? null,
      responseErrorType: parsed?.error?.type ?? null,
      incompleteReason: parsed?.incomplete_details?.reason ?? null,
      hasOutputText: typeof outputText === 'string' && outputText.trim().length > 0,
      outputTextHead: sanitizeMessage(outputText, apiKey),
      secretValuePrinted: false,
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      runtimeKey: 'present',
      model,
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
