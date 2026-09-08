import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { metaFor, siteUrl, titleFor } from "@/lib/seo";

const setMeta = (selector: string, attr: string, value: string) => {
  const el = document.head.querySelector<HTMLMetaElement>(selector);
  if (el) el.setAttribute(attr, value);
};

/**
 * 2.4.2 Page Titled — a client-side route change has to update the document
 * title, otherwise every page announces itself as the one that was loaded
 * first. The social tags and canonical URL ride along on the same change, and
 * the build writes the same values into each pre-rendered page so crawlers
 * see them without running any JavaScript.
 */
const RouteMeta = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = metaFor(pathname);
    const title = titleFor(meta);
    const url = `${siteUrl}${pathname.replace(/\/+$/, "") || "/"}`;

    document.title = title;
    setMeta('meta[name="description"]', "content", meta.description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", meta.description);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", meta.description);

    const canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (canonical) canonical.href = url;
  }, [pathname]);

  return null;
};

export default RouteMeta;
