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
import { CoinmarketFormInputProps } from 'src/types/coinmarket/coinmarketForm';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { CoinmarketFormOptionLabel } from 'src/views/wallet/coinmarket';
import { FORM_CRYPTO_INPUT, FORM_FIAT_INPUT } from 'src/constants/wallet/coinmarket/form';

const CoinmarketFormInputCrypto = ({ className }: CoinmarketFormInputProps) => {
    const { translationString } = useTranslation();
    const { CryptoAmountFormatter } = useFormatters();
    const {
        formState: { errors },
        control,
        amountLimits,
        account,
        network,
        trigger,
        clearErrors,
        getValues,
    } = useCoinmarketFormContext();
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const { cryptoSelect } = getValues();

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
            trigger([FORM_CRYPTO_INPUT]);
        }
    }, [amountLimits, trigger]);

    return (
        <NumberInput
            name={FORM_CRYPTO_INPUT}
            onChange={() => {
                clearErrors(FORM_FIAT_INPUT);
            }}
            inputState={getInputState(errors[FORM_CRYPTO_INPUT])}
            control={control as any} // FIXME: any
            rules={cryptoInputRules}
            maxLength={formInputsMaxLength.amount}
            bottomText={errors[FORM_CRYPTO_INPUT]?.message || null}
            className={className}
            hasBottomPadding={false}
            innerAddon={
                <CoinmarketFormOptionLabel>
                    {cryptoToCoinSymbol(cryptoSelect?.value)}
                </CoinmarketFormOptionLabel>
            }
            data-test="@coinmarket/form/crypto-input"
        />
    );
};

export default CoinmarketFormInputCrypto;
