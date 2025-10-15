import { useCallback, useEffect } from 'react';

type UseFindBarShortcutsProps = {
    setVisible: (visible: boolean) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    clearHighlights: () => void;
    next: () => void;
    prev: () => void;
};

export const useFindBarShortcuts = ({
    setVisible,
    inputRef,
    clearHighlights,
    next,
    prev,
}: UseFindBarShortcutsProps) => {
    const onKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const cmd = e.metaKey || e.ctrlKey;

            if (cmd && key === 'f') {
                e.preventDefault();
                setVisible(true);
                setTimeout(() => inputRef.current?.select());

                return;
            }

            if (cmd && key === 'g' && !e.shiftKey) {
                e.preventDefault();
                next();

                return;
            }

            if (cmd && key === 'g' && e.shiftKey) {
                e.preventDefault();
                prev();

                return;
            }

            if (key === 'enter' && document.activeElement === inputRef.current) {
                e.preventDefault();
                next();

                return;
            }

            if (key === 'escape') {
                e.preventDefault();
                clearHighlights();
                setVisible(false);

                return;
            }
        },
        [setVisible, inputRef, clearHighlights, next, prev],
    );

    useEffect(() => {
        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onKeyDown]);
};
