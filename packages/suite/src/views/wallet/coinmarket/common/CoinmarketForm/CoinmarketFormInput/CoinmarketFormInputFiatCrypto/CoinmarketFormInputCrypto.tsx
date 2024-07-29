import { useTranslation } from 'src/hooks/suite';
import { NumberInput } from 'src/components/suite';
import {
    validateDecimals,
    validateInteger,
    validateLimits,
    validateMin,
} from 'src/utils/suite/validation';
import { getInputState } from '@suite-common/wallet-utils';
import { formInputsMaxLength } from '@suite-common/validators';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { useFormatters } from '@suite-common/formatters';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useEffect } from 'react';
import { CoinmarketFormInputFiatCryptoProps } from 'src/types/coinmarket/coinmarketForm';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { CoinmarketFormOptionLabel } from 'src/views/wallet/coinmarket';
import { FieldError, FieldValues } from 'react-hook-form';
import { coinmarketGetAccountLabel } from 'src/utils/wallet/coinmarket/coinmarketUtils';

const CoinmarketFormInputCrypto = <TFieldValues extends FieldValues>({
    cryptoInputName,
    fiatInputName,
    methods,
}: CoinmarketFormInputFiatCryptoProps<TFieldValues>) => {
    const { translationString } = useTranslation();
    const { CryptoAmountFormatter } = useFormatters();
    const { amountLimits, account, network } = useCoinmarketFormContext();
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const {
        control,
        formState: { errors },
        getValues,
        trigger,
        clearErrors,
    } = methods;
    const { cryptoSelect } = getValues();
    const cryptoInputError = errors[cryptoInputName] as FieldError;

    const cryptoInputRules = {
        validate: {
            min: validateMin(translationString),
            integer: validateInteger(translationString, { except: !shouldSendInSats }),
            decimals: validateDecimals(translationString, { decimals: network.decimals }),
            limits: validateLimits(translationString, {
                amountLimits,
                areSatsUsed: !!shouldSendInSats,
                formatter: CryptoAmountFormatter,
            }),
        },
    };

    useEffect(() => {
        if (amountLimits) {
            trigger([cryptoInputName]);
        }
    }, [amountLimits, cryptoInputName, trigger]);

    return (
        <NumberInput
            name={cryptoInputName}
            onChange={() => {
                clearErrors(fiatInputName);
            }}
            inputState={getInputState(cryptoInputError)}
            control={control}
            rules={cryptoInputRules}
            maxLength={formInputsMaxLength.amount}
            bottomText={cryptoInputError?.message || null}
            hasBottomPadding={false}
            innerAddon={
                <CoinmarketFormOptionLabel>
                    {coinmarketGetAccountLabel(
                        cryptoSelect?.value ? cryptoToCoinSymbol(cryptoSelect.value) : '',
                        shouldSendInSats,
                    )}
                </CoinmarketFormOptionLabel>
            }
            data-test="@coinmarket/form/crypto-input"
        />
    );
};

export default CoinmarketFormInputCrypto;
