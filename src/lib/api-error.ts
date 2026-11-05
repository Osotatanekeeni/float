export interface ApiErrorBody {
  code: string;
  message: string;
  fields?: Record<string, string>;
  requestId: string;
}

/** The one error shape every route returns: { code, message, fields?, requestId }. */
export function apiError(
  status: number,
  code: string,
  message: string,
  options: { fields?: Record<string, string>; requestId?: string } = {},
): Response {
  const requestId = options.requestId ?? crypto.randomUUID();
  const body: ApiErrorBody = { code, message, ...(options.fields ? { fields: options.fields } : {}), requestId };
  return Response.json(body, { status, headers: { "cache-control": "no-store", "x-request-id": requestId } });
}
