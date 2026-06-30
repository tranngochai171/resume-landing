'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  generateBoard,
  legalCells,
  codesAlong,
  evaluateSequences,
  isComplete,
  isFailed,
  type Board,
  type Cell,
} from './breach';

const SIZE = 5;
const BUFFER = 7;
const SEQ_LENGTHS = [2, 3, 3];
const TIME = 30; // seconds; disabled under reduced-motion

type Status = 'playing' | 'won' | 'lost';

const key = (c: Cell) => `${c.r},${c.c}`;

export function BreachGame({
  open,
  onClose,
  sfx,
}: {
  open: boolean;
  onClose: () => void;
  sfx: (t: string) => void;
}) {
  const [board, setBoard] = useState<Board | null>(null);
  const [picks, setPicks] = useState<Cell[]>([]);
  const [status, setStatus] = useState<Status>('playing');
  const [timeLeft, setTimeLeft] = useState(TIME);
  const [reduce, setReduce] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const solvedCount = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose; // latest onClose without re-running the open/close effect

  const newGame = useCallback(() => {
    setBoard(generateBoard({ size: SIZE, bufferSize: BUFFER, seqLengths: SEQ_LENGTHS }));
    setPicks([]);
    setStatus('playing');
    setTimeLeft(TIME);
    solvedCount.current = 0;
  }, []);

  // (re)start a game whenever the overlay opens
  useEffect(() => {
    if (!open) return;
    let r = false;
    try { r = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch {}
    setReduce(r);
    newGame();
    sfx('open');
  }, [open, newGame, sfx]);

  // ESC to close, scroll lock, focus trap, and focus restore — runs once per open
  useEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    const opener = document.activeElement as HTMLElement | null; // element that triggered the dialog
    const focusables = () =>
      Array.from(
        root?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])') ?? [],
      );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    root?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      try { opener?.focus(); } catch {}
    };
  }, [open]);

  // countdown tick (pure updater); reduced-motion disables the timer entirely
  useEffect(() => {
    if (!open || status !== 'playing' || reduce) return;
    const id = window.setInterval(() => setTimeLeft((t) => (t <= 1 ? 0 : t - 1)), 1000);
    return () => window.clearInterval(id);
  }, [open, status, reduce]);

  // expiry handled outside the updater so the loss/sfx fire exactly once
  useEffect(() => {
    if (open && !reduce && status === 'playing' && timeLeft <= 0) { setStatus('lost'); sfx('error'); }
  }, [open, reduce, status, timeLeft, sfx]);

  if (!open || !board) return null;

  const buffer = codesAlong(board.grid, picks);
  const legal = status === 'playing' ? legalCells(SIZE, picks) : [];
  const legalSet = new Set(legal.map(key));
  const usedSet = new Set(picks.map(key));
  const solved = evaluateSequences(buffer, board.sequences);

  const onPick = (r: number, c: number) => {
    if (status !== 'playing' || !legalSet.has(`${r},${c}`)) return;
    const next = [...picks, { r, c }];
    const nextBuffer = codesAlong(board.grid, next);
    setPicks(next);
    sfx('click');

    if (isComplete(nextBuffer, board.sequences)) {
      setStatus('won');
      sfx('override');
      return;
    }
    const nowSolved = evaluateSequences(nextBuffer, board.sequences).filter(Boolean).length;
    if (nowSolved > solvedCount.current) sfx('success');
    solvedCount.current = nowSolved;

    if (isFailed(nextBuffer, board.sequences, BUFFER)) { setStatus('lost'); sfx('error'); }
  };

  const timePct = reduce ? 100 : Math.max(0, (timeLeft / TIME) * 100);

  return (
    <div className="os-breach" role="dialog" aria-modal="true" aria-label="Breach Protocol minigame" ref={rootRef} tabIndex={-1}>
      <div className="os-breach-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="os-breach-panel">
        <span className="os-corner tl" /><span className="os-corner tr" /><span className="os-corner bl" /><span className="os-corner br" />

        <div className="os-breach-head">
          <span className="os-breach-title">BREACH PROTOCOL <span className="dim">{'// network intrusion'}</span></span>
          <button type="button" className="os-breach-x" onClick={onClose} aria-label="Abort breach">✕ ABORT</button>
        </div>

        {!reduce && (
          <div className="os-breach-timer" aria-hidden="true">
            <div className="os-breach-timer-bar" style={{ width: `${timePct}%` }} />
          </div>
        )}

        {/* buffer */}
        <div className="os-breach-buffer-wrap">
          <span className="os-breach-label">BUFFER</span>
          <div className="os-breach-buffer">
            {Array.from({ length: BUFFER }, (_, i) => (
              <span className={`os-breach-slot${buffer[i] ? ' on' : ''}`} key={i}>{buffer[i] || ''}</span>
            ))}
          </div>
        </div>

        <div className="os-breach-grid-wrap">
          {/* code matrix */}
          <div className="os-breach-matrix" role="group" aria-label="Code matrix" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
            {board.grid.map((row, r) =>
              row.map((code, c) => {
                const k = `${r},${c}`;
                const isUsed = usedSet.has(k);
                const isLegal = legalSet.has(k);
                return (
                  <button
                    type="button"
                    key={k}
                    className={`os-breach-cell${isUsed ? ' used' : ''}${isLegal ? ' legal' : ''}`}
                    disabled={!isLegal}
                    onClick={() => onPick(r, c)}
                    aria-label={`Row ${r + 1} column ${c + 1}, code ${code}${isLegal ? ', selectable' : ''}`}
                  >
                    {code}
                  </button>
                );
              }),
            )}
          </div>

          {/* sequences */}
          <div className="os-breach-seqs">
            <span className="os-breach-label">SEQUENCES REQUIRED</span>
            {board.sequences.map((seq, i) => (
              <div className={`os-breach-seq${solved[i] ? ' done' : ''}`} key={`${seq.join('-')}_${i}`}>
                <span className="os-breach-seq-codes">
                  {seq.map((code, j) => <span className="os-breach-seq-code" key={j}>{code}</span>)}
                </span>
                <span className="os-breach-seq-status">{solved[i] ? 'INSTALLED ✓' : `DAEMON_${i + 1}`}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="os-breach-foot">
          <span className="os-breach-hint">
            {status === 'playing'
              ? 'Pick codes — alternates row → column → row. Match the sequences before the buffer fills.'
              : status === 'won'
                ? '◢ ALL DAEMONS UPLOADED — ACCESS GRANTED ◣'
                : '◢ BUFFER OVERFLOW — INTRUSION FAILED ◣'}
          </span>
          <button type="button" className="os-breach-retry" onClick={() => { sfx('click'); newGame(); }}>⟳ NEW BREACH</button>
        </div>

        {status !== 'playing' && (
          <div className={`os-breach-result ${status}`} role="status">
            <div className="h">{status === 'won' ? 'ACCESS GRANTED' : 'BREACH FAILED'}</div>
            <div className="s">{status === 'won' ? 'You uploaded every daemon.' : 'The buffer overflowed. Try again.'}</div>
            <div className="os-breach-result-actions">
              <button type="button" className="os-breach-retry" onClick={() => { sfx('click'); newGame(); }}>⟳ RETRY</button>
              <button type="button" className="os-breach-x" onClick={onClose}>✕ CLOSE</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
