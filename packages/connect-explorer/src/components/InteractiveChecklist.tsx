import { useEffect } from 'react';

import { useRouter } from 'next/router';

// Nextra renders GFM task lists (`- [ ]`) as disabled checkboxes. This component enables
// every task-list checkbox on the current page and persists the ticked state in localStorage,
// so a reader can work through a long checklist (e.g. the migration guide) across sessions.
// It renders nothing itself — drop a single <InteractiveChecklist /> anywhere on the page.

const hashLabel = (text: string) => {
    let hash = 5381;
    for (let i = 0; i < text.length; i++) {
        hash = (hash * 33) ^ text.charCodeAt(i);
    }

    return (hash >>> 0).toString(36);
};

export const InteractiveChecklist = () => {
    const router = useRouter();

    useEffect(() => {
        const storageKey = `connect-explorer:checklist:${router.pathname}`;

        let saved: Record<string, boolean> = {};
        try {
            saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
        } catch {
            saved = {};
        }

        const checkboxes = Array.from(
            document.querySelectorAll<HTMLInputElement>(
                '.nextra-content li.task-list-item > input[type="checkbox"]',
            ),
        );

        // Key by a hash of the item's text so ticks survive reordering; editing an item's
        // wording just drops that one tick, which is acceptable.
        const keyFor = (checkbox: HTMLInputElement) =>
            hashLabel(checkbox.parentElement?.textContent?.trim() ?? '');

        const persist = () => {
            const state: Record<string, boolean> = {};
            checkboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    state[keyFor(checkbox)] = true;
                }
            });
            try {
                localStorage.setItem(storageKey, JSON.stringify(state));
            } catch {
                // Ignore storage errors (private mode, quota exceeded, ...).
            }
        };

        const cleanups = checkboxes.map(checkbox => {
            checkbox.disabled = false;
            checkbox.style.cursor = 'pointer';
            if (saved[keyFor(checkbox)]) {
                checkbox.checked = true;
            }
            const onChange = () => persist();
            checkbox.addEventListener('change', onChange);

            return () => checkbox.removeEventListener('change', onChange);
        });

        return () => cleanups.forEach(cleanup => cleanup());
    }, [router.pathname]);

    return null;
};

export default InteractiveChecklist;
