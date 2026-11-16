import { seal } from './utils.js';

export const MUSTACHE_EXPR = seal(/{{[\w\W]*|^[\w\W]*}}/g);
export const ERB_EXPR = seal(/<%[\w\W]*|^[\w\W]*%>/g);
export const TMPLIT_EXPR = seal(/\${[\w\W]*/g);
// A template marker pair as it appears in serialized output
export const TMPL_MARKER_SERIALIZED = seal(/{{|}}|\${|<%|%>|&lt;%|%&gt;/);

/**
 * Escapes the regular-expression metacharacters of a literal string so it
 * can be embedded verbatim into a RegExp source.
 *
 * @param literal the literal marker to escape
 * @returns the escaped RegExp source fragment
 */
const escapeRegExp = function (literal: string): string {
  return literal.replaceAll(/[\\^$.*+?()[\]{}|]/g, '\\$&');
};

/**
 * Builds the greedy scrub expression for one caller-supplied template
 * delimiter pair. The two alternatives mirror MUSTACHE_EXPR/ERB_EXPR: an
 * opening marker swallows the rest of the value and a closing marker
 * swallows everything before it, so an unbalanced marker never leaves an
 * orphaned open or close token behind.
 *
 * @param delimiter the literal open/close marker pair
 * @returns a sealed, globally matching scrub expression
 */
export const buildTemplateDelimiterExpr = function (delimiter: {
  open: string;
  close: string;
}): RegExp {
  return seal(
    new RegExp(
      `${escapeRegExp(delimiter.open)}[\\w\\W]*|^[\\w\\W]*${escapeRegExp(
        delimiter.close
      )}`,
      'g'
    )
  );
};

/**
 * Builds the serialized-output probe for caller-supplied delimiter pairs.
 * Besides the raw markers it includes the entity-encoded shapes a serializer
 * can emit (`<`/`>` and `&` are escaped), matching the coverage the built-in
 * ERB probe provides for `<%`/`%>`.
 *
 * @param delimiters the literal open/close marker pairs
 * @returns a sealed probe without flags, or null when there are no markers
 */
export const buildTemplateMarkerProbe = function (
  delimiters: ReadonlyArray<{ open: string; close: string }>
): RegExp | null {
  const fragments: string[] = [];
  const collect = function (marker: string): void {
    const encoded = marker
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
    fragments.push(escapeRegExp(marker));
    if (encoded !== marker) {
      fragments.push(escapeRegExp(encoded));
    }
  };

  for (const delimiter of delimiters) {
    collect(delimiter.open);
    collect(delimiter.close);
  }

  return fragments.length > 0 ? seal(new RegExp(fragments.join('|'))) : null;
};

export const DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/); // eslint-disable-line no-useless-escape
export const ARIA_ATTR = seal(/^aria-[\-\w]+$/); // eslint-disable-line no-useless-escape
export const IS_ALLOWED_URI = seal(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i // eslint-disable-line no-useless-escape
);
export const IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
export const ATTR_WHITESPACE = seal(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g // eslint-disable-line no-control-regex
);
export const DOCTYPE_NAME = seal(/^html$/i);
export const CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);

// Markup-significant character probes used by _sanitizeElements.
// Shared module-level instances are safe despite the sticky /g flags:
// regExpTest() resets lastIndex before every call.
export const ELEMENT_MARKUP_PROBE = seal(/<[/\w!]/g);
export const COMMENT_MARKUP_PROBE = seal(/<[/\w]/g);
export const FALLBACK_TAG_CLOSE = seal(/<\/no(script|embed|frames)/i);
export const SELF_CLOSING_TAG = seal(/\/>/i);
// Comment closers and raw-text end tags inside an attribute value
export const ATTR_VALUE_BREAKOUT = seal(
  /((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i
);
export const LEADING_WHITESPACE = seal(/^[\r\n\t ]+/);
