import { useCallback, useEffect, useRef, useState } from 'react';

import { highlightText, removeHighlights } from './highlight';

type UseFindInPageProps = {
    root?: HTMLElement | string;
    ignoreSelector?: string;
    debounceMs?: number;
    isActive: boolean;
};

export const useFindInPage = ({
    isActive,
    debounceMs = 150,
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
        const root = getRoot();
        observerRef.current?.observe(root, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: false,
        });
    }, [getRoot]);

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
        document.querySelector<HTMLElement>(`mark.find-highlight[data-find-ordinal="${ord}"]`);

    const applyActiveOrdinal = useCallback((ord: number | null, scrollIntoView = false) => {
        const marks = Array.from(document.querySelectorAll<HTMLElement>('mark.find-highlight'));
        marks.forEach(m => {
            if (m.getAttribute('data-active') === 'true') m.setAttribute('data-active', 'false');
        });

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

        const old = el.querySelector('.find-highlight-pulse');
        if (old) old.remove();

        const pulse = document.createElement('span');
        pulse.className = 'find-highlight-pulse';
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

    const runHighlight = useCallback(
        (q: string, opts?: { keepActive?: boolean }) => {
            const { keepActive = false } = opts || {};
            const root = getRoot();
            let total = 0;

            withObserverPaused(() => {
                total = highlightText(root, q);
            });

            setQuery(q);
            setCount(total);

            if (keepActive && activeOrdinalRef.current != null) {
                const ord = clampOrdinal(activeOrdinalRef.current, total);
                applyActiveOrdinal(ord as number | null, false);
            } else {
                applyActiveOrdinal(null);
            }

            return total;
        },
        [getRoot, withObserverPaused, applyActiveOrdinal],
    );

    const updateHighlights = useCallback(
        (q: string) => runHighlight(q, { keepActive: false }),
        [runHighlight],
    );

    const clearHighlights = useCallback(() => {
        const root = getRoot();
        setQuery('');
        setCount(0);
        applyActiveOrdinal(null);

        withObserverPaused(() => removeHighlights(root));
    }, [getRoot, withObserverPaused, applyActiveOrdinal]);

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

    const schedule = useCallback(
        (fn: () => void) => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            debounceTimer.current = window.setTimeout(fn, debounceMs);
        },
        [debounceMs],
    );

    useEffect(() => {
        if (!isActive) return;

        const obs = new MutationObserver(muts => {
            if (!query) return;
            if (isMutatingRef.current) return;

            const relevant = muts.some(m => {
                const t = m.target as Node;
                if (t instanceof HTMLElement) {
                    if (ignoreSelector && t.closest(ignoreSelector)) return false;
                    if (t.closest('mark.find-highlight')) return false;
                }

                return m.type === 'characterData' || m.type === 'childList';
            });

            if (!relevant) return;

            schedule(() => runHighlight(query, { keepActive: true }));
        });

        observerRef.current = obs;
        observeRoot();

        return () => {
            obs.disconnect();
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [isActive, getRoot, observeRoot, schedule, query, ignoreSelector, runHighlight]);

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
