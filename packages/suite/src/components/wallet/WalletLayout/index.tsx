import React from 'react';
import styled from 'styled-components';
import { AccountsMenu, AccountException, AccountTopPanel } from '@wallet-components';
import { MAX_WIDTH_WALLET_CONTENT } from '@suite-constants/layout';
import { AppState, ExtendedMessageDescriptor } from '@suite-types';
import { useTranslation, useLayout } from '@suite-hooks';
import { SkeletonRectangle } from '@suite-components/Skeleton';
import { CoinjoinAccountDiscovery } from './components/CoinjoinAccountDiscovery';
import { AccountBanners } from './components/AccountBanners';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    max-width: ${MAX_WIDTH_WALLET_CONTENT};
    width: 100%;
    height: 100%;
    margin-top: 8px;
`;

// This placeholder makes the "Receive" and "Trade" tabs look aligned with other tabs in "Accounts" view,
// which implement some kind of toolbar.
// Height computation: 24px toolbarHeight + 20px marginBottom = 44px;
const EmptyHeaderPlaceholder = styled.div`
    width: 100%;
    height: 44px;
`;

type WalletLayoutProps = {
    title: ExtendedMessageDescriptor['id'];
    account: AppState['wallet']['selectedAccount'];
    showEmptyHeaderPlaceholder?: boolean;
    children?: React.ReactNode;
};

export const WalletLayout = ({
    showEmptyHeaderPlaceholder = false,
    title,
    children,
    account,
}: WalletLayoutProps) => {
    const { translationString } = useTranslation();
    const l10nTitle = translationString(title);

    useLayout(l10nTitle, AccountTopPanel, AccountsMenu);

    const { status, account: selectedAccount, loader, network } = account;

    if (status === 'loading') {
        if (selectedAccount?.accountType === 'coinjoin') {
            return (
                <Wrapper>
                    <AccountBanners account={selectedAccount} />
                    {showEmptyHeaderPlaceholder && <EmptyHeaderPlaceholder />}
                    <CoinjoinAccountDiscovery />
                </Wrapper>
            );
        }

        return (
            <Wrapper>
                {showEmptyHeaderPlaceholder && <EmptyHeaderPlaceholder />}
                <SkeletonRectangle
                    width="100%"
                    height="300px"
                    borderRadius="12px"
                    animate={loader === 'account-loading'}
                />
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <AccountBanners account={selectedAccount} />
            {showEmptyHeaderPlaceholder && <EmptyHeaderPlaceholder />}
            {status === 'exception' ? (
                <AccountException loader={loader} network={network} />
            ) : (
                children
            )}
        </Wrapper>
    );
};
