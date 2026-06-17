import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { TrafficLightOffset } from '@suite/macos';
import { Column, Modal, Row, variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { GuideButton, GuideRouter } from 'src/components/guide';
// importing directly, otherwise unit tests fail, seems to be a styled-components issue
import { SuiteBanners } from 'src/components/suite/banners';

import { ContentContainer } from '../ContentContainer';
import { PageHeader } from '../SuiteLayout';
import { BasicName } from '../SuiteLayout/PageHeader/PageNames/BasicName';
import { Sidebar } from '../SuiteLayout/Sidebar/Sidebar';
import { MainContent } from '../SuiteLayout/SuiteLayout';

const Content = styled.div<{ $verticalCenter?: boolean }>`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    overflow-y: auto;
    height: 100%;
    ${props =>
        props.$verticalCenter &&
        `
        justify-content: center;
    `}

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: ${spacingsPx.sm};
    }
`;

const PureChildrenWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
`;

const WelcomePageHeaderWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
`;

export type WelcomeLayoutWithoutModalSwitcherProps = {
    children: ReactNode;
    showPureChildren?: boolean;
    hideSidebar?: boolean;
    showAccounts?: boolean;
};

type RightContentProps = {
    children: ReactNode;
    showPureChildren: boolean;
};

const RightSideContent = ({ showPureChildren, children }: RightContentProps) => {
    if (showPureChildren) {
        return (
            <TrafficLightOffset>
                <SuiteBanners />
                <Content $verticalCenter={true}>
                    <PureChildrenWrapper>{children}</PureChildrenWrapper>
                </Content>
            </TrafficLightOffset>
        );
    }

    return (
        <>
            <SuiteBanners />
            <WelcomePageHeaderWrapper>
                <PageHeader>
                    <BasicName>
                        <Translation id="TR_DASHBOARD" />
                    </BasicName>
                </PageHeader>
            </WelcomePageHeaderWrapper>
            <ContentContainer>{children}</ContentContainer>
        </>
    );
};

// WelcomeLayout is a top-level wrapper similar to @suite-components/SuiteLayout
// used in Preloader and Onboarding
export const WelcomeLayoutWithoutModalSwitcher = ({
    children,
    hideSidebar,
    showPureChildren = false,
    showAccounts = true,
}: WelcomeLayoutWithoutModalSwitcherProps) => (
    <Column height="100%" width="100%">
        <Row height="100%" width="100%" data-testid="@welcome-layout/body" alignItems="normal">
            <Modal.Provider>
                {!hideSidebar ? <Sidebar showAccounts={showAccounts} /> : null}
                <MainContent>
                    <RightSideContent showPureChildren={showPureChildren}>
                        {children}
                    </RightSideContent>
                </MainContent>
                <GuideButton />
                <GuideRouter />
            </Modal.Provider>
        </Row>
    </Column>
);
