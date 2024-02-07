import { useCallback, useEffect } from 'react';
import styled, { css } from 'styled-components';
import BigNumber from 'bignumber.js';

import { isZero, amountToSatoshi } from '@suite-common/wallet-utils';
import { useCoinmarketExchangeFormContext } from 'src/hooks/wallet/useCoinmarketExchangeForm';
import SendCryptoInput from './SendCryptoInput';
import FiatInput from './FiatInput';
import ReceiveCryptoSelect from './ReceiveCryptoSelect';
import { CoinmarketFractionButtons } from 'src/views/wallet/coinmarket/common';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/coinmarketExchangeForm';
import { Wrapper, Left, Right } from 'src/views/wallet/coinmarket';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { useElevation, variables } from '@trezor/components';
import { EvmExplanationBox } from 'src/components/wallet/EvmExplanationBox';
import { networks } from '@suite-common/wallet-config';
import {
    cryptoToNetworkSymbol,
    isCryptoSymbolToken,
} from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { useSelector } from 'src/hooks/suite';
import { selectDeviceAccounts } from '@suite-common/wallet-core';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

const Row = styled.div<{ spaceBefore?: boolean }>`
    display: flex;
    align-items: flex-start;
    width: 100%;

    ${({ spaceBefore }) =>
        spaceBefore &&
        css`
            margin-top: 24px;
        `}
`;

const Balance = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledFiatValue = styled(FiatValue)`
    margin-left: 1ch;
`;

const StyledEvmExplanationBox = styled(EvmExplanationBox)`
    margin-bottom: 14px;
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
    const deviceAccounts = useSelector(selectDeviceAccounts);
    const { elevation } = useElevation();
    const isDebug = useSelector(selectIsDebugModeActive);

    const { outputs, receiveCryptoSelect } = getValues();
    const tokenAddress = outputs?.[0]?.token;
    const tokenData = account.tokens?.find(t => t.contract === tokenAddress);

    // Trigger validation once amountLimits are loaded after first submit
    useEffect(() => {
        trigger([CRYPTO_INPUT]);
    }, [amountLimits, trigger]);

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

    const balance = tokenData ? tokenData.balance || '0' : account.formattedBalance;
    const symbol = tokenData?.symbol ?? account.symbol;
    const isBalanceZero = isZero(balance);

    const receiveCryptoNetworkSymbol =
        receiveCryptoSelect?.cryptoSymbol &&
        cryptoToNetworkSymbol(receiveCryptoSelect.cryptoSymbol);

    const isReceiveTokenBalanceZero =
        receiveCryptoSelect?.cryptoSymbol &&
        isCryptoSymbolToken(receiveCryptoSelect?.cryptoSymbol) &&
        receiveCryptoNetworkSymbol &&
        deviceAccounts
            .filter(ac => ac.networkType === 'ethereum' && ac.symbol === receiveCryptoNetworkSymbol)
            .every(ac => new BigNumber(ac.balance).isZero());

    return (
        <Wrapper responsiveSize="XL">
            <Row>
                <SendCryptoInput />
                {!tokenData && <FiatInput />}
            </Row>
            <Row>
                <Left>
                    <Balance>
                        <Translation id="TR_BALANCE" />:{' '}
                        <FormattedCryptoAmount value={balance} symbol={symbol} />
                        <StyledFiatValue
                            amount={balance}
                            symbol={symbol}
                            showApproximationIndicator
                        />
                    </Balance>
                </Left>
                <Right>
                    <CoinmarketFractionButtons
                        disabled={isBalanceZero}
                        onFractionClick={setRatioAmount}
                        onAllClick={setAllAmount}
                        data-test="@coinmarket/exchange/fiat-input"
                    />
                </Right>
            </Row>
            <Row spaceBefore>
                <ReceiveCryptoSelect />
            </Row>
            {isReceiveTokenBalanceZero &&
                (receiveCryptoNetworkSymbol !== 'matic' || // TODO: POLYGON DEBUG
                    (receiveCryptoNetworkSymbol === 'matic' && isDebug)) && (
                    <Row spaceBefore>
                        <StyledEvmExplanationBox
                            caret
                            elevation={elevation}
                            symbol={receiveCryptoNetworkSymbol}
                            title={<Translation id="TR_EVM_EXPLANATION_EXCHANGE_TITLE" />}
                        >
                            <Translation
                                id="TR_EVM_EXPLANATION_EXCHANGE_DESCRIPTION"
                                values={{
                                    coin: receiveCryptoSelect.label,
                                    network: networks[receiveCryptoNetworkSymbol].name,
                                    networkSymbol: receiveCryptoNetworkSymbol.toUpperCase(),
                                }}
                            />
                        </StyledEvmExplanationBox>
                    </Row>
                )}
        </Wrapper>
    );
};

export default Inputs;
