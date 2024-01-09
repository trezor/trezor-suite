import { useCallback } from 'react';
import styled, { css } from 'styled-components';

import { Button, LoadingContent } from '@trezor/components';

import { GraphRangeSelector, HiddenPlaceholder, Translation } from 'src/components/suite';
import { updateGraphData } from 'src/actions/wallet/graphActions';
import { useFastAccounts } from 'src/hooks/wallet';
import { GraphRange } from 'src/types/wallet/graph';
import { FiatHeader } from '../../FiatHeader';

const Wrapper = styled.div<{ hideBorder: boolean }>`
    display: flex;
    flex-flow: row wrap;
    padding: 20px;
    ${({ hideBorder }) =>
        !hideBorder &&
        css`
            border-bottom: solid 1px ${({ theme }) => theme.STROKE_GREY};
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

const ActionButton = styled(Button)`
    min-width: 150px;

    & + & {
        margin-left: 20px;
    }
`;

export interface HeaderProps {
    portfolioValue: string;
    localCurrency: string;
    isWalletEmpty: boolean;
    isWalletLoading: boolean;
    isWalletError: boolean;
    isDiscoveryRunning?: boolean;
    showGraphControls: boolean;
    hideBorder: boolean;
    receiveClickHandler: () => void;
    buyClickHandler: () => void;
}

export const Header = ({
    portfolioValue,
    localCurrency,
    isWalletEmpty,
    isWalletLoading,
    isWalletError,
    isDiscoveryRunning,
    showGraphControls,
    hideBorder,
    receiveClickHandler,
    buyClickHandler,
}: HeaderProps) => {
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
                    <ActionButton
                        variant="secondary"
                        onClick={receiveClickHandler}
                        data-test="@dashboard/receive-button"
                    >
                        <Translation id="TR_RECEIVE" />
                    </ActionButton>
                    <ActionButton
                        variant="primary"
                        onClick={buyClickHandler}
                        data-test="@dashboard/buy-button"
                    >
                        <Translation id="TR_BUY" />
                    </ActionButton>
                </>
            );
        } else if (showGraphControls) {
            actions = <GraphRangeSelector onSelectedRange={onSelectedRange} align="bottom-right" />;
        }
    }

    return (
        <Wrapper hideBorder={hideBorder}>
            <Left>
                <LoadingContent isLoading={isDiscoveryRunning}>
                    <HiddenPlaceholder intensity={7}>
                        <FiatHeader
                            size="large"
                            portfolioValue={portfolioValue}
                            localCurrency={localCurrency}
                        />
                    </HiddenPlaceholder>
                </LoadingContent>
            </Left>
            <Right>{actions}</Right>
        </Wrapper>
    );
};
