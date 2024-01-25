import styled from 'styled-components';
import { Icon } from '@trezor/components';
import { NumberInput } from 'src/components/suite';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';
import { formInputsMaxLength } from '@suite-common/validators';
import { useSelector, useTranslation } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { variables } from '@trezor/components/src/config';
import {
    validateDecimals,
    validateInteger,
    validateLimits,
    validateMin,
} from 'src/utils/suite/validation';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';
import { useFormatters } from '@suite-common/formatters';
import { getInputState } from '@suite-common/wallet-utils';

const HStack = styled.div`
    display: flex;
    gap: 14px;
`;

const IconWrapper = styled.div`
    height: 48px;
    display: flex;
    align-items: center;
`;

const InputAddon = styled.span`
    text-transform: uppercase;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export const Inputs = () => {
    const { translationString } = useTranslation();
    const { CryptoAmountFormatter } = useFormatters();
    const { symbol } = useSelector(selectSelectedAccount) ?? {};

    const {
        control,
        network,
        formState: { errors },
        getValues,
        amountLimits,
        onCryptoAmountChange,
        onFiatAmountChange,
        localCurrency,
    } = useUnstakeEthFormContext();

    const cryptoValue = getValues(CRYPTO_INPUT);
    const fiatValue = getValues(FIAT_INPUT);
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
            integer: validateInteger(translationString, { except: true }),
            decimals: validateDecimals(translationString, { decimals: network.decimals }),
            limits: validateLimits(translationString, {
                amountLimits,
                formatter: CryptoAmountFormatter,
            }),
        },
    };

    return (
        <HStack>
            <NumberInput
                noTopLabel
                name={FIAT_INPUT}
                control={control}
                rules={fiatInputRules}
                maxLength={formInputsMaxLength.fiat}
                innerAddon={<InputAddon>{localCurrency}</InputAddon>}
                bottomText={errors[FIAT_INPUT]?.message}
                inputState={getInputState(fiatError || cryptoError, fiatValue)}
                onChange={value => {
                    onFiatAmountChange(value);
                }}
            />

            <IconWrapper>
                {/* TODO: Add new transfer icon. Export from Figma isn't handled as is it should by the strokes to fills online converter */}
                <Icon icon="TRANSFER" size={16} />
            </IconWrapper>

            <NumberInput
                noTopLabel
                name={CRYPTO_INPUT}
                control={control}
                rules={cryptoInputRules}
                maxLength={formInputsMaxLength.amount}
                innerAddon={<InputAddon>{symbol}</InputAddon>}
                bottomText={errors[CRYPTO_INPUT]?.message}
                inputState={getInputState(cryptoError || fiatError, cryptoValue)}
                onChange={value => {
                    onCryptoAmountChange(value);
                }}
            />
        </HStack>
    );
};
