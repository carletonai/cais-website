// @ts-check
/**
 * The document title for a page: its own "fullTitle" when seo.json gives one,
 * the bare site name for the page titled with it, and "Title | Site" for the
 * rest. The prerender script, the build check and RouteMeta all use this, so
 * a page's title cannot differ between the built HTML and the running app.
 * @param {{ title: string, fullTitle?: string }} meta
 * @param {string} siteName
 */
export const documentTitle = (meta, siteName) =>
  meta.fullTitle ??
  (meta.title === siteName ? meta.title : `${meta.title} | ${siteName}`);
