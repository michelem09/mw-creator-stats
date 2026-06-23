import { NextRequest } from "next/server";
import { getPageContext } from "@/lib/scrape/buildId";
import { AuthError, resolveCookie } from "@/lib/scrape/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { cookie?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const cookie = resolveCookie(body.cookie);
  if (!cookie) {
    return Response.json(
      { ok: false, error: "No cookie provided and MW_COOKIE not set." },
      { status: 400 },
    );
  }
  try {
    const { buildId } = await getPageContext(cookie);
    return Response.json({ ok: true, buildId });
  } catch (e) {
    const isAuth = e instanceof AuthError;
    return Response.json(
      {
        ok: false,
        auth: isAuth,
        error: isAuth
          ? "MakerWorld rejected this cookie (401/403). It is missing or expired."
          : e instanceof Error
            ? e.message
            : String(e),
      },
      { status: 200 },
    );
  }
}
