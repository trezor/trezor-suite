import React from 'react';
import styled from 'styled-components';
import { colors, variables, Box, Icon } from '@trezor/components';
import { FiatValue, Translation } from '@suite-components';
import { formatNetworkAmount, formatAmount } from '@wallet-utils/accountUtils';
import { Network } from '@wallet-types';
import { TokenInfo } from 'trezor-connect';

const StyledRow = styled(Box)`
    justify-content: space-between;
    margin-bottom: 20px;
    &:last-child {
        margin-bottom: 0px;
    }
`;

const Left = styled.div`
    display: flex;
    align-items: center;
`;

const IconWrapper = styled.div`
    width: 25px;
    height: 25px;
    display: flex;
    padding-right: 6px;
    justify-content: center;
    align-items: center;
`;

const Dot = styled.div`
    width: 10px;
    height: 10px;
    border-radius: 100%;
    background: ${colors.NEUE_TYPE_ORANGE};
`;

const Address = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const Right = styled.div`
    display: flex;
    align-items: center;
`;

const Coin = styled.div<{ bold?: boolean }>`
    display: flex;
    font-weight: ${props =>
        props.bold ? variables.FONT_WEIGHT.DEMI_BOLD : variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    align-items: center;
`;

const Symbol = styled.div`
    text-transform: uppercase;
    padding-left: 4px;
`;

const Fiat = styled.div`
    display: flex;
    align-items: center;
    padding-top: 5px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

export type OutputProps =
    | {
          type: 'regular';
          label: string;
          value: string;
          token?: TokenInfo;
      }
    | {
          type: 'opreturn' | 'data' | 'locktime' | 'fee' | 'destination-tag';
          label?: undefined;
          value: string;
          token?: undefined;
      };

export type Props = OutputProps & {
    state: any;
    symbol: Network['symbol'];
};

export { Left, Right, Coin, Symbol, Fiat };

export default ({ type, state, label, value, symbol, token }: Props) => {
    let outputLabel: React.ReactNode = label;
    if (type === 'opreturn') {
        outputLabel = <Translation id="TR_OP_RETURN" />;
    }
    if (type === 'data') {
        outputLabel = <Translation id="TR_ETH_ADD_DATA" />;
    }
    if (type === 'locktime') {
        outputLabel = <Translation id="TR_SCHEDULE_SEND" />; // TODO: blocks or date
    }
    if (type === 'fee') {
        outputLabel = <Translation id="TR_FEE" />;
    }
    if (type === 'destination-tag') {
        outputLabel = <Translation id="TR_XRP_DESTINATION_TAG" />;
    }

    let outputValue = value;
    let outputSymbol;
    if (token) {
        outputValue = formatAmount(value, token.decimals);
        outputSymbol = token.symbol;
    } else if (type === 'regular' || type === 'fee') {
        outputValue = formatNetworkAmount(value, symbol);
        outputSymbol = symbol;
    }

    return (
        <StyledRow>
            <Left>
                <IconWrapper>
                    {state === 'success' && <Icon color={colors.NEUE_BG_GREEN} icon="CHECK" />}
                    {state === 'warning' && <Dot />}
                </IconWrapper>
                <Address>{outputLabel}</Address>
            </Left>
            <Right>
                <Coin>
                    {outputValue}
                    {outputSymbol && <Symbol>{outputSymbol}</Symbol>}
                </Coin>
                <Fiat>
                    {outputSymbol && !token && (
                        <FiatValue
                            amount={formatNetworkAmount(outputValue, symbol)}
                            symbol={symbol}
                        />
                    )}
                </Fiat>
            </Right>
        </StyledRow>
    );
};
