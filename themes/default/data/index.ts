import { 
  getPosts, 
  getSlugPosts, 
  getPostsTag,
  getPostsCategory, 
  getCategoryPosts
} from "./posts";
import { getPage } from "./page";

import type { 
  HomeContent, 
  PaginatedHomeContent, 
  PostContent, 
  PageContent 
} from "./types";

export async function getHomeContent(slug?: string): Promise<HomeContent[]> {
  const [posts] = await Promise.all([getPosts(slug)]);
  return [...posts];
}

export async function getPostContent(slug?: string): Promise<PostContent | null> {
  const posts = await Promise.resolve(
    getSlugPosts(slug)
  );
  return posts;
}

export async function getPostsCategoryContent(
  slug?: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedHomeContent> {
  return await getPostsCategory(slug, page, limit)
}

export async function getPostsTagContent(
  slug?: string,
  page: number = 1,
  limit: number = 20

): Promise<PaginatedHomeContent> {
  return await getPostsTag(slug, page, limit)
}

export async function getCategoryContent(slug?: string): Promise<HomeContent[]> {
  const [
    posts
  ] = await Promise.all([
    getCategoryPosts(10)
  ]);

  return [
    ...posts
  ];
}

export async function getPageContent(slug?: string): Promise<PageContent | null> {
  return getPage(slug);
}