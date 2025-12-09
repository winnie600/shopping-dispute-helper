// src/pages/Policy.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { POLICY_TEXT } from '../data/policy';
import type { JSX } from 'react/jsx-runtime';
type PolicyLang = 'zh' | 'en';

/** very small slugify to build anchors */
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

/** inline renderer: **bold**, `code` */
function renderInline(text: string) {
  const spans: JSX.Element[] = [];
  let idx = 0;
  const tokens =
    text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g); // split by code/backtick or bold
  for (const t of tokens) {
    if (!t) continue;
    if (t.startsWith('`') && t.endsWith('`')) {
      spans.push(
        <code key={idx++} className="px-1 py-0.5 rounded bg-gray-100 border text-[0.9em]">
          {t.slice(1, -1)}
        </code>,
      );
    } else if (t.startsWith('**') && t.endsWith('**')) {
      spans.push(<strong key={idx++}>{t.slice(2, -2)}</strong>);
    } else {
      spans.push(<span key={idx++}>{t}</span>);
    }
  }
  return spans;
}

/** Block-level super-light Markdown to JSX (headings, hr, p, ul/ol) */
function renderMarkdown(md: string) {
  const lines = md.split(/\r?\n/);
  const blocks: JSX.Element[] = [];
  const toc: { id: string; text: string; level: 1 | 3 }[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // horizontal rule
    if (/^\s*---\s*$/.test(line)) {
      blocks.push(<hr key={`hr-${i}`} className="my-6 border-t" />);
      i += 1;
      continue;
    }

    // h1
    if (line.startsWith('# ')) {
      const text = line.replace(/^#\s+/, '').trim();
      const id = slugify(text);
      toc.push({ id, text, level: 1 });
      blocks.push(
        <h1 key={`h1-${i}`} id={id} className="text-2xl font-semibold tracking-tight">
          {text}
        </h1>,
      );
      i += 1;
      continue;
    }

    // h3
    if (line.startsWith('### ')) {
      const text = line.replace(/^###\s+/, '').trim();
      const id = slugify(text);
      toc.push({ id, text, level: 3 });
      blocks.push(
        <h3 key={`h3-${i}`} id={id} className="text-lg font-semibold mt-6">
          {text}
        </h3>,
      );
      i += 1;
      continue;
    }

    // unordered list
    if (/^\s*([*-])\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*([*-])\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([*-])\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="list-disc pl-6 space-y-1">
          {items.map((t, k) => (
            <li key={k} className="leading-relaxed">
              {renderInline(t)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // ordered list (supports "1. ", "2. ")
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ol key={`ol-${i}`} className="list-decimal pl-6 space-y-1">
          {items.map((t, k) => (
            <li key={k} className="leading-relaxed">
              {renderInline(t)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // paragraph (collect consecutive non-empty lines)
    if (line.trim().length > 0) {
      const paras: string[] = [];
      while (i < lines.length && lines[i].trim().length > 0) {
        paras.push(lines[i]);
        i += 1;
      }
      const text = paras.join(' ');
      blocks.push(
        <p key={`p-${i}`} className="leading-[1.85]">
          {renderInline(text)}
        </p>,
      );
      continue;
    }

    // empty
    blocks.push(<div key={`sp-${i}`} className="h-2" />);
    i += 1;
  }

  return { blocks, toc };
}

function Toolbar({
  lang,
  setLang,
  onCopy,
  onDownload,
}: {
  lang: PolicyLang;
  setLang: (l: PolicyLang) => void;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-white/80 backdrop-blur border-b flex items-center justify-end gap-2">
      <button
        className={`px-3 py-1.5 rounded-lg text-sm ${lang === 'zh' ? 'bg-black text-white' : 'border'}`}
        onClick={() => setLang('zh')}
      >
        繁體中文
      </button>
      <button
        className={`px-3 py-1.5 rounded-lg text-sm ${lang === 'en' ? 'bg-black text-white' : 'border'}`}
        onClick={() => setLang('en')}
      >
        English
      </button>
      <button className="px-3 py-1.5 rounded-lg border text-sm" onClick={onCopy}>
        Copy
      </button>
      <button className="px-3 py-1.5 rounded-lg border text-sm" onClick={onDownload}>
        Download
      </button>
    </div>
  );
}

export default function PolicyPage() {
  const [lang, setLang] = useState<PolicyLang>('zh');
  const content = useMemo(() => POLICY_TEXT[lang], [lang]);
  const { blocks, toc } = useMemo(() => renderMarkdown(content), [content]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to top when language toggles
    containerRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [lang]);

  const copyAll = () => navigator.clipboard?.writeText(content).catch(() => {});
  const download = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `policy_${lang}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1100px] mx-auto p-4">
      <h1 className="text-2xl font-semibold">Policy — Dispute & Refund (RAG v1.0)</h1>

      <div className="mt-4 grid grid-cols-12 gap-4">
        {/* TOC */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="sticky top-16 card p-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">Contents</div>
            <nav className="mt-2 space-y-1">
              {toc.map((t) => (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  className={`block rounded px-2 py-1 text-sm hover:bg-gray-100 ${
                    t.level === 3 ? 'ml-3' : ''
                  }`}
                >
                  {t.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <section className="col-span-12 lg:col-span-9">
          <div className="card overflow-hidden">
            <Toolbar lang={lang} setLang={setLang} onCopy={copyAll} onDownload={download} />
            <div ref={containerRef} className="p-5 space-y-3 leading-relaxed">
              <div className="text-sm text-gray-500 mb-2">Anchors preserved · Use as RAG source</div>
              <article className="prose prose-sm max-w-none">{blocks}</article>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
