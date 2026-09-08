import seo from "@/data/seo.json";

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
 *  slashes matter here: GitHub Pages serves /contact/ for /contact. */
export const metaFor = (pathname: string): RouteMeta => {
  const path = pathname.replace(/\/+$/, "") || "/";
  return routes[path] ?? routes["/"];
};

export const routePaths = Object.keys(routes);
