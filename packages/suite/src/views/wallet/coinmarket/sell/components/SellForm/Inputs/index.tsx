import { Icon, variables } from '@trezor/components';
import React, { useEffect, useState } from 'react';
import { useCoinmarketSellFormContext } from '@wallet-hooks/useCoinmarketSellForm';
import styled from 'styled-components';
import FiatInput from './FiatInput';
import { CRYPTO_INPUT, FIAT_INPUT } from '@suite/types/wallet/coinmarketSellForm';
import CryptoInput from './CryptoInput';
import Buttons from './Buttons';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Top = styled.div`
    display: flex;
    flex: 1;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }
`;

const Left = styled.div`
    display: flex;
    flex: 1;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
`;

const Middle = styled.div`
    display: flex;
    min-width: 65px;
    height: 48px;
    align-items: center;
    justify-content: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding-bottom: 27px;
    }
`;

const StyledIcon = styled(Icon)`
    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        transform: rotate(90deg);
    }
`;

const Inputs = () => {
    const { errors, trigger, watch } = useCoinmarketSellFormContext();
    const [activeInput, setActiveInput] = useState<typeof FIAT_INPUT | typeof CRYPTO_INPUT>(
        FIAT_INPUT,
    );

    // if FIAT_INPUT has a valid value, set it as the activeInput
    if (watch(FIAT_INPUT) && !errors[FIAT_INPUT] && activeInput === CRYPTO_INPUT) {
        setActiveInput(FIAT_INPUT);
    }

    useEffect(() => {
        trigger([activeInput]);
    }, [activeInput, trigger]);

    return (
        <Wrapper>
            <Top>
                <Left>
                    <CryptoInput activeInput={activeInput} setActiveInput={setActiveInput} />
                </Left>
                <Middle>
                    <StyledIcon icon="TRANSFER" size={16} />
                </Middle>
                <Right>
                    <FiatInput activeInput={activeInput} setActiveInput={setActiveInput} />
                </Right>
            </Top>
            <Buttons setActiveInput={setActiveInput} />
        </Wrapper>
    );
};

export default Inputs;
