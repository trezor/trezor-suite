import React, { useCallback, useEffect } from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { useCoinmarketSellFormContext } from '@wallet-hooks/useCoinmarketSellForm';
import FiatInput from './FiatInput';
import { CRYPTO_INPUT, FIAT_INPUT, OUTPUT_AMOUNT } from '@suite/types/wallet/coinmarketSellForm';
import CryptoInput from './CryptoInput';
import { useLayoutSize } from '@suite/hooks/suite';
import FractionButtons from '@suite/components/wallet/CoinMarketFractionButtons';
import { Wrapper, Left, Middle, Right, StyledIcon } from '@wallet-views/coinmarket';

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
        getValues,
    } = useCoinmarketSellFormContext();

    // if FIAT_INPUT has a valid value, set it as the activeInput
    if (watch(FIAT_INPUT) && !errors[FIAT_INPUT] && activeInput === CRYPTO_INPUT) {
        setActiveInput(FIAT_INPUT);
    }

    const { outputs } = getValues();
    const tokenAddress = outputs?.[0]?.token;
    const tokenData = account.tokens?.find(t => t.address === tokenAddress);

    useEffect(() => {
        trigger([activeInput]);
    }, [activeInput, trigger]);

    const { layoutSize } = useLayoutSize();
    const isLargeLayoutSize = layoutSize === 'XLARGE' || layoutSize === 'LARGE';

    const setRatioAmount = useCallback(
        (divisor: number) => {
            const amount = tokenData
                ? new BigNumber(tokenData.balance || '0')
                      .dividedBy(divisor)
                      .decimalPlaces(tokenData.decimals)
                      .toString()
                : new BigNumber(account.formattedBalance)
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
            tokenData,
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

    const isBalanceZero = tokenData
        ? new BigNumber(tokenData.balance || '0').isZero()
        : new BigNumber(account.formattedBalance).isZero();

    return (
        <Wrapper responsiveSize="LG">
            <Left>
                <CryptoInput activeInput={activeInput} setActiveInput={setActiveInput} />
            </Left>
            <Middle responsiveSize="LG">
                {!isLargeLayoutSize && (
                    <FractionButtons
                        disabled={isBalanceZero}
                        onFractionClick={setRatioAmount}
                        onAllClick={setAllAmount}
                    />
                )}
                <StyledIcon responsiveSize="LG" icon="TRANSFER" size={16} />
                {!isLargeLayoutSize && <EmptyDiv />}
            </Middle>
            <Right>
                <FiatInput activeInput={activeInput} setActiveInput={setActiveInput} />
            </Right>
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
