import React, { useState, useEffect } from 'react';
import { Progress } from '@trezor/components';
import styled from 'styled-components';
import { AccountsMenu } from '@wallet-components';
import Exception from '@wallet-components/AccountException';
import AccountMode from '@wallet-components/AccountMode';
import AccountAnnouncement from '@wallet-components/AccountAnnouncement';
import { AccountTopPanel } from '@wallet-components/AccountTopPanel';
import { MAX_WIDTH_WALLET_CONTENT } from '@suite-constants/layout';
import { AppState, ExtendedMessageDescriptor } from '@suite-types';
import { useTranslation, useLayout } from '@suite-hooks';
import { SkeletonRectangle } from '@suite-components/Skeleton';
import { CoinjoinBackendService } from '@suite/services/coinjoin/coinjoinBackend';

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

type ProgressInfo = {
    progress?: number;
    message?: string;
};

const AccountLoadingProgress = ({ account: { account } }: Pick<WalletLayoutProps, 'account'>) => {
    const [progress, setProgress] = useState<ProgressInfo>({});

    const { symbol: network, backendType, descriptor } = account || {};

    useEffect(() => {
        if (!network || backendType !== 'coinjoin') return;

        const backend = CoinjoinBackendService.getInstance(network);
        if (!backend) return;

        const onProgress = ({ info }: { info?: ProgressInfo }) => info && setProgress(info);
        backend.on(`progress/${descriptor}`, onProgress);
        return () => {
            backend.off(`progress/${descriptor}`, onProgress);
        };
    }, [network, backendType, descriptor]);

    const value = progress.progress ?? 0;

    return (
        <>
            <Progress max={1} value={value} />
            <p>
                {Math.floor(100 * value)} % {progress.message}
            </p>
        </>
    );
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

    if (account.status === 'loading') {
        return (
            <Wrapper>
                <SkeletonRectangle
                    width="100%"
                    height="300px"
                    animate={account.loader === 'account-loading'}
                >
                    {account.account?.backendType === 'coinjoin' && (
                        <AccountLoadingProgress account={account} />
                    )}
                </SkeletonRectangle>
            </Wrapper>
        );
    }

    if (account.status === 'exception') {
        return (
            <Wrapper>
                <AccountMode mode={account.mode} />
                <AccountAnnouncement selectedAccount={account} />
                <EmptyHeaderPlaceholder />
                <Exception account={account} />
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <AccountMode mode={account.mode} />
            <AccountAnnouncement selectedAccount={account} />
            {showEmptyHeaderPlaceholder && <EmptyHeaderPlaceholder />}
            {children}
        </Wrapper>
    );
};
