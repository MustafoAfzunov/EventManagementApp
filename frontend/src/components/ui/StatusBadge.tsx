import { c } from '../../lib/theme';

type Status =
  | 'Pending' | 'Confirmed' | 'Cancelled' | 'Rejected' | 'Waitlisted'
  | 'Draft' | 'Published' | 'Completed' | 'CheckedIn' | 'Available'
  | 'Held' | 'Assigned' | 'Approved' | 'Open';

const statusConfig: Record<Status, { bg: string; text: string; label?: string }> = {
  Pending:    { bg: '#ffedd5', text: '#9a3412' },
  Confirmed:  { bg: '#dcfce7', text: '#166534' },
  Cancelled:  { bg: '#fee2e2', text: '#991b1b' },
  Rejected:   { bg: '#fee2e2', text: '#991b1b' },
  Waitlisted: { bg: '#fef9c3', text: '#854d0e' },
  Draft:      { bg: '#f3f4f6', text: '#374151' },
  Published:  { bg: '#dcfce7', text: '#166534' },
  Completed:  { bg: '#dbeafe', text: '#1e40af' },
  CheckedIn:  { bg: '#dbeafe', text: '#1e40af' },
  Available:  { bg: '#dcfce7', text: '#166534' },
  Held:       { bg: '#ffedd5', text: '#9a3412' },
  Assigned:   { bg: c.surfaceHigh, text: c.primary },
  Approved:   { bg: '#dcfce7', text: '#166534' },
  Open:       { bg: '#d1fae5', text: '#065f46' },
};

interface Props {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: Props) {
  const cfg = statusConfig[status as Status] ?? { bg: '#f3f4f6', text: '#374151' };
  return (
    <span
      className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${className}`}
      style={{ background: cfg.bg, color: cfg.text, fontFamily: 'Inter' }}
    >
      {status}
    </span>
  );
}
