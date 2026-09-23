import { type ReactNode, type RefObject, useContext } from 'react';

import styled from 'styled-components';

import { variables } from '@trezor/components';

import { LayoutPayloadContext } from 'src/support/suite/LayoutContext';

import { ContentContainer } from '../ContentContainer';
import { LayoutFooterSlot, LayoutHeaderSlot } from './LayoutSlots';

const AppWrapper = styled.div<{ $isContentStatic: boolean }>`
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: ${({ $isContentStatic }) => ($isContentStatic ? 'hidden' : 'auto scroll')};
    width: 100%;
    background: ${({ theme }) => theme.surfaceFillPage};
    align-items: ${({ $isContentStatic }) => ($isContentStatic ? 'stretch' : 'center')};
    position: relative;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        overflow-x: hidden;
    }
`;

type AppScrollAreaProps = {
    children: ReactNode;
    scrollRef: RefObject<HTMLDivElement | null>;
    ['data-testid']?: string;
};

/**
 * The app's main scroll container, and the only element that reads `isContentFullBleed`.
 *
 * It is a component rather than inline JSX in `SuiteLayout` on purpose: `LayoutPayloadProvider` is
 * memoised and its `children` element is referentially stable, so a page publishing a new payload
 * re-renders only the consumers below it. Reading the context up in `SuiteLayout` would never see
 * the update.
 */
export const AppScrollArea = ({
    children,
    scrollRef,
    'data-testid': dataTest,
}: AppScrollAreaProps) => {
    const { isContentStatic = false } = useContext(LayoutPayloadContext);

    return (
        <AppWrapper data-testid="@app" ref={scrollRef} $isContentStatic={isContentStatic}>
            <LayoutHeaderSlot />

            <ContentContainer data-testid={dataTest} $isContentStatic={isContentStatic}>
                {children}
            </ContentContainer>

            <LayoutFooterSlot />
        </AppWrapper>
    );
};
