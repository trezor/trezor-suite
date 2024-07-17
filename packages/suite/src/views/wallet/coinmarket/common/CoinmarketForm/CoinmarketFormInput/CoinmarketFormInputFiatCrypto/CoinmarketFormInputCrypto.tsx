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
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import { useFormatters } from '@suite-common/formatters';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useEffect } from 'react';
import { CoinmarketFormInputProps } from 'src/types/coinmarket/coinmarketForm';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { CoinmarketFormOptionLabel } from 'src/views/wallet/coinmarket';

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
    } = useCoinmarketFormContext<CoinmarketTradeBuyType>();
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

    const fiatInput = 'fiatInput';
    const cryptoInput = 'cryptoInput';

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
            trigger([cryptoInput]);
        }
    }, [amountLimits, trigger]);

    return (
        <NumberInput
            name={cryptoInput}
            onChange={() => {
                clearErrors(fiatInput);
            }}
            inputState={getInputState(errors.cryptoInput)}
            control={control}
            rules={cryptoInputRules}
            maxLength={formInputsMaxLength.amount}
            bottomText={errors[cryptoInput]?.message || null}
            className={className}
            hasBottomPadding={false}
            innerAddon={
                <CoinmarketFormOptionLabel>
                    {cryptoToCoinSymbol(getValues().cryptoSelect.value)}
                </CoinmarketFormOptionLabel>
            }
            data-test="@coinmarket/form/crypto-input"
        />
    );
};

export default CoinmarketFormInputCrypto;
