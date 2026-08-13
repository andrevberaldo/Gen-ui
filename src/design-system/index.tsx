'use client';

/**
 * Design system primitives.
 *
 * These components know nothing about A2UI — they are the same components a
 * human developer would import. The A2UI renderer is just another consumer,
 * which is what keeps agent-generated UI visually identical to hand-written UI.
 */

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';

export { Icon } from './icons';
export type { IconName } from './icons';

const weightStyle = (weight?: number): CSSProperties | undefined =>
  weight === undefined ? undefined : { flexGrow: weight, flexBasis: 0 };

/* Layout ------------------------------------------------------------------ */

export interface StackProps {
  direction?: 'row' | 'column';
  gap?: string;
  align?: string;
  justify?: string;
  wrap?: boolean;
  weight?: number;
  children?: ReactNode;
}

export function Stack({
  direction = 'column',
  gap = 'md',
  align,
  justify = 'start',
  wrap,
  weight,
  children,
}: StackProps) {
  return (
    <div
      className="ds-stack"
      data-direction={direction}
      data-gap={gap}
      data-align={align ?? (direction === 'row' ? 'center' : 'stretch')}
      data-justify={justify}
      data-wrap={wrap ? 'true' : undefined}
      style={weightStyle(weight)}
    >
      {children}
    </div>
  );
}

export function Card({
  tone = 'default',
  weight,
  children,
}: {
  tone?: string;
  weight?: number;
  children?: ReactNode;
}) {
  return (
    <section className="ds-card" data-tone={tone} style={weightStyle(weight)}>
      {children}
    </section>
  );
}

export function Divider() {
  return <hr className="ds-divider" />;
}

export function List({
  variant = 'divided',
  weight,
  children,
}: {
  variant?: string;
  weight?: number;
  children?: ReactNode[];
}) {
  return (
    <ul className="ds-list" data-variant={variant} style={weightStyle(weight)}>
      {children}
    </ul>
  );
}

/* Content ----------------------------------------------------------------- */

/** Inline markdown: `code`, **bold**, *italic*. Deliberately no HTML, no links. */
export function InlineMarkdown({ text }: { text: string }) {
  return <>{renderInlineMarkdown(text)}</>;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.filter(Boolean).map((token, index) => {
    if (token.startsWith('`') && token.endsWith('`') && token.length > 1) {
      return <code key={index}>{token.slice(1, -1)}</code>;
    }
    if (token.startsWith('**') && token.endsWith('**') && token.length > 3) {
      return <strong key={index}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return <em key={index}>{token.slice(1, -1)}</em>;
    }
    return <span key={index}>{token}</span>;
  });
}

export function Text({
  text,
  variant = 'body',
  tone = 'default',
  weight,
}: {
  text: string;
  variant?: string;
  tone?: string;
  weight?: number;
}) {
  return (
    <p className="ds-text" data-variant={variant} data-tone={tone} style={weightStyle(weight)}>
      {renderInlineMarkdown(text)}
    </p>
  );
}

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: string; icon?: string }) {
  return (
    <span className="ds-badge" data-tone={tone}>
      {icon ? <Icon name={icon} size="sm" tone="default" /> : null}
      {label}
    </span>
  );
}

/** Highlights when its value changes, so agent-pushed data updates are visible. */
export function Stat({
  label,
  value,
  delta,
  deltaTone = 'muted',
  icon,
  weight,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: string;
  icon?: string;
  weight?: number;
}) {
  const previous = useRef(value);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    setChanged(true);
    const timer = setTimeout(() => setChanged(false), 900);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="ds-stat" style={weightStyle(weight)}>
      <span className="ds-stat__label">
        {icon ? <Icon name={icon} size="sm" tone="muted" /> : null}
        {label}
      </span>
      <span className="ds-stat__value" data-changed={changed ? 'true' : undefined}>
        {value}
      </span>
      {delta ? (
        <span className="ds-stat__delta" data-tone={deltaTone}>
          {delta}
        </span>
      ) : null}
    </div>
  );
}

export function DsImage({
  url,
  alt,
  shape = 'rounded',
  size = 'md',
}: {
  url: string;
  alt: string;
  shape?: string;
  size?: string;
}) {
  // eslint-disable-next-line @next/next/no-img-element -- agent-supplied remote URLs
  return <img className="ds-image" data-shape={shape} data-size={size} src={url} alt={alt} />;
}

export function ProgressBar({
  value,
  label,
  tone = 'accent',
}: {
  value: number;
  label?: string;
  tone?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className="ds-progress">
      {label ? <span className="ds-field__label">{label}</span> : null}
      <div
        className="ds-progress__track"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'progress'}
      >
        <div className="ds-progress__fill" data-tone={tone} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="ds-spinner">
      <span className="ds-spinner__dot" />
      {label}
    </span>
  );
}

export function Alert({
  title,
  message,
  tone = 'info',
}: {
  title: string;
  message?: string;
  tone?: string;
}) {
  const icon =
    tone === 'negative' ? 'alert' : tone === 'positive' ? 'check' : tone === 'warning' ? 'alert' : 'issue';
  return (
    <div className="ds-alert" data-tone={tone} role={tone === 'negative' ? 'alert' : 'status'}>
      <Icon name={icon} tone={tone === 'info' ? 'accent' : tone} size="md" />
      <div>
        <div className="ds-alert__title">{title}</div>
        {message ? <div className="ds-alert__message">{message}</div> : null}
      </div>
    </div>
  );
}

/* Interactive -------------------------------------------------------------- */

export function Button({
  variant = 'secondary',
  disabled,
  busy,
  title,
  weight,
  onClick,
  children,
}: {
  variant?: string;
  disabled?: boolean;
  busy?: boolean;
  title?: string;
  weight?: number;
  onClick?: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className="ds-button"
      data-variant={variant}
      data-busy={busy ? 'true' : undefined}
      disabled={disabled || busy}
      title={title}
      style={weightStyle(weight)}
      onClick={onClick}
    >
      {busy ? <span className="ds-spinner__dot" /> : null}
      {children}
    </button>
  );
}

export function TextField({
  label,
  value,
  placeholder,
  variant = 'text',
  error,
  weight,
  onChange,
  onSubmit,
}: {
  label?: string;
  value: string;
  placeholder?: string;
  variant?: string;
  error?: string;
  weight?: number;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}) {
  return (
    <label className="ds-field" style={weightStyle(weight)}>
      {label ? <span className="ds-field__label">{label}</span> : null}
      <input
        className="ds-field__input"
        type={variant === 'number' ? 'number' : variant === 'search' ? 'search' : 'text'}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && onSubmit) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      {error ? <span className="ds-field__error">{error}</span> : null}
    </label>
  );
}
