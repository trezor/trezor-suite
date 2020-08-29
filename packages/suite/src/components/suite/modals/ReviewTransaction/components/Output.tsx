import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, variables, Box, Icon, Button } from '@trezor/components';
import { FiatValue, Translation } from '@suite-components';
import { formatNetworkAmount, formatAmount } from '@wallet-utils/accountUtils';
import { Network } from '@wallet-types';
import { TokenInfo } from 'trezor-connect';
import { ANIMATION } from '@suite-config';

const ROW_PADDING = '16px 14px';

const StyledRow = styled(Box)`
    flex-flow: row wrap;
    justify-content: space-between;
    padding: 0; /* padding needs to be set in child elements Left/Right/ExpandWrapper (because of expand border) */
    margin-bottom: 20px;
    &:last-child {
        margin-bottom: 0px;
    }
`;

const ExpandWrapper = styled(motion.div)`
    padding: ${ROW_PADDING};
    overflow: hidden;
    width: 100%;
    border-top: solid 1px ${colors.NEUE_STROKE_GREY};
`;

const ExpandButton = styled(Button)`
    justify-content: start;
    align-self: flex-start;
    background: transparent;
`;

const Pre = styled.pre`
    text-align: left;
    word-break: break-all;
    white-space: pre-wrap;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const Left = styled.div`
    padding: ${ROW_PADDING};
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
    padding: ${ROW_PADDING};
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
    padding-left: 8px;
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
    const [isExpanded, setExpanded] = useState(false);
    let outputLabel: React.ReactNode = label;

    if (type === 'opreturn') {
        outputLabel = <Translation id="OP_RETURN" />;
    }
    if (type === 'data') {
        outputLabel = <Translation id="DATA_ETH" />;
    }
    if (type === 'locktime') {
        outputLabel = <Translation id="LOCKTIME" />; // TODO: blocks or date
    }
    if (type === 'fee') {
        outputLabel = <Translation id="FEE" />;
    }
    if (type === 'destination-tag') {
        outputLabel = <Translation id="DESTINATION_TAG" />;
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

    const hasExpansion = (type === 'opreturn' || type === 'data') && outputValue.length >= 10;

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
                    {hasExpansion ? `${outputValue.substring(0, 10)}...` : outputValue}
                    {outputSymbol && <Symbol>{outputSymbol}</Symbol>}
                    {hasExpansion && (
                        <ExpandButton
                            variant="tertiary"
                            icon={!isExpanded ? 'ARROW_DOWN' : 'ARROW_UP'}
                            alignIcon="right"
                            onClick={() => setExpanded(!isExpanded)}
                        />
                    )}
                </Coin>
                <Fiat>
                    {/* TODO: Fiat value for tokes */}
                    {outputSymbol && !token && <FiatValue amount={outputValue} symbol={symbol} />}
                </Fiat>
            </Right>
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <ExpandWrapper {...ANIMATION.EXPAND}>
                        <Pre>{outputValue}</Pre>
                    </ExpandWrapper>
                )}
            </AnimatePresence>
        </StyledRow>
    );
};
