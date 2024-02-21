import { ReactNode, useRef, useState } from 'react';
import { LayoutContext, LayoutContextPayload } from 'src/support/suite/LayoutContext';
import { ModalContextProvider } from 'src/support/suite/ModalContext';
import { useResetScrollOnUrl } from 'src/hooks/suite/useResetScrollOnUrl';
import { GuideButton, GuideRouter } from 'src/components/guide';
import { useLayoutSize } from 'src/hooks/suite';
import { useClearAnchorHighlightOnClick } from 'src/hooks/suite/useClearAnchorHighlightOnClick';
import { Metadata } from '../Metadata';
import { ModalSwitcher } from '../modals/ModalSwitcher/ModalSwitcher';
import {
    AppWrapper,
    Body,
    Columns,
    ContentWrapper,
    PageWrapper,
    Wrapper,
} from './SuiteLayout/SuiteLayout';

interface LoggedOutLayout {
    children: ReactNode;
}

export const LoggedOutLayout = ({ children }: LoggedOutLayout) => {
    const [{ title, TopMenu }, setLayoutPayload] = useState<LayoutContextPayload>({});

    const { scrollRef } = useResetScrollOnUrl();
    const { isMobileLayout } = useLayoutSize();
    const wrapperRef = useRef<HTMLDivElement>(null);

    useClearAnchorHighlightOnClick(wrapperRef);

    return (
        <Wrapper ref={wrapperRef}>
            <PageWrapper>
                <ModalContextProvider>
                    <Metadata title={title} />
                    <ModalSwitcher />

                    <LayoutContext.Provider value={setLayoutPayload}>
                        <Body data-test-id="@suite-layout/body">
                            <Columns>
                                <AppWrapper data-test-id="@app" ref={scrollRef} id="layout-scroll">
                                    {TopMenu && <TopMenu />}

                                    <ContentWrapper>{children}</ContentWrapper>
                                </AppWrapper>
                            </Columns>
                        </Body>
                    </LayoutContext.Provider>

                    {!isMobileLayout && <GuideButton />}
                </ModalContextProvider>
            </PageWrapper>
            <GuideRouter />
        </Wrapper>
    );
};
