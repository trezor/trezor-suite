import React, { type ReactNode, type RefObject, useEffect, useState } from 'react';

export const SAVED_STATUS_TIMEOUT = 3000;

export const escapeCssContent = (str: string): string =>
    str
        .replace(/\\/g, '\\\\') // Escape backslashes first
        .replace(/'/g, "\\'") // Escape single quotes
        .replace(/\n/g, '\\A ') // Escape newlines
        .replace(/"/g, '\\"'); // Escape double quotes

export const extractTextFromNode = (node: ReactNode): string => {
    if (!node) {
        return '';
    }

    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }

    if (Array.isArray(node)) {
        return node.map(extractTextFromNode).join('');
    }

    if (React.isValidElement(node)) {
        const props = node.props as { children?: ReactNode };

        if (props?.children) {
            return extractTextFromNode(props.children);
        }

        return '';
    }

    return '';
};

type ShortcutsProps = {
    isEditable: boolean;
    isDirty: boolean;
    handleSave: () => void;
    handleCancel: () => void;
};

export const useShortcuts = ({ isEditable, isDirty, handleSave, handleCancel }: ShortcutsProps) => {
    useEffect(() => {
        if (!isEditable) return;

        const downHandler = (e: KeyboardEvent) => {
            if (isEditable) {
                if (e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();

                    if (e.key === 'Enter' && isDirty) {
                        handleSave();
                    } else if (e.key === 'Escape') {
                        handleCancel();
                    }
                }
            }
        };

        window.addEventListener('keydown', downHandler);

        return () => {
            window.removeEventListener('keydown', downHandler);
        };
    }, [handleCancel, handleSave, isEditable, isDirty]);
};

type UseTextTruncationProps = {
    elementRef: RefObject<HTMLElement | null>;
    isEditable: boolean;
};

export const useTextTruncation = ({ elementRef, isEditable }: UseTextTruncationProps) => {
    const [isTextTruncated, setIsTextTruncated] = useState(false);

    useEffect(() => {
        if (isEditable) return;

        const checkTruncation = () => {
            if (elementRef.current) {
                const { scrollWidth, clientWidth } = elementRef.current;
                const isTruncated = scrollWidth > clientWidth;

                setIsTextTruncated(isTruncated);
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => {
                checkTruncation();
            });
        });

        requestAnimationFrame(() => {
            checkTruncation();

            if (elementRef.current) {
                resizeObserver.observe(elementRef.current);
            }
        });

        return () => {
            resizeObserver.disconnect();
        };
    }, [isEditable, elementRef]);

    return isTextTruncated;
};
