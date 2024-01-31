import { useCallback, useEffect } from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import { useCoinmarketSellFormContext } from 'src/hooks/wallet/useCoinmarketSellForm';
import FiatInput from './FiatInput';
import { CRYPTO_INPUT, FIAT_INPUT, OUTPUT_AMOUNT } from 'src/types/wallet/coinmarketSellForm';
import CryptoInput from './CryptoInput';
import { useLayoutSize } from 'src/hooks/suite';
import { CoinmarketFractionButtons } from 'src/views/wallet/coinmarket/common';
import { amountToSatoshi, isZero } from '@suite-common/wallet-utils';
import { Wrapper, Left, Middle, Right, StyledIcon } from 'src/views/wallet/coinmarket';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

const EmptyDiv = styled.div`
    width: 100%;
`;

const StyledCoinmarketFractionButtons = styled(CoinmarketFractionButtons)`
    width: 100%;
`;

const Inputs = () => {
    const {
        trigger,
        composeRequest,
        account,
        network,
        setValue,
        clearErrors,
        onCryptoAmountChange,
        getValues,
        amountLimits,
    } = useCoinmarketSellFormContext();
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

    const { outputs } = getValues();
    const tokenAddress = outputs?.[0]?.token;
    const tokenData = account.tokens?.find(t => t.contract === tokenAddress);

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
            const cryptoInputValue = shouldSendInSats
                ? amountToSatoshi(amount, network.decimals)
                : amount;
            setValue(CRYPTO_INPUT, cryptoInputValue, { shouldDirty: true });
            clearErrors([CRYPTO_INPUT]);
            onCryptoAmountChange(cryptoInputValue);
        },
        [
            account.formattedBalance,
            shouldSendInSats,
            clearErrors,
            network.decimals,
            onCryptoAmountChange,
            tokenData,
            setValue,
        ],
    );

    const setAllAmount = useCallback(() => {
        setValue('setMaxOutputId', 0, { shouldDirty: true });
        setValue(FIAT_INPUT, '', { shouldDirty: true });
        setValue(OUTPUT_AMOUNT, '', { shouldDirty: true });
        clearErrors([FIAT_INPUT, CRYPTO_INPUT]);
        composeRequest(CRYPTO_INPUT);
    }, [clearErrors, composeRequest, setValue]);

    const isBalanceZero = tokenData
        ? isZero(tokenData.balance || '0')
        : isZero(account.formattedBalance);

    // Trigger validation once amountLimits are loaded after first submit
    useEffect(() => {
        if (amountLimits) {
            trigger([CRYPTO_INPUT, FIAT_INPUT]);
        }
    }, [amountLimits, trigger]);

    return (
        <Wrapper responsiveSize="LG">
            <Left>
                <CryptoInput />
            </Left>
            <Middle responsiveSize="LG">
                {!isLargeLayoutSize && (
                    <StyledCoinmarketFractionButtons
                        disabled={isBalanceZero}
                        onFractionClick={setRatioAmount}
                        onAllClick={setAllAmount}
                    />
                )}
                <StyledIcon responsiveSize="LG" icon="TRANSFER" size={16} />
                {!isLargeLayoutSize && <EmptyDiv />}
            </Middle>
            <Right>
                <FiatInput />
            </Right>
            {isLargeLayoutSize && (
                <StyledCoinmarketFractionButtons
                    disabled={isBalanceZero}
                    onFractionClick={setRatioAmount}
                    onAllClick={setAllAmount}
                />
            )}
        </Wrapper>
    );
};

export default Inputs;
