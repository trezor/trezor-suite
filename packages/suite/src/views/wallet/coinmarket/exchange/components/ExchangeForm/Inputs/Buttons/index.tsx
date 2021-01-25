import { variables } from '@trezor/components';
import React from 'react';
import BigNumber from 'bignumber.js';
import { Translation } from '@suite-components';
import styled from 'styled-components';
import { invityApiSymbolToSymbol } from '@wallet-utils/coinmarket/coinmarketUtils';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import { formatLabel } from '@wallet-utils/coinmarket/exchangeUtils';

const Wrapper = styled.div`
    display: flex;
    justify-content: space-between;

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        margin-top: 27px;
    }
`;

const TokenBalance = styled.div`
    padding: 0px 6px;
    font-size: ${variables.NEUE_FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const TokenBalanceValue = styled.span`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Left = styled.div`
    display: flex;
`;

const Button = styled.div`
    padding: 4px 6px;
    margin-right: 10px;
    cursor: pointer;
    border-radius: 4px;
    background-color: ${props => props.theme.BG_GREY};
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Bottom = () => {
    const {
        compose,
        token,
        account,
        setMax,
        network,
        setValue,
        updateFiatValue,
    } = useCoinmarketExchangeFormContext();
    const formattedToken = invityApiSymbolToSymbol(token);
    const tokenData = account.tokens?.find(t => t.symbol === formattedToken);

    const setRatioAmount = (divisor: number) => {
        setMax(false);
        const amount = tokenData
            ? new BigNumber(tokenData.balance || '0')
                  .dividedBy(divisor)
                  .decimalPlaces(tokenData.decimals)
                  .toString()
            : new BigNumber(account.formattedBalance)
                  .dividedBy(divisor)
                  .decimalPlaces(network.decimals)
                  .toString();
        setValue('receiveCryptoInput', amount);
        updateFiatValue(amount);
    };

    return (
        <Wrapper>
            <Left>
                <Button onClick={() => setRatioAmount(2)}>1/2</Button>
                <Button onClick={() => setRatioAmount(3)}>1/3</Button>
                <Button onClick={() => setRatioAmount(4)}>1/4</Button>
                <Button
                    onClick={async () => {
                        setMax(true);
                        await compose({
                            setMax: true,
                            fillValue: true,
                        });
                    }}
                >
                    <Translation id="TR_EXCHANGE_ALL" />
                </Button>
            </Left>
            <TokenBalance>
                {tokenData && (
                    <TokenBalanceValue>
                        <Translation id="TOKEN_BALANCE" values={{ balance: tokenData.balance }} />
                        {tokenData.symbol ? ` ${formatLabel(tokenData.symbol)}` : ''}
                    </TokenBalanceValue>
                )}
            </TokenBalance>
        </Wrapper>
    );
};

export default Bottom;
