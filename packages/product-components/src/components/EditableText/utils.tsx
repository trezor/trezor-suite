import { useEffect, useRef } from 'react';

export const useOuterClick = (callback: (e: MouseEvent) => void) => {
    const callbackRef = useRef<((e: MouseEvent) => void) | null>(null);
    const innerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        callbackRef.current = callback;
    });

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                innerRef.current &&
                callbackRef.current &&
                !innerRef.current.contains(e.target as Node)
            )
                callbackRef.current(e);
        }
        document.addEventListener('click', handleClick);

        return () => document.removeEventListener('click', handleClick);
    }, []);

    return innerRef;
};

type ShortcutsProps = {
    isEditable: boolean;
    handleSave: () => void;
    handleCancel: () => void;
};

export const useShortcuts = ({ isEditable, handleSave, handleCancel }: ShortcutsProps) => {
    useEffect(() => {
        const downHandler = (e: KeyboardEvent) => {
            if (isEditable) {
                if (e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    if (e.key === 'Enter') {
                        handleSave();
                    } else {
                        handleCancel();
                    }
                }
            }
        };

        window.addEventListener('keydown', downHandler);

        return () => {
            window.removeEventListener('keydown', downHandler);
        };
    }, [handleCancel, handleSave, isEditable]);
};
