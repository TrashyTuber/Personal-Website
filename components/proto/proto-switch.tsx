import Link from 'next/link';

/** PROTOTYPE-only strip for flipping between the candidate designs. */
export default function ProtoSwitch({ current }: { current: 'catalog' | 'folio' }) {
  const items = [
    { key: 'current', label: 'current', href: '/projects' },
    { key: 'catalog', label: '#1 catalog', href: '/proto/catalog' },
    { key: 'folio', label: '#2 folio', href: '/proto/folio' },
  ];
  return (
    <nav aria-label="Prototype switcher" className="mb-10 flex flex-wrap gap-x-5 gap-y-2 font-mono-game text-xs text-faint">
      <span>PROTOTYPE ·</span>
      {items.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          className={`hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion ${it.key === current ? 'text-vermilion-text' : ''}`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
