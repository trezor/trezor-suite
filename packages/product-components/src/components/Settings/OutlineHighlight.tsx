import { type ReactNode } from 'react';

import styled from 'styled-components';

import { type SpacingValue } from '@trezor/theme';

export type Offset =
    | {
          top?: SpacingValue;
          bottom?: SpacingValue;
          left?: SpacingValue;
          right?: SpacingValue;
          horizontal?: SpacingValue;
          vertical?: SpacingValue;
      }
    | SpacingValue;

const mapOffsetToInset = (offset: Offset) => {
    if (typeof offset === 'object') {
        const top = offset.top ?? offset.vertical ?? 0;
        const right = offset.right ?? offset.horizontal ?? 0;
        const bottom = offset.bottom ?? offset.vertical ?? 0;
        const left = offset.left ?? offset.horizontal ?? 0;

        return `${-top}px ${-right}px ${-bottom}px ${-left}px`;
    }

    return `-${offset}px`;
};

const Wrapper = styled.div<{ $shouldHighlight?: boolean; $offset: Offset }>`
    position: relative;

    &::before {
        content: '';
        position: absolute;
        inset: ${({ $offset }) => mapOffsetToInset($offset)};
        outline: solid 2px ${({ theme }) => theme.elementBorderWarningSofter};
        background: ${({ theme }) => theme.elementFillWarningSofter};
        transition: opacity 0.6s ease-in;
        transition-delay: 0.3s;
        opacity: 0;
        border-radius: 16px;
        outline-offset: -2px;
        pointer-events: none;

        ${({ $shouldHighlight }) => $shouldHighlight && 'opacity: 1;'};
    }
`;

type OutlineHighlightProps = {
    shouldHighlight?: boolean;
    offset?: Offset;
    children: ReactNode;
};

export const OutlineHighlight = ({
    shouldHighlight,
    offset = 0,
    children,
}: OutlineHighlightProps) => (
    <Wrapper $shouldHighlight={shouldHighlight} $offset={offset}>
        {children}
    </Wrapper>
);
