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
import { CoinmarketFormOptionLabel } from 'src/views/wallet/coinmarket';
import { FieldError, FieldValues } from 'react-hook-form';
import { coinmarketGetAccountLabel } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { isCoinmarketSellOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';

const CoinmarketFormInputCrypto = <TFieldValues extends FieldValues>({
    cryptoInputName,
    fiatInputName,
    methods,
}: CoinmarketFormInputFiatCryptoProps<TFieldValues>) => {
    const { translationString } = useTranslation();
    const { CryptoAmountFormatter } = useFormatters();
    const context = useCoinmarketFormContext();
    const { amountLimits, account, network } = context;
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const {
        control,
        formState: { errors },
        getValues,
        trigger,
        clearErrors,
    } = methods;
    const { getNetworkSymbol } = useCoinmarketInfo();
    const { cryptoSelect } = getValues();
    const cryptoInputError = errors[cryptoInputName] as FieldError;

    const accountSymbol = getNetworkSymbol(cryptoSelect?.value) ?? '';
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
                if (isCoinmarketSellOffers(context)) {
                    context.setValue('setMaxOutputId', undefined, { shouldDirty: true });
                }

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
                    {coinmarketGetAccountLabel(accountSymbol, shouldSendInSats)}
                </CoinmarketFormOptionLabel>
            }
            data-testid="@coinmarket/form/crypto-input"
        />
    );
};

export default CoinmarketFormInputCrypto;
