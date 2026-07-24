import { createFileRoute } from "@tanstack/react-router";

async function proxy({ request, params }: { request: Request; params: { _splat?: string } }) {
  const base = process.env.FHIR_BASE_URL;
  const token = process.env.FHIR_BEARER_TOKEN;
  if (!base || !token) {
    return new Response(
      JSON.stringify({ error: "FHIR_BASE_URL or FHIR_BEARER_TOKEN not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const incomingUrl = new URL(request.url);
  const path = params._splat ?? "";
  const target = `${base.replace(/\/$/, "")}/${path}${incomingUrl.search}`;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  const accept = request.headers.get("accept");
  headers.set("Accept", accept ?? "application/fhir+json");
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const upstream = await fetch(target, {
    method,
    headers,
    body: body && body.byteLength > 0 ? body : undefined,
  });

  const respHeaders = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) respHeaders.set("Content-Type", ct);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  });
}

export const Route = createFileRoute("/api/fhir/$")({
  server: {
    handlers: {
      GET: proxy,
      POST: proxy,
      PUT: proxy,
      PATCH: proxy,
    },
  },
});
