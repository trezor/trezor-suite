import { type ReactNode, useMemo } from 'react';

import {
    selectAllAccountsToList,
    selectDiscoveryForSelectedDevice,
} from '@suite-common/wallet-core';
import { isAccountFailed } from '@suite-common/wallet-utils';
import { Card, Column } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite';
import { type DiscoveryStatusType } from 'src/types/wallet';

import { type HomeAssetEmptyStateKind } from './homeAssetEmptyStateKind';
import { EmptyWallet } from '../dashboard/PortfolioCard/EmptyWallet';
import { EmptyWalletSkeleton } from '../dashboard/PortfolioCard/EmptyWalletSkeleton';
import { PortfolioCardException } from '../dashboard/PortfolioCard/PortfolioCardException';

const EMPTY_STATE_MIN_HEIGHT = 329;

type DiscoveryException = Extract<DiscoveryStatusType, { status: 'exception' }>;

type HomeAssetEmptyStateProps = {
    kind: HomeAssetEmptyStateKind;
};

export const HomeAssetEmptyState = ({ kind }: HomeAssetEmptyStateProps) => {
    const discovery = useSelector(selectDiscoveryForSelectedDevice);
    const accounts = useSelector(selectAllAccountsToList);
    const failedAccounts = useMemo(() => accounts.filter(isAccountFailed), [accounts]);

    const renderException = (type: DiscoveryException['type']) => (
        <PortfolioCardException
            exception={{ status: 'exception', type }}
            discovery={discovery}
            failed={failedAccounts}
        />
    );

    const getContent = (): ReactNode => {
        switch (kind) {
            case 'noNetworkEnabled':
                return renderException('discovery-empty');
            case 'discoveryFailed':
            case 'passphraseCancelled':
                return renderException('discovery-failed');
            case 'deviceUnavailable':
                return renderException('device-unavailable');
            case 'loading':
                return <EmptyWalletSkeleton />;
            case 'emptyWallet':
                return <EmptyWallet />;
            default:
                return exhaustive(kind);
        }
    };

    return (
        <Card paddingType="none" data-testid="@dashboard/home-asset/empty-state">
            <Column justifyContent="center" minHeight={EMPTY_STATE_MIN_HEIGHT} padding={24}>
                {getContent()}
            </Column>
        </Card>
    );
};
