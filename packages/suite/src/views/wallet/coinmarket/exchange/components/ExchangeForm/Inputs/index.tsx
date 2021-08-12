import { Icon, variables, useTheme, SuiteThemeColors } from '@trezor/components';
import React, { useCallback, useEffect } from 'react';
import { DeepMap, FieldError } from 'react-hook-form';
import styled from 'styled-components';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import SendCryptoInput from './SendCryptoInput';
import FiatInput from './FiatInput';
import ReceiveCryptoSelect from './ReceiveCryptoSelect';
import FractionButtons from '@wallet-components/CoinMarketFractionButtons';
import { CRYPTO_INPUT, ExchangeFormState, FIAT_INPUT } from '@wallet-types/coinmarketExchangeForm';
import { useLayoutSize } from '@suite/hooks/suite';
import BigNumber from 'bignumber.js';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Top = styled.div`
    display: flex;
    flex: 1;

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        flex-direction: column;
    }
`;

const LeftWrapper = styled.div`
    display: flex;
    flex: 1;
`;

const RightWrapper = styled.div`
    display: flex;
    justify-content: flex-end;
`;

const MiddleWrapper = styled.div`
    display: flex;
    min-width: 35px;
    height: 48px;
    align-items: center;
    justify-content: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        padding-bottom: 27px;
    }
`;

const StyledIcon = styled(Icon)`
    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        transform: rotate(90deg);
    }
`;

const Line = styled.div<{ color: string }>`
    height: 48px;
    border: 1px solid ${props => props.color};
`;

const EmptyDiv = styled.div`
    width: 100%;
`;

const getLineDividerColor = (
    theme: SuiteThemeColors,
    errors: DeepMap<ExchangeFormState, FieldError>,
    amount: string,
    fiat: string,
) => {
    if (
        errors.outputs &&
        errors.outputs[0] &&
        (errors.outputs[0].amount || errors.outputs[0].fiat)
    ) {
        return theme.TYPE_RED;
    }
    if (amount?.length > 0 && fiat?.length > 0) {
        return theme.TYPE_GREEN;
    }
    return theme.STROKE_GREY;
};

const Inputs = () => {
    const theme = useTheme();
    const {
        trigger,
        amountLimits,
        account,
        errors,
        getValues,
        composeRequest,
        network,
        setValue,
        updateFiatValue,
        clearErrors,
    } = useCoinmarketExchangeFormContext();

    const { outputs } = getValues();
    const tokenAddress = outputs?.[0]?.token;
    const fiat = outputs?.[0]?.fiat;
    const amount = outputs?.[0]?.amount;
    const tokenData = account.tokens?.find(t => t.address === tokenAddress);

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
            setValue(CRYPTO_INPUT, amount, { shouldDirty: true });
            updateFiatValue(amount);
            clearErrors([FIAT_INPUT, CRYPTO_INPUT]);
            composeRequest();
        },
        [
            account.formattedBalance,
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
        ? new BigNumber(tokenData.balance || '0').isZero()
        : new BigNumber(account.formattedBalance).isZero();

    return (
        <Wrapper>
            <Top>
                <LeftWrapper>
                    <SendCryptoInput />
                    {!tokenData && (
                        <>
                            <Line color={getLineDividerColor(theme, errors, amount, fiat)} />
                            <FiatInput />
                        </>
                    )}
                </LeftWrapper>
                <MiddleWrapper>
                    {!isXLargeLayoutSize && (
                        <FractionButtons
                            disabled={isBalanceZero}
                            onFractionClick={setRatioAmount}
                            onAllClick={setAllAmount}
                        />
                    )}
                    <StyledIcon icon="TRANSFER" size={16} />
                    {!isXLargeLayoutSize && <EmptyDiv />}
                </MiddleWrapper>
                <RightWrapper>
                    <ReceiveCryptoSelect />
                </RightWrapper>
            </Top>
            {isXLargeLayoutSize && (
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
