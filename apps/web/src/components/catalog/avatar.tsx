type AvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: 'small' | 'large';
};

export function Avatar({ name, imageUrl, size = 'small' }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const className =
    size === 'large' ? 'h-28 w-28 text-3xl' : 'h-16 w-16 text-lg';

  if (imageUrl) {
    return (
      <img
        alt=""
        className={`${className} rounded-2xl object-cover`}
        src={imageUrl}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${className} flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 font-black text-white`}
    >
      {initials}
    </div>
  );
}
