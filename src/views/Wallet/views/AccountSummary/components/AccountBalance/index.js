/* @flow */
import React, { Component } from 'react';
import styled, { css } from 'styled-components';
import Icon from 'components/Icon';
import colors from 'config/colors';
import ICONS from 'config/icons';
import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';
import BigNumber from 'bignumber.js';


import type { Coin } from 'reducers/LocalStorageReducer';
import type { Props as BaseProps } from '../../Container';

type Props = {
    // coin: $PropertyType<$ElementType<BaseProps, 'selectedAccount'>, 'coin'>,
    coin: Coin,
    summary: $ElementType<BaseProps, 'summary'>,
    balance: string,
    network: string,
    fiat: $ElementType<BaseProps, 'fiat'>,
    onToggle: $ElementType<BaseProps, 'onDetailsToggle'>
}

const Wrapper = styled.div`
    padding: 0 48px 25px;
    position: relative;
    display: flex;

    border-bottom: 1px solid ${colors.DIVIDER};
`;

const HideBalanceIconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 40px;
    height: 40px;
    position: absolute;
    margin-left: -20px;
    left: 50%;
    bottom: -20px;

    cursor: pointer;
    background: ${colors.WHITE};
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.04);
    border-radius: 50%;
    transition: all 0.3s;
    &:hover {
        background: ${colors.DIVIDER};
    }
`;

const FiatValue = styled.div`
    font-size: ${FONT_SIZE.BASE};
    font-weight: ${FONT_WEIGHT.BASE};
    margin: 7px 0;
    color: ${colors.TEXT_PRIMARY};
`;

const CoinBalace = styled.div`
    font-size: ${FONT_SIZE.SMALLER};
    color: ${colors.TEXT_SECONDARY};
`;

const Label = styled.div`
    font-size: ${FONT_SIZE.SMALLER};
    color: ${colors.TEXT_SECONDARY};
`;

const BalanceWrapper = styled.div`
    margin-right: 48px;
`;

class AccountBalance extends Component<Props> {
    constructor(props) {
        super(props);
        this.state = {
            isHidden: false,
        };
    }

    shouldHide(hide) {
        this.setState({
            isHidden: hide,
        });
    }

    render() {
        const selectedCoin = props.coin;
        const fiatRate = props.fiat.find(f => f.network === selectedCoin.network);

        const accountBalance = new BigNumber(props.balance);
        const fiatRateValue = new BigNumber(fiatRate.value);
        const fiat = accountBalance.times(fiatRateValue).toFixed(2);

        return (

        );
    }
}


const AccountBalance = (props: Props): ?React$Element<string> => {
    if (!props.summary.details) {
        return (
            <Wrapper>
                <HideBalanceIconWrapper
                    onClick={props.onToggle}
                >
                    <Icon
                        canAnimate={props.summary.details}
                        isActive
                        icon={ICONS.ARROW_UP}
                        color={colors.TEXT_SECONDARY}
                        size={26}
                    />
                </HideBalanceIconWrapper>
            </Wrapper>
        );
    }

    const selectedCoin = props.coin;
    const fiatRate = props.fiat.find(f => f.network === selectedCoin.network);

    const accountBalance = new BigNumber(props.balance);
    const fiatRateValue = new BigNumber(fiatRate.value);
    const fiat = accountBalance.times(fiatRateValue).toFixed(2);

    return (
        <Wrapper>
            {props.summary.details && (
                <React.Fragment>
                    <HideBalanceIconWrapper
                        onClick={props.onToggle}
                    >
                        <Icon
                            icon={ICONS.ARROW_UP}
                            color={colors.TEXT_SECONDARY}
                            size={26}
                        />
                    </HideBalanceIconWrapper>

                    <BalanceWrapper>
                        <Label>Balance</Label>
                        {fiatRate && (
                            <FiatValue>${fiat}</FiatValue>
                        )}
                        <CoinBalace>{props.balance} {selectedCoin.symbol}</CoinBalace>
                    </BalanceWrapper>
                    {fiatRate && (
                        <BalanceWrapper>
                            <Label>Rate</Label>
                            <FiatValue>${fiatRateValue.toFixed(2)}</FiatValue>
                            <CoinBalace>1.00 {selectedCoin.symbol}</CoinBalace>
                        </BalanceWrapper>
                    )}
                </React.Fragment>
            )}

            {!props.summary.details && (
                <HideBalanceIconWrapper
                    isBalanceHidden
                    onClick={props.onToggle}
                >
                    <Icon
                        icon={ICONS.ARROW_UP}
                        color={colors.TEXT_SECONDARY}
                        size={26}
                    />
                </HideBalanceIconWrapper>
            )}
        </Wrapper>
    );
};

export default AccountBalance;