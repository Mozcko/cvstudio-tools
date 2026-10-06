import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import type { Translation } from '../../../../i18n/locales';
import useFitScale, { A4_WIDTH_PX } from '../../../../hooks/useFitScale';
import { PAGE_CONTENT_HEIGHT_PX, SHEET_PADDING_PX } from '../hooks/usePrintPreview';

const A4_HEIGHT_PX = 1123;

interface PreviewPanelProps {
  customCSS: string;
  pageCount: number;
  sheetHeight: number;
  t: Translation;
  markdown: string;
  sourceRef: React.Ref<HTMLDivElement>;
  isVisible: boolean;
}

/**
 * Live preview: the CV rendered as HTML on an A4-wide sheet, scaled to fit the panel.
 * The same element is what gets printed to PDF, so what you see is what you download.
 */
export default function PreviewPanel({
  customCSS,
  pageCount,
  sheetHeight,
  t,
  markdown,
  sourceRef,
  isVisible,
}: PreviewPanelProps) {
  const { containerRef, scale } = useFitScale<HTMLDivElement>(A4_WIDTH_PX, {
    gutter: 16,
    maxScale: 1,
    initialScale: 0.5,
  });

  const fullHeight = Math.max(A4_HEIGHT_PX, sheetHeight);

  return (
    <section
      className={`bg-app-bg relative min-h-0 w-full lg:w-7/12 xl:w-8/12 print:hidden ${isVisible ? 'block h-full flex-1' : 'hidden lg:block'}`}
    >
      <style>{customCSS}</style>

      {/* Page Indicator */}
      <div className="pointer-events-none absolute top-4 right-6 z-20">
        <div className="flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800/90 px-3 py-1.5 text-xs font-bold text-slate-300 shadow-lg backdrop-blur">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 text-blue-400"
          >
            <path
              fillRule="evenodd"
              d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            {pageCount} {pageCount === 1 ? t.labels.page : t.labels.pages}
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="custom-scrollbar h-full w-full overflow-x-hidden overflow-y-auto bg-slate-900/50 py-4"
      >
        {/* Reserves the scaled size so scrolling matches what is visible */}
        <div
          className="relative mx-auto"
          style={{ width: A4_WIDTH_PX * scale, height: fullHeight * scale }}
        >
          <div
            className="absolute top-0 left-0 bg-white shadow-2xl"
            style={{
              width: A4_WIDTH_PX,
              minHeight: A4_HEIGHT_PX,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <div
              ref={sourceRef}
              className="cv-preview-content"
              style={{ width: A4_WIDTH_PX, padding: SHEET_PADDING_PX, margin: 0 }}
            >
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{markdown}</ReactMarkdown>
            </div>

            {/* Approximate page breaks (the printed PDF decides the exact ones) */}
            {Array.from({ length: pageCount - 1 }, (_, i) => (
              <div
                key={i}
                title={t.messages.pageBreak}
                className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-blue-400/60"
                style={{ top: SHEET_PADDING_PX + (i + 1) * PAGE_CONTENT_HEIGHT_PX }}
              >
                <span className="absolute -top-2 right-1 rounded bg-blue-500/80 px-1 text-[9px] leading-4 font-bold text-white">
                  {i + 2}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
