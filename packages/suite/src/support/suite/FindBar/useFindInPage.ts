import { useCallback, useEffect, useRef, useState } from 'react';

import {
    MARK_HIGHLIGHT_PULSE_CLASSNAME,
    MARK_HIGHLIGHT_PULSE_SELECTOR,
    MARK_HIGHLIGHT_SELECTOR,
} from './consts';
import { highlightText, removeHighlights } from './highlight';

type UseFindInPageProps = {
    root?: HTMLElement | string;
    ignoreSelector?: string;
    debounceMs?: number;
    isActive: boolean;
};

export const useFindInPage = ({
    isActive,
    debounceMs = 100,
    root,
    ignoreSelector = '[data-find-ignore]',
}: UseFindInPageProps) => {
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

    const getRoot = useCallback((): HTMLElement => {
        if (rootRef.current) return rootRef.current;
        if (root instanceof HTMLElement) rootRef.current = root;
        else if (typeof root === 'string')
            rootRef.current = document.querySelector(root) as HTMLElement | null;
        if (!rootRef.current)
            rootRef.current = (document.getElementById('root') || document.body) as HTMLElement;

        return rootRef.current;
    }, [root]);

    const observeRoot = useCallback(() => {
        const rootEl = getRoot();
        observerRef.current?.observe(rootEl, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: false,
        });
    }, [getRoot]);

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
            `${MARK_HIGHLIGHT_SELECTOR}[data-find-ordinal="${ord}"]`,
        );

    const applyActiveOrdinal = useCallback((ord: number | null, scrollIntoView = false) => {
        const marks = Array.from(document.querySelectorAll<HTMLElement>(MARK_HIGHLIGHT_SELECTOR));
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
        const rootEl = getRoot();
        withObserverPaused(() => removeHighlights(rootEl));
    }, [getRoot, withObserverPaused]);

    const runHighlight = useCallback(
        (q: string, opts?: { keepActive?: boolean }) => {
            const raw = q;
            const trimmed = raw.trim();

            setQuery(raw);
            queryRef.current = raw;

            if (!isActive) return 0;

            if (!trimmed) {
                removeAllMarks();
                setCount(0);
                applyActiveOrdinal(null);

                return 0;
            }

            const { keepActive = false } = opts || {};
            const rootEl = getRoot();
            let total = 0;

            withObserverPaused(() => {
                total = highlightText(rootEl, trimmed);
            });

            setCount(total);

            if (keepActive && activeOrdinalRef.current != null) {
                const ord = clampOrdinal(activeOrdinalRef.current, total);
                applyActiveOrdinal(ord as number | null, false);
            } else {
                applyActiveOrdinal(null);
            }

            return total;
        },
        [isActive, getRoot, withObserverPaused, applyActiveOrdinal, removeAllMarks],
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
                if (!isActive) return;
                if (!q.trim()) return;

                runHighlight(q, { keepActive });
            }, debounceMs);
        },
        [debounceMs, isActive, runHighlight, cancelScheduled],
    );

    useEffect(() => {
        if (!isActive || !query.trim()) return;

        const obs = new MutationObserver(muts => {
            if (isMutatingRef.current) return;

            const relevant = muts.some(m => {
                const node = m.target as Node;

                const getParentElement = () =>
                    node.parentElement instanceof HTMLElement ? node.parentElement : null;

                const el = node instanceof HTMLElement ? node : getParentElement();

                if (el) {
                    if (ignoreSelector && el.closest(ignoreSelector)) return false;
                    if (el.closest(MARK_HIGHLIGHT_SELECTOR)) return false;
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
    }, [isActive, observeRoot, ignoreSelector, scheduleRehighlight, cancelScheduled, query]);

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
