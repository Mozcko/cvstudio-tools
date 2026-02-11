import { useState, useEffect, useRef } from 'react';
import type { CVData } from '../../../../types/cv';

export function usePDFPreview(
  markdown: string,
  customCSS: string,
  mobileTab: string,
  windowWidth: number,
  cvData: CVData
) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [isStale, setIsStale] = useState(true);
  const sourceRef = useRef<HTMLDivElement>(null);

  // Mark as stale when content changes
  useEffect(() => {
    setIsStale(true);
  }, [markdown, customCSS]);

  // Auto-generate preview
  useEffect(() => {
    const isVisible = windowWidth >= 1024 || mobileTab === 'preview';
    if (!isVisible || !isStale) return;

    const delay = windowWidth < 1024 ? 500 : 2000;
    const timer = setTimeout(() => {
      if (sourceRef.current) {
        generatePDF('preview');
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [markdown, customCSS, mobileTab, windowWidth, isStale]);

  const generatePDF = async (mode: 'save' | 'preview') => {
    const element = sourceRef.current;
    if (!element) return;

    if (mode === 'preview') setIsPdfLoading(true);

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const clone = element.cloneNode(true) as HTMLElement;
      const container = document.createElement('div');
      Object.assign(container.style, {
        position: 'absolute',
        left: '-9999px',
        top: '0',
        width: '21cm',
      });
      document.body.appendChild(container);
      container.appendChild(clone);

      // Helper para resolver colores a RGB
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const resolveColor = (color: string) => {
        if (!ctx || !color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return color;
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
      };

      const applyComputedStyles = (source: HTMLElement, target: HTMLElement) => {
        const computed = window.getComputedStyle(source);
        target.style.boxSizing = computed.boxSizing;
        target.style.backgroundColor = resolveColor(computed.backgroundColor);
        target.style.color = resolveColor(computed.color);
        target.style.fontFamily = computed.fontFamily;
        target.style.fontSize = computed.fontSize;
        target.style.fontWeight = computed.fontWeight;
        target.style.lineHeight = computed.lineHeight;
        target.style.textAlign = computed.textAlign;
        target.style.textTransform = computed.textTransform;
        target.style.letterSpacing = computed.letterSpacing;

        target.style.borderTopWidth = computed.borderTopWidth;
        target.style.borderTopStyle = computed.borderTopStyle;
        target.style.borderTopColor = resolveColor(computed.borderTopColor);
        target.style.borderRightWidth = computed.borderRightWidth;
        target.style.borderRightStyle = computed.borderRightStyle;
        target.style.borderRightColor = resolveColor(computed.borderRightColor);
        target.style.borderBottomWidth = computed.borderBottomWidth;
        target.style.borderBottomStyle = computed.borderBottomStyle;
        target.style.borderBottomColor = resolveColor(computed.borderBottomColor);
        target.style.borderLeftWidth = computed.borderLeftWidth;
        target.style.borderLeftStyle = computed.borderLeftStyle;
        target.style.borderLeftColor = resolveColor(computed.borderLeftColor);

        target.style.paddingTop = computed.paddingTop;
        target.style.paddingRight = computed.paddingRight;
        target.style.paddingBottom = computed.paddingBottom;
        target.style.paddingLeft = computed.paddingLeft;

        target.style.marginTop = computed.marginTop;
        target.style.marginRight = computed.marginRight;
        target.style.marginBottom = computed.marginBottom;
        target.style.marginLeft = computed.marginLeft;

        target.style.display = computed.display;

        target.style.width = computed.width;
        target.style.minWidth = computed.minWidth;
        target.style.minHeight = computed.minHeight;
        target.style.maxWidth = computed.maxWidth;
        target.style.whiteSpace = computed.whiteSpace;
        target.style.verticalAlign = computed.verticalAlign;
        target.style.borderCollapse = computed.borderCollapse;
        target.style.flexDirection = computed.flexDirection;
        target.style.justifyContent = computed.justifyContent;
        target.style.alignItems = computed.alignItems;
        target.style.flexGrow = computed.flexGrow;
        target.style.flexShrink = computed.flexShrink;

        target.style.boxShadow = computed.boxShadow;

        target.removeAttribute('class');
      };

      applyComputedStyles(element, clone);
      clone.style.transform = 'none';
      clone.style.boxShadow = 'none';
      clone.style.opacity = '1';
      clone.style.position = 'static';
      clone.style.filter = 'none';
      clone.style.margin = '0';
      clone.style.backgroundImage = 'none';
      clone.style.backgroundColor = '#ffffff';
      clone.style.width = '21cm';

      const sourceElements = element.querySelectorAll('*');
      const targetElements = clone.querySelectorAll('*');
      sourceElements.forEach((el, i) => {
        if (targetElements[i])
          applyComputedStyles(el as HTMLElement, targetElements[i] as HTMLElement);
      });

      clone.style.padding = '0 0 30px 0';

      const opt = {
        margin: 10,
        filename: `${cvData.personal.name.replace(/\s+/g, '_')}_CV.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: mode === 'save' ? 2 : 1,
          useCORS: true,
          logging: false,
          windowWidth: 794,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };

      const worker = html2pdf().set(opt).from(clone).toPdf();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      worker.get('pdf').then((pdf: any) => {
        setPageCount(pdf.internal.getNumberOfPages());
      });

      if (mode === 'save') {
        await worker.save();
      } else {
        const url = await worker.output('bloburl');
        setPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      }
      setIsStale(false);
      document.body.removeChild(container);
    } catch (error: unknown) {
      console.error('Error generating PDF:', error);
      const msg = error instanceof Error ? error.message : String(error);
      if (mode === 'save') alert(`Error al generar el PDF: ${msg}.`);
    }
    if (mode === 'preview') setIsPdfLoading(false);
  };

  return {
    pdfUrl,
    isPdfLoading,
    pageCount,
    generatePDF,
    sourceRef,
  };
}
