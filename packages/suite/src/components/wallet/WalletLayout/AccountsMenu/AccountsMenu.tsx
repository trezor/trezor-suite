import React from 'react';
import styled from 'styled-components';

import { spacingsPx, zIndices } from '@trezor/theme';
import { selectDevice } from '@suite-common/wallet-core';

import { useDiscovery, useSelector } from 'src/hooks/suite';
import { AccountSearchBox } from './AccountSearchBox';
import { AddAccountButton } from './AddAccountButton';
import { CoinsFilter } from './CoinsFilter';
import { AccountsList } from './AccountsList';
import { Translation } from 'src/components/suite';
import { AccountsMenuNotice } from './AccountsMenuNotice';
import { getFailedAccounts, sortByCoin } from '@suite-common/wallet-utils';
import { RefreshAfterDiscoveryNeeded } from './RefreshAfterDiscoveryNeeded';
import { useScrollShadow } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    z-index: ${zIndices.expandableNavigationHeader};
    width: 100%;
    overflow: auto;
`;

const MenuHeader = styled.div`
    display: flex;
    flex-direction: column;
    border-top: 1px solid ${({ theme }) => theme.borderElevation1};
    padding: ${spacingsPx.xs} ${spacingsPx.xs} 0 ${spacingsPx.xs};
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${spacingsPx.xs};
`;

const Scroll = styled.div`
    height: auto;
    overflow: hidden auto;
`;

export const AccountsMenu = () => {
    const device = useSelector(selectDevice);
    const accounts = useSelector(state => state.wallet.accounts);

    const { discovery } = useDiscovery();
    const { scrollElementRef, onScroll, ShadowTop, ShadowBottom, ShadowContainer } =
        useScrollShadow();

    if (!device || !discovery) {
        return (
            <Wrapper>
                <AccountsMenuNotice>
                    <Translation id="TR_ACCOUNT_NO_ACCOUNTS" />
                </AccountsMenuNotice>
            </Wrapper>
        );
    }

    const failed = getFailedAccounts(discovery);
    const list = sortByCoin(accounts.filter(a => a.deviceState === device.state).concat(failed));
    const isEmpty = list.length === 0;

    return (
        <Wrapper>
            <MenuHeader>
                <Row>
                    {!isEmpty && <AccountSearchBox />}
                    <AddAccountButton
                        isFullWidth={isEmpty}
                        data-test="@account-menu/add-account"
                        device={device}
                    />
                </Row>

                <CoinsFilter />
            </MenuHeader>

            <ShadowContainer>
                <ShadowTop backgroundColor="backgroundSurfaceElevationNegative" />
                <Scroll ref={scrollElementRef} onScroll={onScroll}>
                    <AccountsList />
                    <RefreshAfterDiscoveryNeeded />
                </Scroll>
                <ShadowBottom backgroundColor="backgroundSurfaceElevationNegative" />
            </ShadowContainer>
        </Wrapper>
    );
};
