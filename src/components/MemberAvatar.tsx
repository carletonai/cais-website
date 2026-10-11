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
 * Nobody on the roster has a headshot yet. One stock silhouette repeated down
 * the page reads as broken art; initials read as deliberate and carry more
 * information. A real photo renders as soon as one exists.
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
  if (image) {
    return <img src={image} alt={name} className={className} loading="lazy" />;
  }

  return (
    <div
      aria-hidden="true"
      className={`${className} flex select-none items-center justify-center tracking-wide ${monogramClassName}`}
    >
      {initials(name)}
    </div>
  );
};

export default MemberAvatar;
