
# NewsHub

NewsHub é um CMS editorial para criar e publicar notícias, artigos e páginas. O projeto combina uma interface pública de conteúdo com um painel administrativo para redação e gerenciamento do site.

## O que o projeto oferece

- Publicação de posts com rascunho, revisão, agendamento, arquivamento e lixeira.
- Páginas institucionais e templates de conteúdo.
- Categorias, tags, comentários e menus de navegação.
- Biblioteca de mídia com upload de imagens.
- Usuários, papéis e permissões de acesso.
- Configurações de SEO, sitemap, robots.txt e `llms.txt`.
- Temas extensíveis; o tema padrão está em `themes/default`.

## Tecnologias

- Next.js 15 com App Router e React 19.
- TypeScript e Tailwind CSS.
- Prisma ORM com banco de dados MySQL.
- Autenticação própria baseada em sessão e cookie.

## Pré-requisitos

- Node.js 20 ou superior.
- npm.
- MySQL 8 ou compatível.

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone <url-do-repositorio>
cd newshub
npm install
```

Crie um banco MySQL e configure as variáveis de ambiente em um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/newshub"
SITE_URL="http://localhost:3000"
```

Sincronize o schema com o banco e execute o seed inicial:

```bash
npx prisma generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

O seed cria os papéis, permissões, o tema padrão e um usuário administrador:

```text
E-mail: admin@example.com
Senha:  troque-esta-senha
```

Altere a senha assim que fizer o primeiro login.

## Como rodar em desenvolvimento

Inicie o servidor:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) para acessar o site e [http://localhost:3000/admin/login](http://localhost:3000/admin/login) para acessar o painel administrativo.

## Uploads de mídia

Por padrão, os arquivos são salvos localmente em `public/uploads`. Esse modo exige um filesystem persistente e é adequado para desenvolvimento ou servidores com disco persistente.

Para usar um storage compatível com S3, defina:

```env
STORAGE_DRIVER="s3"
S3_ENDPOINT="https://endpoint-do-storage"
S3_REGION="auto"
S3_BUCKET="nome-do-bucket"
S3_ACCESS_KEY_ID="sua-chave"
S3_SECRET_ACCESS_KEY="seu-segredo"
S3_PUBLIC_URL_BASE="https://cdn.exemplo.com"
```

O storage S3 é recomendado para deploys serverless ou com múltiplas instâncias. O campo `S3_PUBLIC_URL_BASE` é opcional; quando omitido, o endpoint S3 é usado como base pública.

## Comandos disponíveis

```bash
npm run dev             # servidor de desenvolvimento
npm run build           # gera a versão de produção
npm run start           # inicia a versão de produção
npm run prisma:migrate  # cria/aplica uma migração Prisma
npm run prisma:seed     # popula dados iniciais
npm run prisma:studio   # abre o Prisma Studio
npm run lint            # executa o lint do projeto
```

## Executar em produção

Configure as variáveis de ambiente de produção, instale as dependências e aplique o schema do banco. Depois, gere o build e inicie o servidor:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

O servidor de produção usa a porta `3000` por padrão. Para alterar a porta, use a opção do Next.js, por exemplo `npm run start -- -p 4000`.

## Estrutura principal

```text
src/app/       Rotas públicas, painel administrativo e APIs
src/components Componentes reutilizáveis do site e do admin
src/lib/       Prisma, autenticação, permissões e armazenamento
prisma/        Schema e seed do banco de dados
themes/        Temas e layouts da apresentação pública
public/        Arquivos estáticos e uploads locais
```

## Documentação externa

- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [MySQL](https://dev.mysql.com/doc/)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
