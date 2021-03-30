import { variables } from '@trezor/components';
import React from 'react';
import BigNumber from 'bignumber.js';
import { Translation } from '@suite-components';
import styled from 'styled-components';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import { formatLabel } from '@wallet-utils/coinmarket/exchangeUtils';
import { CRYPTO_INPUT, CRYPTO_TOKEN, FIAT_INPUT } from '@wallet-types/coinmarketExchangeForm';

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
        composeRequest,
        account,
        network,
        getValues,
        setValue,
        updateFiatValue,
        clearErrors,
    } = useCoinmarketExchangeFormContext();
    const tokenAddress = getValues(CRYPTO_TOKEN);
    const tokenData = account.tokens?.find(t => t.address === tokenAddress);

    const setRatioAmount = (divisor: number) => {
        setValue('setMaxOutputId', undefined);
        const amount = tokenData
            ? new BigNumber(tokenData.balance || '0')
                  .dividedBy(divisor)
                  .decimalPlaces(tokenData.decimals)
                  .toString()
            : new BigNumber(account.formattedBalance)
                  .dividedBy(divisor)
                  .decimalPlaces(network.decimals)
                  .toString();
        setValue(CRYPTO_INPUT, amount);
        updateFiatValue(amount);
        clearErrors([FIAT_INPUT, CRYPTO_INPUT]);
        composeRequest();
    };

    return (
        <Wrapper>
            <Left>
                <Button onClick={() => setRatioAmount(2)}>1/2</Button>
                <Button onClick={() => setRatioAmount(3)}>1/3</Button>
                <Button onClick={() => setRatioAmount(4)}>1/4</Button>
                <Button
                    onClick={() => {
                        setValue('setMaxOutputId', 0);
                        clearErrors([FIAT_INPUT, CRYPTO_INPUT]);
                        composeRequest();
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
