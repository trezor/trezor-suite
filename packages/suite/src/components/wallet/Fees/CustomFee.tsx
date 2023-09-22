import BigNumber from 'bignumber.js';
import styled, { css } from 'styled-components';
import {
    Control,
    FieldErrors,
    FieldPath,
    UseFormGetValues,
    UseFormRegister,
    UseFormReturn,
    UseFormSetValue,
} from 'react-hook-form';
import { Note, variables } from '@trezor/components';
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

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    gap: 10px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        flex-direction: column;
    }
`;

const Col = styled.div<{ singleCol?: boolean }>`
    display: flex;
    flex: 1;

    ${({ singleCol }) =>
        singleCol &&
        css`
            max-width: 300px;

            ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
                max-width: 100%;
            }
        `}
`;

const StyledNumberInput = styled(NumberInput)`
    display: flex;
    flex: 1;
    width: 100%;
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
        <>
            <Wrapper>
                {useFeeLimit ? (
                    <Col>
                        <StyledNumberInput
                            control={control}
                            label={<Translation id="TR_GAS_LIMIT" />}
                            size="small"
                            inputState={getInputState(feeLimitError, feeLimitValue)}
                            name={FEE_LIMIT}
                            data-test={FEE_LIMIT}
                            onChange={changeFeeLimit}
                            rules={feeLimitRules}
                            bottomText={
                                <InputError
                                    message={feeLimitError?.message}
                                    button={validationButtonProps}
                                />
                            }
                        />
                    </Col>
                ) : (
                    <input type="hidden" {...register(FEE_LIMIT as FieldPath<TFieldValues>)} />
                )}
                <Col singleCol={!useFeeLimit}>
                    <StyledNumberInput
                        control={control}
                        noTopLabel={!useFeeLimit}
                        label={useFeeLimit ? <Translation id="TR_GAS_PRICE" /> : undefined}
                        size="small"
                        inputState={getInputState(feePerUnitError, feePerUnitValue)}
                        innerAddon={<Units>{feeUnits}</Units>}
                        name={FEE_PER_UNIT}
                        data-test={FEE_PER_UNIT}
                        rules={feeRules}
                        bottomText={feePerUnitError?.message || null}
                    />
                </Col>
            </Wrapper>

            {feeDifferenceWarning && <StyledNote>{feeDifferenceWarning}</StyledNote>}
        </>
    );
};
