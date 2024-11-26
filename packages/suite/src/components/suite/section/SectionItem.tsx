import { forwardRef, HTMLAttributes } from 'react';

import styled from 'styled-components';

import { Flex, variables, useMediaQuery } from '@trezor/components';

import { anchorOutlineStyles } from 'src/utils/suite/anchor';
import { SUBPAGE_NAV_HEIGHT } from 'src/constants/suite/layout';

const Wrapper = styled.div`
    /* height of secondary panel and a gap between sections */
    scroll-margin-top: calc(${SUBPAGE_NAV_HEIGHT} + 79px);
`;

const Content = styled.div<{ $shouldHighlight?: boolean }>`
    ${anchorOutlineStyles}
`;

interface SectionItemProps extends HTMLAttributes<HTMLDivElement> {
    shouldHighlight?: boolean;
}

export const SectionItem = forwardRef<HTMLDivElement, SectionItemProps>(
    ({ children, shouldHighlight, ...rest }, ref) => {
        const isBelowMobile = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.SM})`);

        return (
            <Wrapper ref={ref} {...rest}>
                <Content $shouldHighlight={shouldHighlight}>
                    <Flex
                        direction={isBelowMobile ? 'column' : 'row'}
                        alignItems={isBelowMobile ? 'normal' : 'center'}
                    >
                        {children}
                    </Flex>
                </Content>
            </Wrapper>
        );
    },
);
