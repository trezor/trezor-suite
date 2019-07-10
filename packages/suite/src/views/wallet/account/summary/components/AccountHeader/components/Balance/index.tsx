/* eslint-disable react/style-prop-object */
import React, { PureComponent } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import styled from 'styled-components';
import { Icon, Tooltip, colors, icons as ICONS, variables } from '@trezor/components';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import { AppState } from '@suite-types/index';
import l10nMessages from './index.messages';

const { FONT_SIZE, FONT_WEIGHT } = variables;

interface Props {
    network: { shortcut: string; symbol: string };
    balance: string;
    fiat: AppState['wallet']['fiat'];
    localCurrency: string;
    isHidden: boolean;
    xrpReserve?: string;
}

interface State {
    isHidden: boolean;
    canAnimateHideBalanceIcon: boolean;
}

const Wrapper = styled.div<Pick<State, 'isHidden'>>`
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
    align-items: center;
    margin-top: -5px;
`;

const TooltipContainer = styled.div`
    margin-left: 6px;
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
        let fiatRateValue = NaN;
        let fiat = '';
        if (fiatRates) {
            fiatRateValue = fiatRates.rates[localCurrency];
            fiat = toFiatCurrency(this.props.balance, localCurrency, fiatRates);
        }

        const NoRatesTooltip = (
            <TooltipContainer>
                <Tooltip
                    maxWidth={285}
                    placement="top"
                    content={<FormattedMessage {...l10nMessages.TR_FIAT_RATES_ARE_NOT_CURRENTLY} />}
                >
                    <StyledIcon icon={ICONS.HELP} color={colors.TEXT_SECONDARY} size={12} />
                </Tooltip>
            </TooltipContainer>
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
                                            value={fiat}
                                            minimumFractionDigits={2}
                                            style="currency"
                                            currency={localCurrency}
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
                        {this.props.xrpReserve !== '0' && (
                            <BalanceWrapper>
                                <Label>
                                    <FormattedMessage {...l10nMessages.TR_RESERVE} />
                                </Label>
                                <FiatValueRate>
                                    {this.props.xrpReserve} {network.symbol}
                                </FiatValueRate>
                            </BalanceWrapper>
                        )}
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
                                            maximumFractionDigits={2}
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
