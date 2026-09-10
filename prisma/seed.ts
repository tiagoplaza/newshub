import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSIONS, DEFAULT_ROLES } from "../src/lib/rbac/permissions";

const prisma = new PrismaClient();

async function main() {
  // 1. Cria todas as permissões do catálogo
  for (const key of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({ where: { key }, create: { key }, update: {} });
  }

  // 2. Cria o papel SUPER_ADMIN (bypassa checagem de permissão no código)
  //    e os papéis padrão com suas permissões
  const superAdminRole = await prisma.role.upsert({
    where: { slug: "super-admin" },
    create: { name: "Super Admin", slug: "super-admin", isSystem: true },
    update: {},
  });

  for (const [roleName, permissionKeys] of Object.entries(DEFAULT_ROLES)) {
    const role = await prisma.role.upsert({
      where: { slug: roleName.toLowerCase() },
      create: { name: roleName, slug: roleName.toLowerCase(), isSystem: true },
      update: {},
    });

    for (const key of permissionKeys) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        create: { roleId: role.id, permissionId: permission.id },
        update: {},
      });
    }
  }

  // 3. Usuário super-admin inicial — TROQUE a senha logo após o primeiro login
  const passwordHash = await bcrypt.hash("troque-esta-senha", 12);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    create: {
      name: "Administrador",
      email: "admin@example.com",
      passwordHash,
      roleId: superAdminRole.id,
    },
    update: {},
  });

  // 4. Tema padrão ativo
  await prisma.template.upsert({
    where: { slug: "default" },
    create: { slug: "default", name: "Tema Padrão", version: "1.0.0", active: true },
    update: {},
  });

  // 5. Configurações globais de SEO
  await prisma.seoSettings.upsert({
    where: { id: "global" },
    create: { id: "global", siteName: "Redação CMS", siteDescription: "Um site construído com o CMS." },
    update: {},
  });

  console.log("Seed concluído. Login inicial: admin@example.com / troque-esta-senha");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
