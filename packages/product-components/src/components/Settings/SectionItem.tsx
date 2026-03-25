import { type HTMLAttributes, forwardRef } from 'react';

import styled from 'styled-components';

import { breakpoints } from '@trezor/theme';

import { OutlineHighlight } from './OutlineHighlight';

const ResponsiveFlex = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;

    @media (max-width: ${breakpoints.mobile}px) {
        flex-direction: column;
        align-items: normal;
    }
`;

interface SectionItemProps extends HTMLAttributes<HTMLDivElement> {
    shouldHighlight?: boolean;
}

export const SectionItem = forwardRef<HTMLDivElement, SectionItemProps>(
    ({ children, shouldHighlight, ...rest }, ref) => (
        <div ref={ref} {...rest}>
            <OutlineHighlight shouldHighlight={shouldHighlight}>
                <ResponsiveFlex>{children}</ResponsiveFlex>
            </OutlineHighlight>
        </div>
    ),
);
