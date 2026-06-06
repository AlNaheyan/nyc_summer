interface Props {
  name: string;
  url?: string | null;
  size?: number;
}

/** Round avatar: shows the photo when available, else a colored initial. */
export function Avatar({ name, url, size = 44 }: Props) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  const hue = sum % 360;

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        background: `hsl(${hue} 62% 52%)`,
      }}
    >
      {initial}
    </span>
  );
}

/** "@handle" derived from a display name. */
export function handleFor(name: string): string {
  return "@" + name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
