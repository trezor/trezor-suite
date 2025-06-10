import { useCallback } from 'react';

import { Button, LoadingContent, Row, SkeletonRectangle } from '@trezor/components';

import { updateGraphData } from 'src/actions/wallet/graphActions';
import { GraphRangeSelector, Translation } from 'src/components/suite';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { useFastAccounts } from 'src/hooks/wallet';
import { GraphRange } from 'src/types/wallet/graph';

export type PortfolioCardHeaderProps = {
    fiatAmount: string;
    localCurrency: string;
    isWalletEmpty: boolean;
    isWalletLoading: boolean;
    isWalletError: boolean;
    isDiscoveryRunning?: boolean;
    isMissingFiatRate?: boolean;
    showGraphControls: boolean;
    receiveClickHandler: () => void;
};

export const PortfolioCardHeader = ({
    fiatAmount,
    localCurrency,
    isWalletEmpty,
    isWalletLoading,
    isWalletError,
    isDiscoveryRunning,
    isMissingFiatRate,
    showGraphControls,
    receiveClickHandler,
}: PortfolioCardHeaderProps) => {
    const accounts = useFastAccounts();

    const onSelectedRange = useCallback(
        (_range: GraphRange) => {
            updateGraphData(accounts, { newAccountsOnly: true });
        },
        [accounts],
    );

    let actions = null;
    if (!isWalletLoading && !isWalletError) {
        if (isWalletEmpty) {
            actions = (
                <Button
                    onClick={receiveClickHandler}
                    data-testid="@dashboard/receive-button"
                    minWidth={120}
                >
                    <Translation id="TR_RECEIVE" />
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

    const valueLoading = isDiscoveryRunning || isMissingFiatRate;

    return (
        <Row justifyContent="space-between">
            <LoadingContent size={24} isLoading={valueLoading}>
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
            </LoadingContent>
            {actions}
        </Row>
    );
};
