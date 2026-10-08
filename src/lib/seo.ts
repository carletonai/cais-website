import seo from "@/data/seo.json";
import { findEventBySlug } from "@/lib/events";
import { eventPageMeta } from "@/lib/shared/event-meta.js";

export interface RouteMeta {
  title: string;
  description: string;
}

const routes: Record<string, RouteMeta> = seo.routes;

export const { siteName, siteUrl, image: seoImage } = seo;

/** Full document title for a route: the home page owns the bare site name. */
export const titleFor = (meta: RouteMeta) =>
  meta.title === siteName ? meta.title : `${meta.title} | ${siteName}`;

/** Route metadata for a pathname, falling back to the home entry. Trailing
 *  slashes matter here: static hosts may serve /contact/ for /contact. */
export const metaFor = (pathname: string): RouteMeta => {
  const path = pathname.replace(/\/+$/, "") || "/";
  const slug = /^\/events\/([^/]+)$/.exec(path)?.[1];
  const event = slug ? findEventBySlug(slug) : undefined;
  if (event) return eventPageMeta(event);
  return routes[path] ?? routes["/"];
};

export const routePaths = Object.keys(routes);
