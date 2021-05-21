import { Icon, variables, useTheme } from '@trezor/components';
import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import SendCryptoInput from './SendCryptoInput';
import FiatInput from './FiatInput';
import ReceiveCryptoSelect from './ReceiveCryptoSelect';
import FractionButtons from '@wallet-components/CoinMarketFractionButtons';
import { CRYPTO_INPUT, CRYPTO_TOKEN, FIAT_INPUT } from '@wallet-types/coinmarketExchangeForm';
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

    const tokenAddress = getValues(CRYPTO_TOKEN);
    const tokenData = account.tokens?.find(t => t.address === tokenAddress);

    useEffect(() => {
        trigger([CRYPTO_INPUT]);
    }, [amountLimits, trigger]);

    const { layoutSize } = useLayoutSize();
    const isXLargeLayoutSize = layoutSize === 'XLARGE';

    const setRatioAmount = useCallback(
        (divisor: number) => {
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
        setValue('setMaxOutputId', 0);
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
                    <Line
                        color={
                            errors.outputs &&
                            errors.outputs[0] &&
                            (errors.outputs[0].amount || errors.outputs[0].fiat)
                                ? theme.TYPE_RED
                                : theme.STROKE_GREY
                        }
                    />
                    {!tokenData && <FiatInput />}
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
