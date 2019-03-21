/* @flow */
import React, { PureComponent } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Icon, Tooltip, colors, icons as ICONS } from 'trezor-ui-components';

import { toFiatCurrency } from 'utils/fiatConverter';
import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';
import type { Network, State as ReducersState } from 'flowtype';
import l10nMessages from './index.messages';

type Props = {
    network: Network,
    balance: string,
    fiat: $ElementType<ReducersState, 'fiat'>,
    localCurrency: string,
    isHidden: boolean,
};

type State = {
    isHidden: boolean,
    canAnimateHideBalanceIcon: boolean,
};

const Wrapper = styled.div`
    padding-bottom: ${props => (props.isHidden ? '0px' : '28px')};
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
    font-weight: ${FONT_WEIGHT.SEMIBOLD};
    font-size: ${FONT_SIZE.BIGGER};
    margin: 7px 0;
    min-height: 25px;
    color: ${colors.TEXT_PRIMARY};
    align-items: center;
`;

const FiatValueRate = styled.div`
    font-weight: ${FONT_WEIGHT.SEMIBOLD};
    font-size: ${FONT_SIZE.BIG};
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

const CoinBalance = styled.div`
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
`;

const Label = styled.div`
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
    margin-top: -5px;
`;

const TooltipWrapper = styled.div`
    display: flex;
    align-items: center;
`;

class AccountBalance extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            isHidden: props.isHidden,
            canAnimateHideBalanceIcon: props.isHidden,
        };
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.isHidden !== this.props.isHidden) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                isHidden: this.props.isHidden,
            });
        }
    }

    handleHideBalanceIconClick() {
        this.setState(previousState => ({
            isHidden: !previousState.isHidden,
            canAnimateHideBalanceIcon: true,
        }));
    }

    render() {
        const { network, localCurrency } = this.props;
        const fiatRates = this.props.fiat.find(f => f.network === network.shortcut);
        let fiatRateValue = '';
        let fiat = '';
        if (fiatRates) {
            fiatRateValue = new BigNumber(fiatRates.rates[localCurrency]).toFixed(2);
            fiat = toFiatCurrency(this.props.balance, localCurrency, fiatRates);
        }

        const NoRatesTooltip = (
            <Tooltip
                maxWidth={285}
                placement="top"
                content="Fiat rates are not currently available."
            >
                <StyledIcon icon={ICONS.HELP} color={colors.TEXT_SECONDARY} size={26} />
            </Tooltip>
        );

        return (
            <Wrapper isHidden={this.state.isHidden}>
                <HideBalanceIconWrapper onClick={() => this.handleHideBalanceIconClick()}>
                    <Icon
                        canAnimate={this.state.canAnimateHideBalanceIcon}
                        isActive={this.state.isHidden}
                        icon={ICONS.ARROW_UP}
                        color={colors.TEXT_SECONDARY}
                        size={14}
                    />
                </HideBalanceIconWrapper>
                {!this.state.isHidden && (
                    <React.Fragment>
                        <BalanceWrapper>
                            <Label>
                                <FormattedMessage {...l10nMessages.TR_BALANCE} />
                            </Label>
                            <TooltipWrapper>
                                <FiatValue>
                                    {fiatRates ? (
                                        <FormattedNumber
                                            currency={localCurrency}
                                            value={fiat}
                                            minimumFractionDigits={2}
                                            // eslint-disable-next-line react/style-prop-object
                                            style="currency"
                                        />
                                    ) : (
                                        'N/A'
                                    )}
                                </FiatValue>
                                {!fiatRates && NoRatesTooltip}
                            </TooltipWrapper>
                            <CoinBalance>
                                {this.props.balance} {network.symbol}
                            </CoinBalance>
                        </BalanceWrapper>
                        <BalanceRateWrapper>
                            <Label>
                                <FormattedMessage {...l10nMessages.TR_RATE} />
                            </Label>
                            <TooltipWrapper>
                                <FiatValueRate>
                                    {fiatRates ? (
                                        <FormattedNumber
                                            currency={localCurrency}
                                            value={fiatRateValue}
                                            minimumFractionDigits={2}
                                            // eslint-disable-next-line react/style-prop-object
                                            style="currency"
                                        />
                                    ) : (
                                        'N/A'
                                    )}
                                </FiatValueRate>
                                {!fiatRates && NoRatesTooltip}
                            </TooltipWrapper>
                            <CoinBalance>1 {network.symbol}</CoinBalance>
                        </BalanceRateWrapper>
                    </React.Fragment>
                )}
            </Wrapper>
        );
    }
}

export default AccountBalance;
