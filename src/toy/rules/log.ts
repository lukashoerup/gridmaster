/**
 * The session log behind round 1's pass and fail measures (design,
 * "Round 1"): decisions with timestamps, time at each speed, the longest
 * stretch at top speed, and when the first hub turned blue because of the
 * player's own plants. Pure: the page passes in the wall-clock times, and
 * the log is plain JSON, exported as a file (no server).
 */

/** What the clock was doing: a speed, or the year review card. */
export type ClockMode = 'pause' | 'x1' | 'x3' | 'x10' | 'review';

export interface LogEntry {
  /** Milliseconds since the session started. */
  readonly t: number;
  /** The game date, e.g. "1998-03-14 07:00". */
  readonly date: string;
  readonly kind: 'decision' | 'clock' | 'event' | 'note';
  readonly what: string;
}

export interface LogSummary {
  readonly minutes: number;
  readonly decisions: number;
  readonly decisionsPerMinute: number;
  /** Minutes in each clock mode. */
  readonly minutesIn: Readonly<Record<ClockMode, number>>;
  /** Share of the session at top speed (×10). */
  readonly topSpeedShare: number;
  /** The longest unbroken stretch at top speed, in minutes. */
  readonly longestTopSpeedMinutes: number;
  /** Minutes into the session when a hub first turned blue because of the player's plants (null if never). */
  readonly firstBlueByYouMinute: number | null;
  readonly firstBlueByYouDate: string | null;
  readonly score: number;
  readonly gameDate: string;
}

export interface SessionLogData {
  readonly version: 1;
  readonly toy: string;
  readonly seed: number;
  readonly startedAt: string;
  readonly entries: LogEntry[];
  readonly summary: LogSummary | null;
}

const MODES: readonly ClockMode[] = ['pause', 'x1', 'x3', 'x10', 'review'];

export class SessionLog {
  readonly entries: LogEntry[] = [];
  private mode: ClockMode = 'pause';
  private modeSince = 0;
  private readonly spent: Record<ClockMode, number> = { pause: 0, x1: 0, x3: 0, x10: 0, review: 0 };
  private longestTop = 0;
  private firstBlue: { t: number; date: string } | null = null;

  constructor(
    readonly toy: string,
    readonly seed: number,
    /** A human-readable start time from the page (the rules never read a clock). */
    readonly startedAt: string,
  ) {}

  decision(t: number, date: string, what: string): void {
    this.entries.push({ t: Math.round(t), date, kind: 'decision', what });
  }

  event(t: number, date: string, what: string): void {
    this.entries.push({ t: Math.round(t), date, kind: 'event', what });
  }

  note(t: number, date: string, what: string): void {
    this.entries.push({ t: Math.round(t), date, kind: 'note', what });
  }

  firstBlueByYou(t: number, date: string): void {
    if (this.firstBlue !== null) return;
    this.firstBlue = { t, date };
    this.event(t, date, 'first hub turned blue because of your own plants');
  }

  /** The clock changed mode at `t`. */
  clock(t: number, date: string, mode: ClockMode): void {
    if (mode === this.mode) return;
    this.closeSegment(t);
    this.mode = mode;
    this.modeSince = t;
    this.entries.push({ t: Math.round(t), date, kind: 'clock', what: mode });
  }

  private closeSegment(t: number): void {
    const d = Math.max(0, t - this.modeSince);
    this.spent[this.mode] += d;
    if (this.mode === 'x10') this.longestTop = Math.max(this.longestTop, d);
    this.modeSince = t;
  }

  summary(t: number, date: string, score: number): LogSummary {
    const spent = { ...this.spent };
    const open = Math.max(0, t - this.modeSince);
    spent[this.mode] += open;
    const longest = this.mode === 'x10' ? Math.max(this.longestTop, open) : this.longestTop;
    const total = Math.max(1, t);
    const decisions = this.entries.filter((e) => e.kind === 'decision').length;
    const minutesIn = Object.fromEntries(MODES.map((m) => [m, spent[m] / 60000])) as Record<ClockMode, number>;
    return {
      minutes: t / 60000,
      decisions,
      decisionsPerMinute: decisions / Math.max(1 / 60, t / 60000),
      minutesIn,
      topSpeedShare: spent.x10 / total,
      longestTopSpeedMinutes: longest / 60000,
      firstBlueByYouMinute: this.firstBlue === null ? null : this.firstBlue.t / 60000,
      firstBlueByYouDate: this.firstBlue?.date ?? null,
      score: Math.round(score),
      gameDate: date,
    };
  }

  toJSON(t: number, date: string, score: number): SessionLogData {
    return { version: 1, toy: this.toy, seed: this.seed, startedAt: this.startedAt, entries: [...this.entries], summary: this.summary(t, date, score) };
  }
}
