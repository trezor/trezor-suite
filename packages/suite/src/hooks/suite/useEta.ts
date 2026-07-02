import { useEffect, useRef, useState } from 'react';

// Estimate the time left to reach `total` from `current` (e.g. blocks scanned vs chain height), using
// the rate of progress over a sliding window. A windowed average (rather than the all-time average)
// keeps the estimate responsive — Monero block scanning runs orders of magnitude faster on empty
// early blocks than on dense recent ones, so the rate changes a lot over a run.

// How far back to measure the rate. Long enough to smooth out bursty progress, short enough to track
// a changing rate.
const ETA_WINDOW_MS = 3 * 60_000;
// Require at least this much measured progress before showing an estimate, so the first samples don't
// produce a wild number.
const ETA_MIN_SPAN_MS = 15_000;

/** Estimated milliseconds remaining, or null while not running / done / not enough data yet. */
export const useEta = (current: number, total: number): number | null => {
    const samples = useRef<{ time: number; value: number }[]>([]);
    const [etaMs, setEtaMs] = useState<number | null>(null);

    useEffect(() => {
        if (total <= 0 || current <= 0 || current >= total) {
            samples.current = [];
            setEtaMs(null);

            return;
        }

        const now = Date.now();
        const buffer = samples.current;
        const last = buffer.at(-1);
        // Progress went backwards (the scan was restarted) — drop the stale history.
        if (last && current < last.value) {
            buffer.length = 0;
        }
        if (!buffer.length || buffer.at(-1)!.value !== current) {
            buffer.push({ time: now, value: current });
        }
        // Keep only the samples within the window (but always at least two to measure a rate).
        while (buffer.length > 2 && now - buffer[0]!.time > ETA_WINDOW_MS) {
            buffer.shift();
        }

        const oldest = buffer[0]!;
        const newest = buffer.at(-1)!;
        const elapsed = newest.time - oldest.time;
        const progressed = newest.value - oldest.value;
        if (elapsed >= ETA_MIN_SPAN_MS && progressed > 0) {
            setEtaMs(((total - current) / progressed) * elapsed);
        }
    }, [current, total]);

    return etaMs;
};
