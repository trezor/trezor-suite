/* @flow */
import React, { Component } from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import Icon from 'components/Icon';
import colors from 'config/colors';
import ICONS from 'config/icons';
import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';

import type { Coin } from 'reducers/LocalStorageReducer';
import type { Props as BaseProps } from '../../Container';

type Props = {
    coin: Coin,
    balance: string,
    fiat: $ElementType<BaseProps, 'fiat'>,
}

type State = {
    isHidden: boolean,
    canAnimateHideBalanceIcon: boolean,
};

const Wrapper = styled.div`
    padding: 10px 0 25px 0;
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
    font-weight: ${FONT_WEIGHT.BIGGER};
    font-size: ${FONT_SIZE.BIG};
    margin: 7px 0;
    min-height: 25px;
    color: ${colors.TEXT_PRIMARY};
`;

const FiatValueRate = styled.div`
    font-weight: ${FONT_WEIGHT.BIGGER};
    font-size: ${FONT_SIZE.BASE};
    min-height: 25px;
    margin: 7px 0;
    display: flex;
    align-items: center;
    color: ${colors.TEXT_PRIMARY};
`;

const BalanceWrapper = styled.div`
    margin-right: 48px;
`;

const BalanceRateWrapper = styled(BalanceWrapper)`
    padding-left: 50px;
`;

const CoinBalace = styled.div`
    font-size: ${FONT_SIZE.SMALLER};
    color: ${colors.TEXT_SECONDARY};
`;

const Label = styled.div`
    font-size: ${FONT_SIZE.SMALLER};
    color: ${colors.TEXT_SECONDARY};
`;


class AccountBalance extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            isHidden: false,
            canAnimateHideBalanceIcon: false,
        };
    }

    handleHideBallanceIconClick() {
        this.setState(previousState => ({
            isHidden: !previousState.isHidden,
            canAnimateHideBalanceIcon: true,
        }));
    }

    render() {
        const selectedCoin = this.props.coin;
        const fiatRate: any = this.props.fiat.find(f => f.network === selectedCoin.network);

        let accountBalance = '';
        let fiatRateValue = '';
        let fiat = '';
        if (fiatRate) {
            accountBalance = new BigNumber(this.props.balance);
            fiatRateValue = new BigNumber(fiatRate.value).toFixed(2);
            fiat = accountBalance.times(fiatRateValue).toFixed(2);
        }


        return (
            <Wrapper>
                <HideBalanceIconWrapper
                    onClick={() => this.handleHideBallanceIconClick()}
                >
                    <Icon
                        canAnimate={this.state.canAnimateHideBalanceIcon}
                        isActive={this.state.isHidden}
                        icon={ICONS.ARROW_UP}
                        color={colors.TEXT_SECONDARY}
                        size={26}
                    />
                </HideBalanceIconWrapper>
                {!this.state.isHidden && (
                    <React.Fragment>
                        <BalanceWrapper>
                            <Label>Balance</Label>
                            {fiatRate && (
                                <FiatValue>${fiat}</FiatValue>
                            )}
                            <CoinBalace>{this.props.balance} {selectedCoin.symbol}</CoinBalace>
                        </BalanceWrapper>
                        {fiatRate && (
                            <BalanceRateWrapper>
                                <Label>Rate</Label>
                                <FiatValueRate>${fiatRateValue}</FiatValueRate>
                                <CoinBalace>1.00 {selectedCoin.symbol}</CoinBalace>
                            </BalanceRateWrapper>
                        )}
                    </React.Fragment>
                )}
            </Wrapper>
        );
    }
}

export default AccountBalance;
