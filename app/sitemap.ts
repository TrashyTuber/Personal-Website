import type { MetadataRoute } from 'next';
import { hasDetail, pieces } from '@/content/music';
import { projects } from '@/content/projects';
import { SITE_URL } from '@/content/site';

/**
 * Every top-level page, by hand. ADDING A NEW PAGE? ADD ITS ROUTE HERE —
 * this is the one list Google crawls from. Content-driven detail pages
 * (every project, music pieces once they earn a page) are derived below
 * and need nothing.
 */
const STATIC_ROUTES = ['/', '/projects', '/music', '/minesweeper', '/about'];

export default function sitemap(): MetadataRoute.Sitemap {
  // Build-time stamp: the whole site redeploys as a unit, so one date.
  const lastModified = new Date();
  return [
    ...STATIC_ROUTES,
    ...projects.map((p) => `/projects/${p.slug}`),
    ...pieces.filter(hasDetail).map((p) => `/music/${p.slug}`),
  ].map((path) => ({ url: `${SITE_URL}${path}`, lastModified }));
}
