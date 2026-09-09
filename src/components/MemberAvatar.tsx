import { publicAssetPath } from "@/lib/assets";

/** The generic silhouette that stands in for a missing headshot. */
const PLACEHOLDER = "/stockIcon.jpg";

/** First and last initial: "Alexander James Rigas" reads as AR, not AJ. */
const initials = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
};

interface MemberAvatarProps {
  name: string;
  image?: string;
  /** Sizing and shape, applied to the photo and the monogram alike. */
  className?: string;
  /** Type scale for the monogram, which has to match the box it sits in. */
  monogramClassName?: string;
}

/**
 * Most of the roster has no headshot yet. One black-on-white stock silhouette
 * repeated down the page reads as broken art; initials read as deliberate and
 * carry more information. A real photo renders as soon as one exists.
 *
 * The monogram is decorative: every caller prints the member's name directly
 * beneath it, so announcing it again would only repeat that.
 */
const MemberAvatar = ({
  name,
  image,
  className = "",
  monogramClassName = "text-3xl",
}: MemberAvatarProps) => {
  if (image && image !== PLACEHOLDER) {
    return (
      <img
        src={publicAssetPath(image)}
        alt={name}
        className={className}
        loading="lazy"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${className} flex select-none items-center justify-center bg-brand/15 font-semibold tracking-wide text-primary ${monogramClassName}`}
    >
      {initials(name)}
    </div>
  );
};

export default MemberAvatar;
