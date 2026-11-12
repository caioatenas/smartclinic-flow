import { useEffect, useRef, useState } from 'react';
import type { Ticket } from '@/lib/clinic-types';

export type Announcement = { key: string; ticket: Ticket; place: string };

function chime(ctx: AudioContext) {
  const notes = [880, 660, 990];
  notes.forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    const t = ctx.currentTime + i * 0.35;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.4, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.65);
  });
}

function speak(text: string): Promise<void> {
  return new Promise(resolve => {
    if (!('speechSynthesis' in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = 0.9;
    const v = speechSynthesis.getVoices().find(v => v.lang?.toLowerCase().startsWith('pt'));
    if (v) u.voice = v;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
    setTimeout(resolve, 12000);
  });
}

const spellCode = (code: string) => code.replace(/^([A-Z])0*(\d+)$/, '$1 $2');

/** Detects new calls (reception or doctor), plays a chime + voice and exposes the current highlight. */
export function useCallAnnouncer(called: Ticket[], placeOf: (t: Ticket) => string, ready: boolean) {
  const [enabled, setEnabled] = useState(false);
  const [current, setCurrent] = useState<Announcement | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const queue = useRef<Announcement[]>([]);
  const busy = useRef(false);
  const ctx = useRef<AudioContext | null>(null);
  const enabledRef = useRef(false);
  enabledRef.current = enabled;

  const run = async () => {
    if (busy.current) return;
    busy.current = true;
    while (queue.current.length) {
      const a = queue.current.shift()!;
      setCurrent(a);
      if (enabledRef.current && ctx.current) {
        chime(ctx.current);
        await new Promise(r => setTimeout(r, 1200));
        const name = a.ticket.patientName ? `, ${a.ticket.patientName}` : '';
        const msg = `Senha ${spellCode(a.ticket.code)}${name}. Dirija-se a ${a.place}.`;
        await speak(msg);
        await new Promise(r => setTimeout(r, 2500));
      } else {
        await new Promise(r => setTimeout(r, 6000));
      }
    }
    setCurrent(null);
    busy.current = false;
  };

  useEffect(() => {
    if (!ready) return;
    const keys = called.map(t => `${t.id}:${t.status}`);
    if (!seen.current) {
      seen.current = new Set(keys); // don't announce calls that existed before the TV opened
      return;
    }
    const fresh = called.filter(t => !seen.current!.has(`${t.id}:${t.status}`));
    fresh.forEach(t => {
      const key = `${t.id}:${t.status}`;
      seen.current!.add(key);
      queue.current.push({ key, ticket: t, place: placeOf(t) });
    });
    if (fresh.length) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [called, ready]);

  const enable = () => {
    ctx.current = ctx.current || new AudioContext();
    ctx.current.resume();
    speechSynthesis?.getVoices();
    chime(ctx.current);
    setEnabled(true);
  };

  const replay = (t: Ticket) => {
    queue.current.push({ key: `${t.id}:replay:${Date.now()}`, ticket: t, place: placeOf(t) });
    run();
  };

  return { enabled, enable, current, replay };
}
