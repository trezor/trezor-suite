import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import BigNumber from 'bignumber.js';
import { colors, variables, Icon } from '@trezor/components';
import { FiatValue, Translation } from '@suite-components';
import { formatNetworkAmount, formatAmount } from '@wallet-utils/accountUtils';
import { BTC_LOCKTIME_VALUE } from '@wallet-constants/sendForm';
import { Network } from '@wallet-types';
import { TokenInfo } from 'trezor-connect';
import { ANIMATION } from '@suite-config';

const ROW_PADDING = '16px 14px';

const StyledBox = styled.div<{ state?: 'success' }>`
    display: flex;
    flex-direction: column;
    flex: 1;
    border-radius: 6px;
    border: solid 1px ${colors.NEUE_STROKE_GREY};
    margin-bottom: 20px;

    ${props =>
        props.state &&
        css`
            border-left: 6px solid ${colors.NEUE_BG_GREEN};
        `}

    ${props =>
        !props.state &&
        css`
            padding-left: 5px;
        `}

    &:last-child {
        margin-bottom: 0px;
    }
`;

const ExpandWrapper = styled(motion.div)`
    padding: ${ROW_PADDING};
    overflow: hidden;
    width: 100%;
    border-top: solid 1px ${colors.NEUE_STROKE_GREY};
    padding-left: 40px; /* Left container padding + size of the icon + icon padding-right */
`;

const Pre = styled.pre`
    text-align: left;
    word-break: break-all;
    white-space: pre-wrap;
    font-size: ${variables.FONT_SIZE.TINY};

    font-variant-numeric: slashed-zero tabular-nums;
`;

const Left = styled.div`
    padding: ${ROW_PADDING};
    display: flex;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
`;

const IconWrapper = styled.div`
    width: 25px;
    height: 25px;
    display: flex;
    padding-right: 6px;
    justify-content: center;
    align-items: center;
`;

const Dot = styled.div<{ color: string }>`
    width: 10px;
    height: 10px;
    border-radius: 100%;
    background: ${props => props.color};
`;

const Address = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-variant-numeric: slashed-zero tabular-nums;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Right = styled.div`
    padding: ${ROW_PADDING};
    display: flex;
    align-items: center;
    flex: 0 0 auto;
`;

const Amounts = styled.div`
    display: flex;
    flex-direction: column;
    font-variant-numeric: tabular-nums;
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
    text-align: right;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    margin-top: 4px;
`;

const Row = styled.div<{ responsive?: boolean }>`
    display: flex;
    flex: 1;
    justify-content: space-between;
    overflow: hidden;

    ${props =>
        props.responsive &&
        css`
            @media all and (max-width: ${variables.SCREEN_SIZE.MD}) {
                flex-direction: column;

                ${Right} {
                    padding-top: 0px;
                }
                ${Amounts} {
                    margin-left: 26px;
                    flex: 1;
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-between;
                }

                ${Fiat} {
                    margin-left: 12px;
                    margin-top: 0px;
                }
            }
        `}
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

export { Left, Right, Coin, Symbol, Fiat, Amounts };

const Output = ({ type, state, label, value, symbol, token }: Props) => {
    const [isExpanded, setExpanded] = useState(false);
    let outputLabel: React.ReactNode = label;

    if (type === 'opreturn') {
        outputLabel = <Translation id="OP_RETURN" />;
    }
    if (type === 'data') {
        outputLabel = <Translation id="DATA_ETH" />;
    }
    if (type === 'locktime') {
        const isTimestamp = new BigNumber(value).gte(BTC_LOCKTIME_VALUE);
        outputLabel = (
            <Translation id={isTimestamp ? 'LOCKTIME_TIMESTAMP' : 'LOCKTIME_BLOCKHEIGHT'} />
        );
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
        <StyledBox state={state === 'success' ? state : undefined}>
            <Row responsive={type === 'regular'}>
                <Left>
                    <IconWrapper>
                        {!state && <Dot color={colors.NEUE_STROKE_GREY} />}
                        {state === 'success' && <Icon color={colors.NEUE_BG_GREEN} icon="CHECK" />}
                        {state === 'warning' && <Dot color={colors.NEUE_TYPE_ORANGE} />}
                    </IconWrapper>
                    <Address>{outputLabel}</Address>
                </Left>
                <Right>
                    <Amounts>
                        <Coin>
                            {hasExpansion ? `${outputValue.substring(0, 10)}...` : outputValue}
                            {outputSymbol && <Symbol>{outputSymbol}</Symbol>}
                            {hasExpansion && (
                                <Icon
                                    useCursorPointer
                                    size={16}
                                    icon={!isExpanded ? 'ARROW_DOWN' : 'ARROW_UP'}
                                    onClick={() => setExpanded(!isExpanded)}
                                />
                            )}
                        </Coin>
                        <Fiat>
                            {outputSymbol && (
                                <FiatValue
                                    disableHiddenPlaceholder
                                    amount={outputValue}
                                    symbol={outputSymbol}
                                />
                            )}
                        </Fiat>
                    </Amounts>
                </Right>
            </Row>
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <ExpandWrapper {...ANIMATION.EXPAND}>
                        <Pre>{outputValue}</Pre>
                    </ExpandWrapper>
                )}
            </AnimatePresence>
        </StyledBox>
    );
};

export default Output;
