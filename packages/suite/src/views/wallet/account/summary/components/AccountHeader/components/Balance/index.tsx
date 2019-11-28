/* eslint-disable react/style-prop-object */
import React, { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { Icon, Tooltip, colors, variables } from '@trezor/components';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { FormattedNumber } from '@suite/components/suite';
import { Network, Fiat } from '@wallet-types';
import l10nMessages from './index.messages';

const { FONT_SIZE, FONT_WEIGHT } = variables;

interface Props {
    network: Network;
    balance: string;
    fiat: Fiat[];
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
    text-transform: uppercase;
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
    text-transform: uppercase;
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

const AccountBalance = (props: Props) => {
    const [isHidden, setIsHidden] = useState(props.isHidden);
    const [canAnimateHideBalanceIcon, setCanAnimateHideBalanceIcon] = useState(isHidden);

    useEffect(() => {
        setIsHidden(props.isHidden);
    }, [props.isHidden]);

    const handleHideBalanceIconClick = () => {
        setCanAnimateHideBalanceIcon(true);
        setIsHidden(!isHidden);
    };

    const { network, localCurrency } = props;
    const fiatRates = props.fiat.find(f => f.symbol === network.symbol);
    let fiatRateValue = NaN;
    let fiat = '';
    if (fiatRates) {
        fiatRateValue = fiatRates.rates[localCurrency];
        fiat = toFiatCurrency(props.balance, localCurrency, fiatRates);
    }

    const NoRatesTooltip = (
        <TooltipContainer>
            <Tooltip
                maxWidth={285}
                placement="top"
                content={<FormattedMessage {...l10nMessages.TR_FIAT_RATES_ARE_NOT_CURRENTLY} />}
            >
                <StyledIcon icon="HELP" color={colors.TEXT_SECONDARY} size={12} />
            </Tooltip>
        </TooltipContainer>
    );

    return (
        <Wrapper isHidden={isHidden}>
            <HideBalanceIconWrapper onClick={() => handleHideBalanceIconClick()}>
                <Icon
                    canAnimate={canAnimateHideBalanceIcon}
                    isActive={isHidden}
                    icon="ARROW_UP"
                    color={colors.TEXT_SECONDARY}
                    size={14}
                />
            </HideBalanceIconWrapper>
            {!isHidden && (
                <>
                    <BalanceWrapper>
                        <Label>
                            <FormattedMessage {...l10nMessages.TR_BALANCE} />
                        </Label>
                        <TooltipWrapper>
                            <FiatValue>
                                {fiatRates ? (
                                    <FormattedNumber currency={localCurrency} value={fiat} />
                                ) : (
                                    'N/A'
                                )}
                            </FiatValue>
                            {!fiatRates && NoRatesTooltip}
                        </TooltipWrapper>
                        <CoinBalance>
                            {props.balance} {network.symbol}
                        </CoinBalance>
                    </BalanceWrapper>
                    {props.xrpReserve && props.xrpReserve !== '0' && (
                        <BalanceWrapper>
                            <Label>
                                <FormattedMessage {...l10nMessages.TR_RESERVE} />
                            </Label>
                            <FiatValueRate>
                                {formatNetworkAmount(props.xrpReserve, 'xrp')} {network.symbol}
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
                                    />
                                ) : (
                                    'N/A'
                                )}
                            </FiatValueRate>
                            {!fiatRates && NoRatesTooltip}
                        </TooltipWrapper>
                        <CoinBalance>1 {network.symbol}</CoinBalance>
                    </BalanceRateWrapper>
                </>
            )}
        </Wrapper>
    );
};

export default AccountBalance;
