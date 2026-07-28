import { describe, expect, test } from 'vitest';
import robots from './robots';
import sitemap from './sitemap';
import { hasDetail, pieces } from '@/content/music';
import { projects } from '@/content/projects';
import { SITE_URL } from '@/content/site';

describe('sitemap & robots', () => {
  const urls = sitemap().map((e) => e.url);

  test('covers every top-level page', () => {
    for (const path of ['/', '/projects', '/music', '/minesweeper', '/about']) {
      expect(urls).toContain(`${SITE_URL}${path}`);
    }
  });

  test('covers every project, and exactly the music pieces with pages', () => {
    for (const p of projects) {
      expect(urls).toContain(`${SITE_URL}/projects/${p.slug}`);
    }
    for (const p of pieces) {
      const url = `${SITE_URL}/music/${p.slug}`;
      if (hasDetail(p)) {
        expect(urls).toContain(url);
      } else {
        expect(urls).not.toContain(url);
      }
    }
  });

  test('robots allows everything and points at the sitemap', () => {
    const r = robots();
    expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    expect(r.rules).toEqual({ userAgent: '*', allow: '/' });
  });
});
