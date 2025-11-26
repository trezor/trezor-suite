import { useCallback } from 'react';

import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { Button, SkeletonRectangle } from '@trezor/components';

import { updateGraphData } from 'src/actions/wallet/graphActions';
import { GraphRangeSelector } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { useSelector } from 'src/hooks/suite';
import { Discovery } from 'src/types/wallet';
import { GraphRange } from 'src/types/wallet/graph';

import { ContentFlex, useIsContentBelowBreakpoint } from '../../../support/suite/ContentFlex';

export type PortfolioCardHeaderProps = {
    discovery?: Discovery;
    fiatAmount: string;
    localCurrency: string;
    isWalletEmpty: boolean;
    isWalletLoading: boolean;
    isWalletError: boolean;
    isDiscoveryRunning?: boolean;
    showGraphControls: boolean;
    passphraseEntryCanceled: boolean;
    hasMultipleAccounts: boolean;
    receiveClickHandler: () => void;
};

export const PortfolioCardHeader = ({
    discovery,
    fiatAmount,
    localCurrency,
    isWalletEmpty,
    isWalletLoading,
    isWalletError,
    isDiscoveryRunning,
    showGraphControls,
    passphraseEntryCanceled,
    hasMultipleAccounts,
    receiveClickHandler,
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
        if (isWalletEmpty) {
            actions = (
                <Button
                    onClick={receiveClickHandler}
                    data-testid="@dashboard/receive-button"
                    minWidth={120}
                    size={isContentBelowBreakpoint ? 'medium' : 'large'}
                >
                    <Translation
                        id={hasMultipleAccounts ? 'TR_RECEIVE_SELECT_ACCOUNT' : 'TR_RECEIVE'}
                    />
                </Button>
            );
        } else if (showGraphControls) {
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
            margin={{ top: 16, horizontal: 24, bottom: 8 }}
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
