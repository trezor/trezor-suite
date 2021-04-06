import { variables } from '@trezor/components';
import React from 'react';
import BigNumber from 'bignumber.js';
import { Translation } from '@suite-components';
import styled from 'styled-components';
import { useCoinmarketSellFormContext } from '@wallet-hooks/useCoinmarketSellForm';
import { CRYPTO_INPUT, FIAT_INPUT } from '@wallet-types/coinmarketSellForm';

const Wrapper = styled.div`
    display: flex;
    justify-content: space-between;

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        margin-top: 27px;
    }
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

interface Props {
    setActiveInput: React.Dispatch<React.SetStateAction<typeof FIAT_INPUT | typeof CRYPTO_INPUT>>;
}
const Bottom = ({ setActiveInput }: Props) => {
    const {
        composeRequest,
        account,
        network,
        setValue,
        clearErrors,
        onCryptoAmountChange,
    } = useCoinmarketSellFormContext();

    const setRatioAmount = (divisor: number) => {
        const amount = new BigNumber(account.formattedBalance)
            .dividedBy(divisor)
            .decimalPlaces(network.decimals)
            .toString();
        setValue(CRYPTO_INPUT, amount);
        clearErrors([CRYPTO_INPUT]);
        setActiveInput(CRYPTO_INPUT);
        onCryptoAmountChange(amount);
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
                        setValue(FIAT_INPUT, '');
                        clearErrors([FIAT_INPUT, CRYPTO_INPUT]);
                        setActiveInput(CRYPTO_INPUT);
                        composeRequest(CRYPTO_INPUT);
                    }}
                >
                    <Translation id="TR_SELL_ALL" />
                </Button>
            </Left>
        </Wrapper>
    );
};

export default Bottom;
