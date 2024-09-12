import { useCallback } from 'react';
import styled, { css } from 'styled-components';

import { Button, LoadingContent } from '@trezor/components';

import { GraphRangeSelector, Translation } from 'src/components/suite';
import { updateGraphData } from 'src/actions/wallet/graphActions';
import { useFastAccounts } from 'src/hooks/wallet';
import { GraphRange } from 'src/types/wallet/graph';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { spacingsPx } from '@trezor/theme';

const Wrapper = styled.div<{ $hideBorder: boolean }>`
    display: flex;
    flex-flow: row wrap;
    padding: ${spacingsPx.lg};
    ${({ $hideBorder }) =>
        !$hideBorder &&
        css`
            border-bottom: solid 1px ${({ theme }) => theme.legacy.STROKE_GREY};
        `}
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
`;

const Right = styled.div`
    display: flex;
    align-items: center;
`;

const Buttons = styled.div`
    display: flex;
    gap: ${spacingsPx.md};
    flex-flow: row wrap;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const WalletEmptyButton = styled(Button)`
    min-width: 120px;
`;

export type PortfolioCardHeaderProps = {
    fiatAmount: string;
    localCurrency: string;
    isWalletEmpty: boolean;
    isWalletLoading: boolean;
    isWalletError: boolean;
    isDiscoveryRunning?: boolean;
    isMissingFiatRate?: boolean;
    showGraphControls: boolean;
    hideBorder: boolean;
    receiveClickHandler: () => void;
    buyClickHandler: () => void;
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
    hideBorder,
    receiveClickHandler,
    buyClickHandler,
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
                <>
                    <Buttons>
                        <WalletEmptyButton
                            onClick={receiveClickHandler}
                            data-testid="@dashboard/receive-button"
                        >
                            <Translation id="TR_RECEIVE" />
                        </WalletEmptyButton>
                        <WalletEmptyButton
                            onClick={buyClickHandler}
                            data-testid="@dashboard/buy-button"
                            variant="tertiary"
                        >
                            <Translation id="TR_BUY" />
                        </WalletEmptyButton>
                    </Buttons>
                </>
            );
        } else if (showGraphControls) {
            actions = <GraphRangeSelector onSelectedRange={onSelectedRange} align="bottom-right" />;
        }
    }

    return (
        <Wrapper $hideBorder={hideBorder}>
            <Left>
                <LoadingContent size={24} isLoading={isDiscoveryRunning || isMissingFiatRate}>
                    <FiatHeader
                        size="large"
                        fiatAmount={fiatAmount}
                        localCurrency={localCurrency}
                    />
                </LoadingContent>
            </Left>
            <Right>{actions}</Right>
        </Wrapper>
    );
};
