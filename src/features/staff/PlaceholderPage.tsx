export default function PlaceholderPage({
  title,
}: {
  title: string;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl font-black italic text-brand-600">
        {title}
      </h1>
      <p className="mt-2 text-foreground/70">
        Módulo en construcción. El menú de la izquierda ya deja entrar a cada
        área.
      </p>
    </div>
  );
}
