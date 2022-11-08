import React from 'react';
import styled from 'styled-components';
import {
    AccountsMenu,
    AccountMode,
    AccountException,
    AccountAnnouncement,
    AccountTopPanel,
} from '@wallet-components';
import { MAX_WIDTH_WALLET_CONTENT } from '@suite-constants/layout';
import { AppState, ExtendedMessageDescriptor } from '@suite-types';
import { useTranslation, useLayout } from '@suite-hooks';
import { SkeletonRectangle } from '@suite-components/Skeleton';
import { CoinjoinAccountDiscoveryProgress } from './components/CoinjoinAccountDiscoveryProgress';

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

    const { status, account: selectedAccount, loader, mode, network } = account;

    if (status === 'loading') {
        if (selectedAccount?.backendType === 'coinjoin') {
            return (
                <Wrapper>
                    <CoinjoinAccountDiscoveryProgress />
                </Wrapper>
            );
        }

        return (
            <Wrapper>
                <SkeletonRectangle
                    width="100%"
                    height="300px"
                    borderRadius="12px"
                    animate={loader === 'account-loading'}
                />
            </Wrapper>
        );
    }

    if (status === 'exception') {
        return (
            <Wrapper>
                <AccountMode mode={mode} />
                <AccountAnnouncement account={selectedAccount} />
                <EmptyHeaderPlaceholder />
                <AccountException loader={loader} network={network} />
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <AccountMode mode={mode} />
            <AccountAnnouncement account={selectedAccount} />
            {showEmptyHeaderPlaceholder && <EmptyHeaderPlaceholder />}
            {children}
        </Wrapper>
    );
};
