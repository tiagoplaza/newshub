import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, requireUser, PERMISSIONS } from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";
import { saveUploadedFile, InvalidFileError } from "@/lib/media/storage";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireUser(user);

    const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
    const pageSize = 40;

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        orderBy: { createdAt: "desc" },
        // skip: (page - 1) * pageSize,
        // take: pageSize,
        include: { uploader: { select: { name: true } } },
      }),
      prisma.media.count(),
    ]);

    return NextResponse.json({ media, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireUser(user);
    if (!hasPermission(user, PERMISSIONS.MEDIA_UPLOAD)) {
      return NextResponse.json({ error: "Sem permissão para enviar mídia" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const altText = formData.get("altText");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    let saved;
    try {
      saved = await saveUploadedFile(file);
    } catch (err) {
      if (err instanceof InvalidFileError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

    const media = await prisma.media.create({
      data: {
        url: saved.url,
        filename: saved.filename,
        mimeType: saved.mimeType,
        size: saved.size,
        altText: typeof altText === "string" ? altText : undefined,
        uploadedBy: user.id,
      },
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
