import { Icon, Text, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { formInputsMaxLength } from '@suite-common/validators';
import { useFormatters } from '@suite-common/formatters';
import { getInputState, getNonComposeErrorMessage } from '@suite-common/wallet-utils';

import { NumberInput } from 'src/components/suite';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';
import { useSelector, useTranslation } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { validateDecimals, validateLimitsBigNum, validateMin } from 'src/utils/suite/validation';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';

export const Inputs = () => {
    const { translationString } = useTranslation();
    const { CryptoAmountFormatter } = useFormatters();
    const { symbol } = useSelector(selectSelectedAccount) ?? {};

    const {
        control,
        network,
        formState: { errors },
        amountLimits,
        onCryptoAmountChange,
        onFiatAmountChange,
        localCurrency,
        currentRate,
    } = useUnstakeEthFormContext();

    const cryptoError = errors.cryptoInput;
    const fiatError = errors.fiatInput;

    const fiatInputRules = {
        validate: {
            min: validateMin(translationString),
            decimals: validateDecimals(translationString, { decimals: 2 }),
        },
    };

    const cryptoInputRules = {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: {
            min: validateMin(translationString),
            decimals: validateDecimals(translationString, { decimals: network.decimals }),
            limits: validateLimitsBigNum(translationString, {
                amountLimits,
                formatter: CryptoAmountFormatter,
            }),
        },
    };

    return (
        <Row gap={spacings.md} alignItems="flex-start">
            <NumberInput
                name={CRYPTO_INPUT}
                control={control}
                rules={cryptoInputRules}
                maxLength={formInputsMaxLength.amount}
                innerAddon={<Text variant="tertiary">{symbol?.toUpperCase()}</Text>}
                bottomText={getNonComposeErrorMessage(errors[CRYPTO_INPUT])}
                inputState={getInputState(cryptoError || fiatError)}
                onChange={value => {
                    onCryptoAmountChange(value);
                }}
            />

            {currentRate?.rate && (
                <>
                    <Icon name="arrowsLeftRight" size={20} margin={{ top: spacings.md }} />
                    <NumberInput
                        name={FIAT_INPUT}
                        control={control}
                        rules={fiatInputRules}
                        maxLength={formInputsMaxLength.fiat}
                        innerAddon={<Text variant="tertiary">{localCurrency?.toUpperCase()}</Text>}
                        bottomText={getNonComposeErrorMessage(errors[FIAT_INPUT])}
                        inputState={getInputState(fiatError || cryptoError)}
                        onChange={value => {
                            onFiatAmountChange(value);
                        }}
                    />
                </>
            )}
        </Row>
    );
};
