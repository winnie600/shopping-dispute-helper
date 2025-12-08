import { useCallback, useEffect, useMemo, useState } from 'react';

type Photo = { url: string; label: string };

export default function ProductGallery({
  photos,
  title,
}: {
  photos: Photo[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const safePhotos = useMemo(
    () => (Array.isArray(photos) ? photos.filter(Boolean) : []),
    [photos]
  );

  const openAt = (i: number) => {
    setIdx(i);
    setOpen(true);
  };

  const close = () => setOpen(false);
  const prev = useCallback(() => setIdx((p) => (p - 1 + safePhotos.length) % safePhotos.length), [safePhotos.length]);
  const next = useCallback(() => setIdx((p) => (p + 1) % safePhotos.length), [safePhotos.length]);

  // Keyboard support
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, prev, next]);

  if (!safePhotos.length) {
    return (
      <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500">
        No photos provided.
      </div>
    );
  }

  return (
    <>
      {/* Grid thumbnails */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {safePhotos.map((p, i) => (
          <button
            type="button"
            key={p.url + i}
            className="relative group aspect-[4/3] overflow-hidden rounded-lg border bg-gray-100"
            onClick={() => openAt(i)}
            aria-label={`Open ${p.label}`}
            title={p.label}
          >
            {/* Dùng <img> đơn giản để demo */}
            <img
              src={p.url}
              alt={p.label}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                // Fallback: khi demo img 404
                (e.currentTarget as HTMLImageElement).style.opacity = '0';
              }}
            />
            <div className="absolute inset-0 flex items-end">
              <div className="w-full bg-gradient-to-t from-black/40 to-transparent px-2 py-1 text-[10px] text-white">
                {p.label}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <div
            className="absolute inset-0 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-w-5xl w-full">
              <div className="absolute -top-10 left-0 right-0 flex items-center justify-between text-white text-sm">
                <div className="truncate pr-2">
                  {title ? `${title} • ` : ''}{safePhotos[idx].label}
                </div>
                <div>{idx + 1} / {safePhotos.length}</div>
              </div>

              <div className="relative bg-black rounded-xl overflow-hidden">
                <img
                  src={safePhotos[idx].url}
                  alt={safePhotos[idx].label}
                  className="max-h-[75vh] w-full object-contain bg-black"
                />
                {/* Controls */}
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-sm shadow"
                  aria-label="Previous"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-sm shadow"
                  aria-label="Next"
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs shadow"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Caption */}
              <div className="mt-2 text-center text-xs text-white/90">
                {safePhotos[idx].label}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
