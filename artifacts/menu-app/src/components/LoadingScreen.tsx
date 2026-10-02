import loadingArtwork from "@assets/1790954750498_1790954900507.jpg";

type LoadingScreenProps = {
  text: string;
};

export default function LoadingScreen({ text }: LoadingScreenProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      <img
        src={loadingArtwork}
        alt=""
        aria-hidden="true"
        className="loading-emblem"
      />
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  );
}