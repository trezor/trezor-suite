import { useEffect, ReactElement } from 'react';
import styled, { css } from 'styled-components';
import { FieldValues } from 'react-hook-form';
import { getInputState } from '@suite-common/wallet-utils';
import { useCoinmarketExchangeFormContext } from 'src/hooks/wallet/useCoinmarketExchangeForm';
import { NumberInput, NumberInputProps, Translation } from 'src/components/suite';
import SendCryptoSelect from './SendCryptoSelect';
import { formInputsMaxLength } from '@suite-common/validators';
import { CRYPTO_INPUT, CRYPTO_TOKEN, FIAT_INPUT } from 'src/types/wallet/coinmarketExchangeForm';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useTranslation } from 'src/hooks/suite';
import {
    validateDecimals,
    validateInteger,
    validateLimits,
    validateMin,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';
import { useFormatters } from '@suite-common/formatters';
import { spacingsPx } from '@trezor/theme';

const StyledInput = styled(NumberInput)<{ $isWithRate: boolean }>`
    ${({ $isWithRate }) =>
        $isWithRate &&
        css`
            input {
                border-top-right-radius: 0;
                border-bottom-right-radius: 0;
                border-right: ${spacingsPx.xxxs} solid ${({ theme }) => theme.borderOnElevation1};
            }
        `}
` as <T extends FieldValues>(props: NumberInputProps<T> & { isWithRate: boolean }) => ReactElement; // Styled wrapper doesn't preserve type argument, see https://github.com/styled-components/styled-components/issues/1803#issuecomment-1181765843

interface SendCryptoInputProps {
    isWithRate: boolean;
}

const SendCryptoInput = ({ isWithRate }: SendCryptoInputProps) => {
    const { translationString } = useTranslation();
    const {
        control,
        formState: { errors },
        clearErrors,
        network,
        account,
        amountLimits,
        composeRequest,
        updateFiatValue,
        getValues,
        setValue,
    } = useCoinmarketExchangeFormContext();
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const { CryptoAmountFormatter } = useFormatters();

    const tokenAddress = getValues(CRYPTO_TOKEN);
    const tokenData = account.tokens?.find(t => t.contract === tokenAddress);

    const decimals = tokenData ? tokenData.decimals : network.decimals;

    const { outputs } = getValues();
    const amount = outputs?.[0]?.amount;

    useEffect(() => {
        composeRequest();
    }, [amount, composeRequest]);

    const amountError = errors.outputs?.[0]?.amount;
    const fiatError = errors.outputs?.[0]?.fiat;

    const cryptoInputRules = {
        validate: {
            min: validateMin(translationString),
            integer: validateInteger(translationString, {
                except: !shouldSendInSats || !!decimals,
            }),
            limits: validateLimits(translationString, {
                amountLimits,
                areSatsUsed: !!shouldSendInSats,
                formatter: CryptoAmountFormatter,
            }),
            reserveOrBalance: validateReserveOrBalance(translationString, {
                account,
                areSatsUsed: !!shouldSendInSats,
                tokenAddress,
            }),
            decimals: validateDecimals(translationString, { decimals }),
        },
    };

    return (
        <StyledInput
            control={control}
            data-test="@coinmarket/exchange/crypto-input"
            onChange={value => {
                updateFiatValue(value);
                clearErrors(FIAT_INPUT);
                setValue('setMaxOutputId', undefined, { shouldDirty: true });
                composeRequest();
            }}
            label={<Translation id="TR_FROM" />}
            inputState={getInputState(amountError || fiatError)}
            name={CRYPTO_INPUT}
            maxLength={formInputsMaxLength.amount}
            isWithRate={isWithRate}
            rules={cryptoInputRules}
            bottomText={amountError?.message || null}
            innerAddon={<SendCryptoSelect />}
        />
    );
};

export default SendCryptoInput;
