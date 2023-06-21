import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { isZero, amountToSatoshi } from '@suite-common/wallet-utils';
import { useCoinmarketExchangeFormContext } from 'src/hooks/wallet/useCoinmarketExchangeForm';
import SendCryptoInput from './SendCryptoInput';
import FiatInput from './FiatInput';
import ReceiveCryptoSelect from './ReceiveCryptoSelect';
import { FractionButtons } from 'src/components/wallet/CoinMarketFractionButtons';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/coinmarketExchangeForm';
import { useLayoutSize } from 'src/hooks/suite';
import { Wrapper, Left, Middle, Right, StyledIcon } from 'src/views/wallet/coinmarket';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

const StyledLeft = styled(Left)`
    flex-basis: 50%;
`;

const StyledMiddle = styled(Middle)`
    min-width: 35px;
`;

const EmptyDiv = styled.div`
    width: 100%;
`;

const Inputs = () => {
    const {
        trigger,
        amountLimits,
        account,
        getValues,
        composeRequest,
        network,
        setValue,
        updateFiatValue,
        clearErrors,
    } = useCoinmarketExchangeFormContext();
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

    const { outputs } = getValues();
    const tokenAddress = outputs?.[0]?.token;
    const tokenData = account.tokens?.find(t => t.contract === tokenAddress);

    useEffect(() => {
        trigger([CRYPTO_INPUT]);
    }, [amountLimits, trigger]);

    const { layoutSize } = useLayoutSize();
    const isXLargeLayoutSize = layoutSize === 'XLARGE';

    const setRatioAmount = useCallback(
        (divisor: number) => {
            setValue('setMaxOutputId', undefined, { shouldDirty: true });
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
            updateFiatValue(cryptoInputValue);
            clearErrors([FIAT_INPUT, CRYPTO_INPUT]);
            composeRequest();
        },
        [
            account.formattedBalance,
            shouldSendInSats,
            clearErrors,
            composeRequest,
            network.decimals,
            setValue,
            tokenData,
            updateFiatValue,
        ],
    );

    const setAllAmount = useCallback(() => {
        setValue(CRYPTO_INPUT, '', { shouldDirty: true });
        setValue('setMaxOutputId', 0, { shouldDirty: true });
        clearErrors([FIAT_INPUT, CRYPTO_INPUT]);
        composeRequest();
    }, [clearErrors, composeRequest, setValue]);

    const isBalanceZero = tokenData
        ? isZero(tokenData.balance || '0')
        : isZero(account.formattedBalance);

    return (
        <Wrapper responsiveSize="XL">
            <StyledLeft>
                <SendCryptoInput />
                {!tokenData && <FiatInput />}
            </StyledLeft>
            <StyledMiddle responsiveSize="XL">
                {!isXLargeLayoutSize && (
                    <FractionButtons
                        disabled={isBalanceZero}
                        onFractionClick={setRatioAmount}
                        onAllClick={setAllAmount}
                    />
                )}
                <StyledIcon responsiveSize="XL" icon="TRANSFER" size={16} />
                {!isXLargeLayoutSize && <EmptyDiv />}
            </StyledMiddle>
            <Right>
                <ReceiveCryptoSelect />
            </Right>
            {isXLargeLayoutSize && (
                <FractionButtons
                    disabled={isBalanceZero}
                    onFractionClick={setRatioAmount}
                    onAllClick={setAllAmount}
                    data-test="@coinmarket/exchange/fiat-input"
                />
            )}
        </Wrapper>
    );
};

export default Inputs;
