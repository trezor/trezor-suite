import { type ReactNode, type RefObject } from 'react';

import { useAnchor } from './useAnchor';

export type AnchorRenderProps = {
    anchorId: string;
    anchorRef: RefObject<HTMLDivElement | null>;
    shouldHighlight: boolean;
};

type AnchorProps = {
    anchorId: string;
    children: (props: AnchorRenderProps) => ReactNode;
};

export const Anchor = ({ anchorId, children }: AnchorProps) => {
    const { anchorRef, shouldHighlight } = useAnchor(anchorId);

    return children({ anchorId, anchorRef, shouldHighlight });
};
