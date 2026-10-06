import { useCallback, useEffect, useState } from 'react';
import { printHtml } from '../../../../utils/printDocument';

const PX_PER_CM = 96 / 2.54;
/** On-screen sheet padding, mirroring the 1cm print margin */
export const SHEET_PADDING_PX = PX_PER_CM;
/** Printable height of an A4 page with 1cm margins (297mm - 20mm) */
export const PAGE_CONTENT_HEIGHT_PX = 27.7 * PX_PER_CM;

/**
 * The preview is the rendered CV itself (see PreviewPanel). This hook measures it to
 * estimate the page count and prints it through the browser to produce the PDF.
 */
export function usePrintPreview(customCSS: string, fileTitle: string) {
  // Callback ref: the sheet is not in the DOM while the editor is still loading
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    if (!element) return;

    const measure = () => {
      setSheetHeight(element.offsetHeight);
      const contentHeight = element.scrollHeight - SHEET_PADDING_PX * 2;
      // 1px tolerance so a sheet that fits exactly is not reported as two pages
      setPageCount(Math.max(1, Math.ceil((contentHeight - 1) / PAGE_CONTENT_HEIGHT_PX)));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  const print = useCallback(async () => {
    if (!element) return;
    await printHtml({
      title: fileTitle,
      css: customCSS,
      html: element.innerHTML,
      wrapperClass: 'cv-preview-content',
    });
  }, [element, customCSS, fileTitle]);

  return { sourceRef: setElement, pageCount, sheetHeight, print };
}
