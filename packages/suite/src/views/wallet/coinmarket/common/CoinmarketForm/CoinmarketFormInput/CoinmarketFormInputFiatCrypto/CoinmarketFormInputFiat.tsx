import { useSelector, useTranslation } from 'src/hooks/suite';
import { NumberInput } from 'src/components/suite';
import { validateDecimals, validateMin } from 'src/utils/suite/validation';
import { getInputState } from '@suite-common/wallet-utils';
import { formInputsMaxLength } from '@suite-common/validators';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import { useDidUpdate } from '@trezor/react-utils';
import CoinmarketFormInputCurrency from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCurrency';
import { CoinmarketFormInputProps } from 'src/types/coinmarket/coinmarketForm';

const CoinmarketFormInputFiat = ({ className }: CoinmarketFormInputProps) => {
    const { translationString } = useTranslation();
    const account = useSelector(state => state.wallet.selectedAccount.account);
    const {
        formState: { errors },
        control,
        amountLimits,
        trigger,
        clearErrors,
    } = useCoinmarketFormContext<CoinmarketTradeBuyType>();
    const fiatInput = 'fiatInput';
    const cryptoInput = 'cryptoInput';

    const fiatInputRules = {
        validate: {
            min: validateMin(translationString),
            decimals: validateDecimals(translationString, { decimals: 2 }),
            minFiat: (value: string) => {
                if (value && amountLimits?.minFiat && Number(value) < amountLimits.minFiat) {
                    return translationString('TR_BUY_VALIDATION_ERROR_MINIMUM_FIAT', {
                        minimum: amountLimits.minFiat,
                        currency: amountLimits.currency,
                    });
                }
            },
            maxFiat: (value: string) => {
                if (value && amountLimits?.maxFiat && Number(value) > amountLimits.maxFiat) {
                    return translationString('TR_BUY_VALIDATION_ERROR_MAXIMUM_FIAT', {
                        maximum: amountLimits.maxFiat,
                        currency: amountLimits.currency,
                    });
                }
            },
        },
    };

    useDidUpdate(() => {
        trigger('fiatInput');
    }, [amountLimits?.maxFiat, amountLimits?.minFiat, trigger]);

    if (!account) return null;

    return (
        <NumberInput
            name={fiatInput}
            onChange={() => {
                clearErrors(cryptoInput);
            }}
            inputState={getInputState(errors.fiatInput)}
            control={control}
            rules={fiatInputRules}
            maxLength={formInputsMaxLength.amount}
            bottomText={errors[fiatInput]?.message || null}
            innerAddon={<CoinmarketFormInputCurrency />}
            hasBottomPadding={false}
            className={className}
            data-test="@coinmarket/form/fiat-input"
        />
    );
};

export default CoinmarketFormInputFiat;
