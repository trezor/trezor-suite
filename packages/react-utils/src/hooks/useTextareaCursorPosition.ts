import { useCallback, useEffect, useRef, useState } from 'react';

interface CursorPosition {
    line: number;
    column: number;
}

/**
 * Hook that tracks the cursor position (line and column) inside a `<textarea>`.
 *
 * Uses the `selectionchange` event to update whenever the caret moves
 * (typing, arrow keys, mouse clicks, or text selection).
 *
 * @example
 * ```tsx
 * const { textareaRef, position } = useTextareaCursorPosition();
 *
 * return (
 *   <>
 *     <textarea ref={textareaRef} />
 *     <div>
 *       Line {position.line}, Column {position.column}
 *     </div>
 *   </>
 * );
 * ```
 *
 * @returns `{ textareaRef, position }`
 * - `textareaRef`: callback ref for the `<textarea>`
 * - `position`: current cursor `{ line, column }`
 */
export const useTextareaCursorPosition = () => {
    const [position, setPosition] = useState<CursorPosition>({ line: 1, column: 1 });
    const cleanupRef = useRef<(() => void) | undefined>(undefined);

    const textareaRef = useCallback((el: HTMLTextAreaElement | null) => {
        cleanupRef.current?.();
        cleanupRef.current = undefined;

        if (!el) return;

        const update = () => {
            const text = el.value ?? '';
            const pos = el.selectionStart ?? 0;
            const lines = text.slice(0, pos).split('\n');
            setPosition({ line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 });
        };

        update();

        const onSelectionChange = () => {
            if (document.activeElement === el) update();
        };
        document.addEventListener('selectionchange', onSelectionChange);

        cleanupRef.current = () => {
            document.removeEventListener('selectionchange', onSelectionChange);
        };
    }, []);

    useEffect(() => () => cleanupRef.current?.(), []);

    return { textareaRef, position };
};
