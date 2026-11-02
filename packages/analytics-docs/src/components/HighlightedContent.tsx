import { Children, type ReactNode } from 'react';

import { HighlightedText } from './HighlightedText';

type HighlightedContentProps = {
    children: ReactNode;
    query: string;
};

export const HighlightedContent = ({ children, query }: HighlightedContentProps) => {
    if (!query.trim()) return children;

    return Children.map(children, child => {
        if (typeof child === 'string' || typeof child === 'number') {
            return <HighlightedText text={String(child)} query={query} />;
        }

        return child;
    });
};
