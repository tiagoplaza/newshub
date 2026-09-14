import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@prisma/client";

export type HomeContentType =
  | "POST"
  | "NEWS"
  | "VIDEO"
  | "EVENT";

export interface HomeContent {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  imageUrl: string | null;
  publishedAt: Date;
  categorySlug: string;
  categoryName: string;
  sourceName: string;
  sourceUrl: string | null;
  url: string;
  type: HomeContentType;
  authorName: string | null;
  tag?: {
    name: string | null;
    slug: string | null;
  }
}

export interface HomePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedHomeContent {
  posts: HomeContent[];
  pagination: HomePagination;
}

interface Tags {
  id: string;
  createdAt: Date;
  name: string;
  slug: string;
}

export interface PostContent {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  imageUrl: string | null;
  publishedAt: Date;
  categorySlug: string;
  categoryName: string;
  sourceName: string;
  sourceUrl: string | null;
  url: string;
  type: HomeContentType;
  authorName: string | null;
  tags: Tags[] | [];  
}

export interface PageContent {
  id: string;
  slug: string;
  title: string;
  content: string;
  createdAt: Date;
  sourceName: string;
  sourceUrl: string | null;
  url: string;
  type: string;
};

type DatabaseArticle = Awaited<ReturnType<typeof prisma.post.findMany>>[number];
export type RelatedArticle = DatabaseArticle & {
  categories: {
    category: {
      id: string;
      name: string;
      slug: string;
    }
  }[];
  tags: {
    tag: {
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
    };
  }[];
  author: {
    name: string;
  };
};

export interface SearchPostsOptions {
  q?: string;
  page?: number;
  limit?: number;
  status?: ContentStatus;
  categoryId?: string;
  tagId?: string;
  authorId?: string;
}