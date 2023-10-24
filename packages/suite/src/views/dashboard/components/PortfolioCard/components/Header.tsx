import { useCallback } from 'react';
import styled, { css } from 'styled-components';

import { useFormatters } from '@suite-common/formatters';
import { H2, Button, LoadingContent } from '@trezor/components';

import { GraphRangeSelector, HiddenPlaceholder, Translation } from 'src/components/suite';
import { updateGraphData } from 'src/actions/wallet/graphActions';
import { useFastAccounts } from 'src/hooks/wallet';
import { GraphRange } from 'src/types/wallet/graph';

const Wrapper = styled.div<{ hideBorder: boolean }>`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    padding: 20px;
    ${props =>
        !props.hideBorder &&
        css`
            border-bottom: solid 1px ${({ theme }) => theme.STROKE_GREY};
        `}
`;

const ValueWrapper = styled(H2)`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-variant-numeric: tabular-nums;
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

export const Header = (props: HeaderProps) => {
    const { FiatAmountFormatter } = useFormatters();
    const accounts = useFastAccounts();

    const onSelectedRange = useCallback(
        (_range: GraphRange) => {
            updateGraphData(accounts, { newAccountsOnly: true });
        },
        [accounts],
    );

    let actions = null;
    if (!props.isWalletLoading && !props.isWalletError) {
        if (props.isWalletEmpty) {
            actions = (
                <>
                    <ActionButton
                        variant="secondary"
                        onClick={props.receiveClickHandler}
                        data-test="@dashboard/receive-button"
                    >
                        <Translation id="TR_RECEIVE" />
                    </ActionButton>
                    <ActionButton
                        variant="primary"
                        onClick={props.buyClickHandler}
                        data-test="@dashboard/buy-button"
                    >
                        <Translation id="TR_BUY" />
                    </ActionButton>
                </>
            );
        } else if (props.showGraphControls) {
            actions = <GraphRangeSelector onSelectedRange={onSelectedRange} align="right" />;
        }
    }

    return (
        <Wrapper hideBorder={props.hideBorder}>
            <Left>
                <LoadingContent isLoading={props.isDiscoveryRunning}>
                    <ValueWrapper>
                        <HiddenPlaceholder intensity={7}>
                            <span>
                                <FiatAmountFormatter
                                    value={props.portfolioValue}
                                    currency={props.localCurrency}
                                />
                            </span>
                        </HiddenPlaceholder>
                    </ValueWrapper>
                </LoadingContent>
            </Left>
            <Right>{actions}</Right>
        </Wrapper>
    );
};
