import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { getThemeById } from '../../templates';
import { cvToMarkdown } from '../../utils/cvMarkdown';

/**
 * What may appear on a public page. A published CV is text written by a user, shown on our own
 * origin to anyone, so only the markup the CV generator itself produces is allowed: no scripts,
 * styles, images, frames, forms or event handlers, and links only to the web or to an e-mail.
 */
export const PUBLIC_CV_SCHEMA = {
  tagNames: [
    'h1',
    'h2',
    'h3',
    'h4',
    'p',
    'br',
    'hr',
    'strong',
    'em',
    'b',
    'i',
    'u',
    'a',
    'ul',
    'ol',
    'li',
    'table',
    'thead',
    'tbody',
    'tr',
    'td',
    'th',
    'div',
    'span',
    'blockquote',
    'code',
  ],
  attributes: {
    a: ['href'],
    // The role line under the name
    div: [['className', 'cv-role']],
  },
  protocols: { href: ['http', 'https', 'mailto'] },
  // Their content is dropped as well, not shown as text
  strip: ['script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'svg', 'math'],
  clobberPrefix: 'user-content-',
  clobber: ['id', 'name'],
};

interface PublicCvSheetProps {
  content: unknown;
  language?: string | null;
  theme?: string | null;
}

/** A published CV as static HTML. Rendered on the server; needs no JavaScript in the browser. */
export default function PublicCvSheet({ content, language, theme }: PublicCvSheetProps) {
  const markdown = cvToMarkdown(content, language);
  // The theme is looked up by id among our own stylesheets; an unknown id gets the default
  const css = getThemeById(theme || '').css;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="cv-preview-content public-cv-sheet">
        <ReactMarkdown
          rehypePlugins={[rehypeRaw, [rehypeSanitize, PUBLIC_CV_SCHEMA]]}
          components={{
            // Links leave the site: no referrer, no ranking credit, no access to this window
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="nofollow ugc noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </>
  );
}
