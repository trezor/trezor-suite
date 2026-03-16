import { useCallback } from 'react';

import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { SkeletonRectangle } from '@trezor/components';

import { updateGraphData } from 'src/actions/wallet/graphActions';
import { GraphRangeSelector } from 'src/components/suite';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { useSelector } from 'src/hooks/suite';
import { type Discovery } from 'src/types/wallet';
import { type GraphRange } from 'src/types/wallet/graph';

import { ContentFlex, useIsContentBelowBreakpoint } from '../../../support/suite/ContentFlex';

export type PortfolioCardHeaderProps = {
    discovery?: Discovery;
    fiatAmount: string;
    localCurrency: string;
    isWalletLoading: boolean;
    isWalletError: boolean;
    isDiscoveryRunning?: boolean;
    showGraphControls: boolean;
    passphraseEntryCanceled: boolean;
};

export const PortfolioCardHeader = ({
    discovery,
    fiatAmount,
    localCurrency,
    isWalletLoading,
    isWalletError,
    isDiscoveryRunning,
    showGraphControls,
    passphraseEntryCanceled,
}: PortfolioCardHeaderProps) => {
    const accounts = useSelector(selectAllAccountsToList);
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint();

    const onSelectedRange = useCallback(
        (_range: GraphRange) => {
            updateGraphData({ accounts });
        },
        [accounts],
    );

    let actions = null;
    if (!isWalletLoading && !isWalletError && !passphraseEntryCanceled) {
        if (showGraphControls) {
            actions = (
                <GraphRangeSelector
                    onSelectedRange={onSelectedRange}
                    placement={{ position: 'bottom', alignment: 'start' }}
                />
            );
        }
    }

    const valueLoading = isDiscoveryRunning || (!discovery && isNaN(Number(fiatAmount)));

    return (
        <ContentFlex
            justifyContent="space-between"
            alignItems={isContentBelowBreakpoint ? 'flex-start' : 'center'}
            gap={8}
            margin={{ top: 16, horizontal: 24, bottom: 16 }}
        >
            {valueLoading ? (
                <SkeletonRectangle width={140} height={53} />
            ) : (
                <FiatHeader
                    data-testid="@dashboard/portfolio/fiat-amount"
                    size="large"
                    amount={fiatAmount}
                    localCurrency={localCurrency}
                />
            )}
            {actions}
        </ContentFlex>
    );
};
