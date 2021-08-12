import { Icon, variables } from '@trezor/components';
import React, { useCallback, useEffect } from 'react';
import { useCoinmarketSellFormContext } from '@wallet-hooks/useCoinmarketSellForm';
import styled from 'styled-components';
import FiatInput from './FiatInput';
import { CRYPTO_INPUT, FIAT_INPUT, OUTPUT_AMOUNT } from '@suite/types/wallet/coinmarketSellForm';
import CryptoInput from './CryptoInput';
import { useLayoutSize } from '@suite/hooks/suite';
import FractionButtons from '@suite/components/wallet/CoinMarketFractionButtons';
import BigNumber from 'bignumber.js';

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

const EmptyDiv = styled.div`
    width: 100%;
`;

const Inputs = () => {
    const {
        errors,
        trigger,
        watch,
        composeRequest,
        account,
        network,
        setValue,
        clearErrors,
        onCryptoAmountChange,
        activeInput,
        setActiveInput,
    } = useCoinmarketSellFormContext();

    // if FIAT_INPUT has a valid value, set it as the activeInput
    if (watch(FIAT_INPUT) && !errors[FIAT_INPUT] && activeInput === CRYPTO_INPUT) {
        setActiveInput(FIAT_INPUT);
    }

    useEffect(() => {
        trigger([activeInput]);
    }, [activeInput, trigger]);

    const { layoutSize } = useLayoutSize();
    const isLargeLayoutSize = layoutSize === 'XLARGE' || layoutSize === 'LARGE';

    const setRatioAmount = useCallback(
        (divisor: number) => {
            const amount = new BigNumber(account.formattedBalance)
                .dividedBy(divisor)
                .decimalPlaces(network.decimals)
                .toString();
            setValue(CRYPTO_INPUT, amount, { shouldDirty: true });
            clearErrors([CRYPTO_INPUT]);
            setActiveInput(CRYPTO_INPUT);
            onCryptoAmountChange(amount);
        },
        [
            account.formattedBalance,
            clearErrors,
            network.decimals,
            onCryptoAmountChange,
            setActiveInput,
            setValue,
        ],
    );

    const setAllAmount = useCallback(() => {
        setValue('setMaxOutputId', 0, { shouldDirty: true });
        setValue(FIAT_INPUT, '', { shouldDirty: true });
        setValue(OUTPUT_AMOUNT, '', { shouldDirty: true });
        clearErrors([FIAT_INPUT, CRYPTO_INPUT]);
        setActiveInput(CRYPTO_INPUT);
        composeRequest(CRYPTO_INPUT);
    }, [clearErrors, composeRequest, setActiveInput, setValue]);

    const isBalanceZero = new BigNumber(account.formattedBalance).isZero();

    return (
        <Wrapper>
            <Top>
                <Left>
                    <CryptoInput activeInput={activeInput} setActiveInput={setActiveInput} />
                </Left>
                <Middle>
                    {!isLargeLayoutSize && (
                        <FractionButtons
                            disabled={isBalanceZero}
                            onFractionClick={setRatioAmount}
                            onAllClick={setAllAmount}
                        />
                    )}
                    <StyledIcon icon="TRANSFER" size={16} />
                    {!isLargeLayoutSize && <EmptyDiv />}
                </Middle>
                <Right>
                    <FiatInput activeInput={activeInput} setActiveInput={setActiveInput} />
                </Right>
            </Top>
            {isLargeLayoutSize && (
                <FractionButtons
                    disabled={isBalanceZero}
                    onFractionClick={setRatioAmount}
                    onAllClick={setAllAmount}
                />
            )}
        </Wrapper>
    );
};

export default Inputs;
