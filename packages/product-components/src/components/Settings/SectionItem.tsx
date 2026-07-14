import { type HTMLAttributes, type Ref } from 'react';

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

type SectionItemProps = HTMLAttributes<HTMLDivElement> & {
    shouldHighlight?: boolean;
    ref?: Ref<HTMLDivElement>;
};

export const SectionItem = ({ children, shouldHighlight, ref, ...rest }: SectionItemProps) => (
    <div ref={ref} {...rest}>
        <OutlineHighlight
            shouldHighlight={shouldHighlight}
            offset={{ vertical: 16, horizontal: 20 }}
        >
            <ResponsiveFlex>{children}</ResponsiveFlex>
        </OutlineHighlight>
    </div>
);
