import React, { useCallback } from 'react';
import styled, { css } from 'styled-components';
import { variables, Button } from '@trezor/components';
import { Translation, FormattedNumber, HiddenPlaceholder } from '@suite-components';
import RangeSelector from '@suite-components/TransactionsGraph/components/RangeSelector';
import { updateGraphData } from '@wallet-actions/graphActions';
import { useFastAccounts } from '@wallet-hooks';
import { GraphRange } from '@wallet-types/graph';

const Wrapper = styled.div<{ hideBorder: boolean }>`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    padding: 20px;
    ${props =>
        !props.hideBorder &&
        css`
            border-bottom: solid 1px ${props => props.theme.STROKE_GREY};
        `}
`;

const ValueWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.H2};
    /* font-weight: ${variables.FONT_WEIGHT.LIGHT}; */
    color: ${props => props.theme.TYPE_DARK_GREY};
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

export interface Props {
    portfolioValue: string;
    localCurrency: string;
    isWalletEmpty: boolean;
    isWalletLoading: boolean;
    isWalletError: boolean;
    showGraphControls: boolean;
    hideBorder: boolean;
    // buyClickHandler: () => void;
    receiveClickHandler: () => void;
}

const Header = (props: Props) => {
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
                <ActionButton variant="primary" onClick={props.receiveClickHandler}>
                    <Translation id="TR_RECEIVE" />
                </ActionButton>
            );
        } else if (props.showGraphControls) {
            actions = <RangeSelector onSelectedRange={onSelectedRange} align="right" />;
        }
    }

    return (
        <Wrapper hideBorder={props.hideBorder}>
            <Left>
                <ValueWrapper>
                    <HiddenPlaceholder intensity={7}>
                        <span>
                            <FormattedNumber
                                value={props.portfolioValue}
                                currency={props.localCurrency}
                            />
                        </span>
                    </HiddenPlaceholder>
                </ValueWrapper>
            </Left>
            <Right>{actions}</Right>
        </Wrapper>
    );
};

export default Header;
