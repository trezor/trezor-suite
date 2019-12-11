import React from 'react';
import styled, { css } from 'styled-components';
import { SuiteLayout } from '@suite-components';
import MenuSecondary from '@suite/components/suite/MenuSecondary';

import { variables } from '@trezor/components';
// import { AppState } from '@suite-types';
import { Menu } from '@suite-components/SettingsLayout/components';

const { SCREEN_SIZE } = variables;

// should not we have AppLayout component????

interface Props {
    title: string;
    children?: React.ReactNode;
}

// TODO: duplicity with WalletLayout start

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex: 1;
    flex-direction: row;
`;

const ContentWrapper = styled.div<{ preventBgScroll?: boolean }>`
    display: flex;
    flex-direction: column;
    flex: 1 1 0%;
    overflow: auto;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        ${props =>
            props.preventBgScroll &&
            css`
                position: fixed;
                width: 100%;
                min-height: calc(100vh - 52px);
            `}
    }
`;

// TODO: duplicity with WalletLayout end

const SettingsLayout = (props: Props) => {
    const showSidebar = true;
    return (
        <SuiteLayout showSuiteHeader title={props.title}>
            <Wrapper>
                <MenuSecondary isOpen={showSidebar}>
                    <Menu />
                </MenuSecondary>
                <ContentWrapper preventBgScroll={showSidebar}>
                    {/* <WalletNotifications /> */}
                    {/* settings notifications? not sure */}
                    {props.children}
                </ContentWrapper>
            </Wrapper>
        </SuiteLayout>
    );
};

export default SettingsLayout;
