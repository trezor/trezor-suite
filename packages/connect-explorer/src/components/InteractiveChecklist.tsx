import { useEffect } from 'react';

import { useRouter } from 'next/router';
import { createGlobalStyle } from 'styled-components';

// Nextra renders GFM task lists (`- [ ]`) as disabled checkboxes. This component enables
// every task-list checkbox on the current page and persists the ticked state in localStorage,
// so a reader can work through a long checklist (e.g. the migration guide) across sessions.
// Drop a single <InteractiveChecklist /> anywhere on the page.

// Markdown decides list spacing for us: an item containing a code block renders "loose" (its
// content wrapped in <p>) while plain items render "tight", which makes the gaps between steps
// inconsistent. Set the spacing explicitly instead so every checklist reads the same.
const ChecklistStyle = createGlobalStyle`
    .nextra-content ul.contains-task-list > li.task-list-item {
        margin-top: 20px;
    }

    .nextra-content ul.contains-task-list > li.task-list-item:first-child {
        margin-top: 0;
    }

    /* Loose items wrap content in <p> — don't stack its margin on top of the item's. */
    .nextra-content ul.contains-task-list > li.task-list-item > p:first-child {
        margin-top: 0;
    }

    /* Sub-bullets belong to their parent item, so keep them close to it. */
    .nextra-content ul.contains-task-list ul > li {
        margin-top: 6px;
    }

    .nextra-content li.task-list-item input[type='checkbox']:not([disabled]) {
        cursor: pointer;
    }
`;

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

        // A loose item nests its checkbox inside a <p>, so match on descendants rather than
        // direct children — otherwise those items stay disabled.
        const checkboxes = Array.from(
            document.querySelectorAll<HTMLInputElement>(
                '.nextra-content li.task-list-item input[type="checkbox"]',
            ),
        );

        // Key by a hash of the item's text so ticks survive reordering; editing an item's
        // wording just drops that one tick, which is acceptable.
        const keyFor = (checkbox: HTMLInputElement) =>
            hashLabel(checkbox.closest('li')?.textContent?.trim() ?? '');

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
            if (saved[keyFor(checkbox)]) {
                checkbox.checked = true;
            }
            const onChange = () => persist();
            checkbox.addEventListener('change', onChange);

            return () => checkbox.removeEventListener('change', onChange);
        });

        return () => cleanups.forEach(cleanup => cleanup());
    }, [router.pathname]);

    return <ChecklistStyle />;
};

export default InteractiveChecklist;
