import { cn, initials } from "@/lib/utils";

export function ProfileAvatar({
  photo,
  name,
  size = 48,
  className,
}: {
  photo: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-border",
        className
      )}
      style={{ width: size, height: size }}
      data-testid="profile-avatar"
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sapphire to-royal text-white">
          <span
            className="font-semibold"
            style={{ fontSize: size * 0.36 }}
          >
            {initials(name)}
          </span>
        </div>
      )}
    </div>
  );
}
