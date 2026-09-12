import { NextResponse } from "next/server";
import { ForbiddenError, UnauthorizedError } from "./rbac/permissions";

export function handleApiError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  console.error(error);
  return NextResponse.json({ error: "Erro interno" }, { status: 500 });
}
