import type { Screening } from '../api';

/**
 * One cell of a CSV file. Quoted when needed, and made safe to open in a spreadsheet: a cell
 * that starts with = + - or @ would otherwise be run as a formula, and candidates' CVs are
 * exactly the kind of text someone might craft for that.
 */
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export interface CsvLabels {
  rank: string;
  name: string;
  score: string;
  missingMusts: string;
  flagged: string;
  yes: string;
  no: string;
  email: string;
  phone: string;
  links: string;
  summary: string;
  strengths: string;
  concerns: string;
  note: string;
  file: string;
}

/** The ranking of a screening as CSV text, one candidate per line, requirements as columns. */
export function rankingToCsv(screening: Screening, labels: CsvLabels): string {
  const header = [
    labels.rank,
    labels.name,
    labels.score,
    labels.missingMusts,
    labels.flagged,
    ...screening.rubric.map((requirement) => requirement.text),
    labels.email,
    labels.phone,
    labels.links,
    labels.summary,
    labels.strengths,
    labels.concerns,
    labels.note,
    labels.file,
  ];
  const rows = screening.ranking.map((candidate) => {
    const status = new Map(
      candidate.result.requirements.map((finding) => [finding.id, finding.status])
    );
    return [
      candidate.rank,
      candidate.display_name,
      candidate.score,
      candidate.missing_musts,
      candidate.flagged ? labels.yes : labels.no,
      ...screening.rubric.map((requirement) => status.get(requirement.id) ?? ''),
      (candidate.contact.emails || []).join(' '),
      (candidate.contact.phones || []).join(' '),
      (candidate.contact.links || []).join(' '),
      candidate.result.summary,
      candidate.result.strengths.join(' · '),
      candidate.result.concerns.join(' · '),
      candidate.note,
      candidate.file_name,
    ];
  });
  // The byte-order mark makes spreadsheet programs read accents correctly
  return '\uFEFF' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function downloadCsv(fileName: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
