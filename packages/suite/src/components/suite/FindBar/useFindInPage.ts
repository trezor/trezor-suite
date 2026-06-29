import { useCallback, useEffect, useRef, useState } from 'react';

import {
    FIND_HIGHLIGHT_SELECTOR,
    MARK_HIGHLIGHT_PULSE_CLASSNAME,
    MARK_HIGHLIGHT_PULSE_SELECTOR,
} from './consts';
import { highlightText, removeHighlights } from './highlight';

const DEBOUNCE_TIME = 100;
const IGNORE_SELECTOR = '[data-find-ignore]';

export const useFindInPage = () => {
    const [query, setQuery] = useState('');
    const [count, setCount] = useState(0);
    const [position, setPosition] = useState(0);

    const rootRef = useRef<HTMLElement | null>(null);
    const observerRef = useRef<MutationObserver | null>(null);
    const debounceTimer = useRef<number | null>(null);
    const isMutatingRef = useRef(false);
    const activeOrdinalRef = useRef<number | null>(null);

    const seqRef = useRef(0);
    const queryRef = useRef('');

    const rootElement = (rootRef.current = document.getElementById('root') || document.body);

    const observeRoot = useCallback(() => {
        observerRef.current?.observe(rootElement, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: false,
        });
    }, [rootElement]);

    const cancelScheduled = useCallback(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
        }
    }, []);

    const withObserverPaused = useCallback(
        (fn: () => void) => {
            const obs = observerRef.current;
            isMutatingRef.current = true;
            obs?.disconnect();
            try {
                fn();
            } finally {
                requestAnimationFrame(() => {
                    isMutatingRef.current = false;
                    obs?.takeRecords();
                    observeRoot();
                });
            }
        },
        [observeRoot],
    );

    const queryMarkByOrdinal = (ord: number) =>
        document.querySelector<HTMLElement>(
            `${FIND_HIGHLIGHT_SELECTOR}[data-find-ordinal="${ord}"]`,
        );

    const applyActiveOrdinal = useCallback((ord: number | null, scrollIntoView = false) => {
        const marks = Array.from(document.querySelectorAll<HTMLElement>(FIND_HIGHLIGHT_SELECTOR));
        marks.forEach(m => m.setAttribute('data-active', 'false'));

        if (ord == null) {
            activeOrdinalRef.current = null;
            setPosition(0);

            return;
        }

        const el = queryMarkByOrdinal(ord);
        if (!el) {
            activeOrdinalRef.current = null;
            setPosition(0);

            return;
        }

        el.setAttribute('data-active', 'true');
        if (scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        activeOrdinalRef.current = ord;
        setPosition(ord + 1);
    }, []);

    const animateActivePulse = useCallback((ord: number) => {
        const el = queryMarkByOrdinal(ord);
        if (!el) return;

        const old = el.querySelector(MARK_HIGHLIGHT_PULSE_SELECTOR);
        if (old) old.remove();

        const pulse = document.createElement('span');
        pulse.className = MARK_HIGHLIGHT_PULSE_CLASSNAME;
        el.appendChild(pulse);

        pulse.animate(
            [
                { transform: 'scale(1.4)', opacity: 0.8 },
                { transform: 'scale(1.0)', opacity: 0 },
            ],
            {
                duration: 350,
                easing: 'ease-out',
                fill: 'forwards',
            },
        );

        setTimeout(() => pulse.remove(), 400);
    }, []);

    const clampOrdinal = (ord: number, total: number) => {
        if (total <= 0) return null;
        if (ord < 0) return 0;
        if (ord >= total) return total - 1;

        return ord;
    };

    const removeAllMarks = useCallback(() => {
        withObserverPaused(() => removeHighlights(rootElement));
    }, [rootElement, withObserverPaused]);

    // Main function that runs highlighting logic.
    // Temporarily pauses the MutationObserver to avoid feedback loops, re-highlights matches for the current query and optionally keeps the active match focused when keepActive=true.
    const runHighlight = useCallback(
        (q: string, opts?: { keepActive?: boolean }) => {
            const raw = q;
            const trimmed = raw.trim();

            setQuery(raw);
            queryRef.current = raw;

            if (!trimmed) {
                removeAllMarks();
                setCount(0);
                applyActiveOrdinal(null);

                return 0;
            }

            const { keepActive = false } = opts || {};
            let total = 0;

            withObserverPaused(() => {
                total = highlightText(rootElement, trimmed);
            });

            setCount(total);

            if (keepActive && activeOrdinalRef.current != null) {
                const ord = clampOrdinal(activeOrdinalRef.current, total);
                applyActiveOrdinal(ord, false);
            } else {
                applyActiveOrdinal(null);
            }

            return total;
        },
        [rootElement, withObserverPaused, applyActiveOrdinal, removeAllMarks],
    );

    const updateHighlights = useCallback(
        (q: string) => {
            seqRef.current += 1;

            return runHighlight(q, { keepActive: false });
        },
        [runHighlight],
    );

    const clearHighlights = useCallback(() => {
        seqRef.current += 1;
        cancelScheduled();
        setQuery('');
        queryRef.current = '';
        setCount(0);
        applyActiveOrdinal(null);
        removeAllMarks();
    }, [cancelScheduled, removeAllMarks, applyActiveOrdinal]);

    const next = useCallback(() => {
        if (count <= 0) return;
        const cur = activeOrdinalRef.current;
        const ord = cur == null ? 0 : (cur + 1) % count;
        applyActiveOrdinal(ord, true);
        animateActivePulse(ord);
    }, [count, applyActiveOrdinal, animateActivePulse]);

    const prev = useCallback(() => {
        if (count <= 0) return;
        const cur = activeOrdinalRef.current;
        const ord = cur == null ? count - 1 : (cur - 1 + count) % count;
        applyActiveOrdinal(ord, true);
        animateActivePulse(ord);
    }, [count, applyActiveOrdinal, animateActivePulse]);

    const scheduleRehighlight = useCallback(
        (q: string, keepActive: boolean) => {
            cancelScheduled();
            const scheduledSeq = ++seqRef.current;

            debounceTimer.current = window.setTimeout(() => {
                if (scheduledSeq !== seqRef.current) return;
                if (!q.trim()) return;

                runHighlight(q, { keepActive });
            }, DEBOUNCE_TIME);
        },
        [runHighlight, cancelScheduled],
    );

    useEffect(() => {
        if (!query.trim()) return;

        const obs = new MutationObserver(muts => {
            if (isMutatingRef.current) return;

            const relevant = muts.some(m => {
                const node = m.target;

                const getParentElement = () =>
                    node.parentElement instanceof HTMLElement ? node.parentElement : null;

                const el = node instanceof HTMLElement ? node : getParentElement();

                if (el) {
                    if (IGNORE_SELECTOR && el.closest(IGNORE_SELECTOR)) return false;
                    if (el.closest(FIND_HIGHLIGHT_SELECTOR)) return false;
                }

                return m.type === 'characterData' || m.type === 'childList';
            });

            if (!relevant) return;

            scheduleRehighlight(queryRef.current, true);
        });

        observerRef.current = obs;
        observeRoot();

        return () => {
            observerRef.current = null;
            obs.disconnect();
            cancelScheduled();
        };
    }, [observeRoot, scheduleRehighlight, cancelScheduled, query]);

    useEffect(() => () => clearHighlights(), [clearHighlights]);

    return {
        query,
        count,
        position,
        updateHighlights,
        clearHighlights,
        next,
        prev,
    };
};
