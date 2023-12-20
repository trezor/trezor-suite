import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import {
    Control,
    FieldErrors,
    FieldPath,
    UseFormGetValues,
    UseFormRegister,
    UseFormReturn,
    UseFormSetValue,
} from 'react-hook-form';
import { Note, motionEasing, variables } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { NumberInput } from 'src/components/suite/NumberInput';
import { getInputState, getFeeUnits, isInteger } from '@suite-common/wallet-utils';
import { ETH_DEFAULT_GAS_LIMIT } from '@suite-common/wallet-constants';
import { FeeInfo } from 'src/types/wallet/sendForm';
import { FormState } from '@suite-common/wallet-types';
import { NetworkType } from '@suite-common/wallet-config';
import { useTranslation } from 'src/hooks/suite';
import { InputError } from '../InputError';
import { validateDecimals } from 'src/utils/suite/validation';
import { motion } from 'framer-motion';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    gap: 10px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        flex-direction: column;
    }
`;

const FeeInput = styled(NumberInput)`
    input {
        /* until the elevation context is implemented */
        background: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation1};
    }
`;

const Units = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const StyledNote = styled(Note)`
    text-align: left;
`;

const FEE_PER_UNIT = 'feePerUnit';
const FEE_LIMIT = 'feeLimit';

interface CustomFeeProps<TFieldValues extends FormState> {
    networkType: NetworkType;
    feeInfo: FeeInfo;
    errors: FieldErrors<TFieldValues>;
    register: UseFormRegister<TFieldValues>;
    control: Control;
    setValue: UseFormSetValue<TFieldValues>;
    getValues: UseFormGetValues<TFieldValues>;
    changeFeeLimit?: (value: string) => void;
    composedFeePerByte: string;
}

export const CustomFee = <TFieldValues extends FormState>({
    networkType,
    feeInfo,
    register,
    control,
    changeFeeLimit,
    composedFeePerByte,
    ...props
}: CustomFeeProps<TFieldValues>) => {
    const { translationString } = useTranslation();

    // Type assertion allowing to make the component reusable, see https://stackoverflow.com/a/73624072.
    const { getValues, setValue } = props as unknown as UseFormReturn<FormState>;
    const errors = props.errors as unknown as FieldErrors<FormState>;

    const { maxFee, minFee } = feeInfo;

    const feePerUnitValue = getValues(FEE_PER_UNIT);
    const feeLimitValue = getValues(FEE_LIMIT);
    const feeUnits = getFeeUnits(networkType);
    const estimatedFeeLimit = getValues('estimatedFeeLimit') || ETH_DEFAULT_GAS_LIMIT;

    const feePerUnitError = errors.feePerUnit;
    const feeLimitError = errors.feeLimit;

    const useFeeLimit = networkType === 'ethereum';
    const isComposedFeeRateDifferent =
        !feePerUnitError && composedFeePerByte && feePerUnitValue !== composedFeePerByte;
    let feeDifferenceWarning;
    if (isComposedFeeRateDifferent && networkType === 'bitcoin') {
        const baseFee = getValues('baseFee');
        feeDifferenceWarning = (
            <Translation
                id={baseFee ? 'TR_FEE_ROUNDING_BASEFEE_WARNING' : 'TR_FEE_ROUNDING_DEFAULT_WARNING'}
                values={{
                    feeRate: (
                        <>
                            <strong>{composedFeePerByte}</strong> {feeUnits}
                        </>
                    ),
                }}
            />
        );
    }

    const sharedRules = {
        required: translationString('CUSTOM_FEE_IS_NOT_SET'),
        // allow decimals in ETH since GWEI is not a satoshi
        validate: (value: string) => {
            if (['bitcoin', 'ethereum'].includes(networkType) && !isInteger(value)) {
                return translationString('CUSTOM_FEE_IS_NOT_INTEGER');
            }
        },
    };
    const feeLimitRules = {
        ...sharedRules,
        validate: {
            ...sharedRules.validate,
            feeLimit: (value: string) => {
                const feeBig = new BigNumber(value);
                if (feeBig.lt(estimatedFeeLimit)) {
                    return translationString('CUSTOM_FEE_LIMIT_BELOW_RECOMMENDED');
                }
            },
        },
    };
    const feeRules = {
        ...sharedRules,
        validate: {
            ...sharedRules.validate,
            bitcoinDecimalsLimit: validateDecimals(translationString, {
                decimals: 2,
                except: networkType !== 'bitcoin',
            }),
            // GWEI: 9 decimal places
            ethereumDecimalsLimit: validateDecimals(translationString, {
                decimals: 2,
                except: networkType !== 'ethereum',
            }),
            range: (value: string) => {
                const feeBig = new BigNumber(value);
                if (feeBig.isGreaterThan(maxFee) || feeBig.isLessThan(minFee)) {
                    return translationString('CUSTOM_FEE_NOT_IN_RANGE', { minFee, maxFee });
                }
            },
        },
    };

    const feeLimitValidationProps = {
        onClick: () =>
            setValue(FEE_LIMIT, estimatedFeeLimit, {
                shouldValidate: true,
            }),
        text: translationString('CUSTOM_FEE_LIMIT_USE_RECOMMENDED'),
    };
    const validationButtonProps =
        feeLimitError?.type === 'feeLimit' ? feeLimitValidationProps : undefined;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{
                opacity: { duration: 0.15, ease: motionEasing.transition },
                height: { duration: 0.2, ease: motionEasing.transition },
                marginTop: { duration: 0.25, ease: motionEasing.transition },
            }}
        >
            <Wrapper>
                {useFeeLimit ? (
                    <FeeInput
                        control={control}
                        label={<Translation id="TR_GAS_LIMIT" />}
                        inputState={getInputState(feeLimitError, feeLimitValue)}
                        name={FEE_LIMIT}
                        data-test={FEE_LIMIT}
                        onChange={changeFeeLimit}
                        rules={feeLimitRules}
                        bottomText={
                            feeLimitError?.message ? (
                                <InputError
                                    message={feeLimitError?.message}
                                    button={validationButtonProps}
                                />
                            ) : null
                        }
                    />
                ) : (
                    <input type="hidden" {...register(FEE_LIMIT as FieldPath<TFieldValues>)} />
                )}
                <FeeInput
                    control={control}
                    label={useFeeLimit ? <Translation id="TR_GAS_PRICE" /> : undefined}
                    inputState={getInputState(feePerUnitError, feePerUnitValue)}
                    innerAddon={<Units>{feeUnits}</Units>}
                    name={FEE_PER_UNIT}
                    data-test={FEE_PER_UNIT}
                    rules={feeRules}
                    bottomText={feePerUnitError?.message || null}
                />
            </Wrapper>

            {feeDifferenceWarning && <StyledNote>{feeDifferenceWarning}</StyledNote>}
        </motion.div>
    );
};
