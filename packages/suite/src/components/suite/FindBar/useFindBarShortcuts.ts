import { useCallback, useEffect } from 'react';

type UseFindBarShortcutsProps = {
    setVisible: (visible: boolean) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    selectQuery: () => void;
    stop: () => void;
    next: () => void;
    prev: () => void;
};

export const useFindBarShortcuts = ({
    setVisible,
    inputRef,
    selectQuery,
    stop,
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
                selectQuery();

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
                if (e.shiftKey) prev();
                else next();

                return;
            }

            if (key === 'escape') {
                e.preventDefault();
                stop();
                setVisible(false);

                return;
            }
        },
        [setVisible, selectQuery, inputRef, stop, next, prev],
    );

    useEffect(() => {
        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onKeyDown]);
};
