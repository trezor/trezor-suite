import { useEffect } from 'react';
import { FieldErrors, UseFormReturn } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { FormState } from '@suite-common/wallet-types';
import { getInputState, isEip1559 } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { Translation } from 'src/components/suite';
import { InputError } from 'src/components/wallet';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import { validateDecimals } from 'src/utils/suite/validation';

import { CustomFeeBasicProps, FEE_LIMIT, FEE_PER_UNIT } from './CustomFee';

const MAX_FEE_PER_GAS = 'maxFeePerGas';
const MAX_PRIORITY_FEE_PER_GAS = 'maxPriorityFeePerGas';

export const CustomFeeEthereum = <TFieldValues extends FormState>({
    networkType,
    feeInfo,
    control,
    translationString,
    feeUnits,
    sharedRules,
    ...props
}: Omit<CustomFeeBasicProps<TFieldValues>, 'composedFeePerByte'>) => {
    const locale = useSelector(selectLanguage);

    // Type assertion allowing to make the component reusable, see https://stackoverflow.com/a/73624072.
    const { getValues, setValue, trigger } = props as unknown as UseFormReturn<FormState>;
    const errors = props.errors as unknown as FieldErrors<FormState>;

    const { maxFee, minFee, levels, minPriorityFee } = feeInfo;

    const estimatedFeeLimit = getValues('estimatedFeeLimit');
    const customMaxFeePerGas = getValues('maxFeePerGas');
    const customMaxPriorityFeePerGas = getValues('maxPriorityFeePerGas');

    useEffect(() => {
        if (trigger) {
            trigger(MAX_PRIORITY_FEE_PER_GAS);
        }
    }, [customMaxFeePerGas, trigger]);

    useEffect(() => {
        if (trigger) {
            trigger(MAX_FEE_PER_GAS);
        }
    }, [customMaxPriorityFeePerGas, trigger]);

    const recommendedMaxFeePerGas = levels.find(level => level.label === 'normal')?.maxFeePerGas;

    const gasLimitRules = {
        required: translationString('GAS_LIMIT_IS_NOT_SET'),
        validate: {
            ...sharedRules.validate,
            feeLimit: (value: string) => {
                const feeBig = new BigNumber(value);
                if (estimatedFeeLimit && feeBig.lt(estimatedFeeLimit)) {
                    return translationString('CUSTOM_FEE_LIMIT_BELOW_RECOMMENDED');
                }
            },
        },
    };

    const gasLimitValidationProps = {
        onClick: () =>
            estimatedFeeLimit &&
            setValue(FEE_LIMIT, estimatedFeeLimit, {
                shouldValidate: true,
            }),
        text: translationString('CUSTOM_FEE_USE_RECOMMENDED'),
    };

    const gasLimitValidationButtonProps =
        errors.feeLimit?.type === 'feeLimit' ? gasLimitValidationProps : undefined;

    const gasPriceRules = {
        ...sharedRules,
        validate: {
            ...sharedRules.validate,
            ethereumDecimalsLimit: validateDecimals(translationString, {
                decimals: 9,
                except: networkType !== 'ethereum',
            }),
            range: (value: string) => {
                const customFee = new BigNumber(value);

                if (customFee.isGreaterThan(maxFee) || customFee.isLessThan(minFee)) {
                    return translationString('CUSTOM_FEE_NOT_IN_RANGE', {
                        minFee: new BigNumber(minFee).toString(),
                        maxFee: new BigNumber(maxFee).toString(),
                    });
                }
            },
        },
    };

    const maxFeePerGasRules = {
        ...sharedRules,
        validate: {
            ...sharedRules.validate,
            ethereumDecimalsLimit: gasPriceRules.validate.ethereumDecimalsLimit,
            customMaxFeePerGasRange: (value: string) => {
                const customMaxFeePerGas = new BigNumber(value);

                if (
                    customMaxFeePerGas.isGreaterThan(maxFee) ||
                    customMaxFeePerGas.isLessThan(minFee)
                ) {
                    return translationString('CUSTOM_FEE_NOT_IN_RANGE', {
                        minFee: new BigNumber(minFee).toString(),
                        maxFee: new BigNumber(maxFee).toString(),
                    });
                }
            },
            customMaxFeePerGasLowerThanPriority: (value: string) => {
                const customMaxFeePerGas = new BigNumber(value);

                if (
                    customMaxPriorityFeePerGas &&
                    customMaxFeePerGas.isLessThan(customMaxPriorityFeePerGas)
                ) {
                    return translationString('CUSTOM_MAX_LOWER_THAN_PRIORITY');
                }
            },
        },
    };

    const maxFeePerGasValidationProps = {
        onClick: () =>
            recommendedMaxFeePerGas &&
            setValue(MAX_FEE_PER_GAS, recommendedMaxFeePerGas, {
                shouldValidate: true,
            }),
        text: translationString('CUSTOM_FEE_USE_RECOMMENDED'),
    };

    const maxFeePerGasValidationButtonProps =
        errors.maxFeePerGas?.type === 'customMaxFeePerGasRange'
            ? maxFeePerGasValidationProps
            : undefined;

    const maxPriorityFeePerGasRules = {
        validate: {
            ethereumDecimalsLimit: gasPriceRules.validate.ethereumDecimalsLimit,
            customPriorityFeePerGas: (value: string) => {
                const customPriorityFeePerGas = new BigNumber(value);

                if (customMaxFeePerGas && customPriorityFeePerGas.gt(customMaxFeePerGas)) {
                    return translationString('CUSTOM_PRIORITY_HIGHER_THAN_MAX');
                }

                if (customPriorityFeePerGas.lt(minPriorityFee)) {
                    return translationString('CUSTOM_MAX_PRIORITY_FEE_NOT_IN_RANGE', {
                        minPriorityFee: new BigNumber(minPriorityFee).toString(),
                    });
                }
            },
        },
    };

    const gweiInputAddon = (
        <Text variant="tertiary" typographyStyle="label">
            {feeUnits}
        </Text>
    );

    return (
        <>
            <NumberInput
                label={<Translation id="TR_GAS_LIMIT" />}
                locale={locale}
                control={control}
                inputState={getInputState(errors.feeLimit)}
                name={FEE_LIMIT}
                data-testid={FEE_LIMIT}
                bottomText={
                    errors.feeLimit?.message && (
                        <InputError
                            message={errors.feeLimit?.message}
                            buttonProps={gasLimitValidationButtonProps}
                        />
                    )
                }
                rules={gasLimitRules}
            />
            {levels?.length && isEip1559(levels[0]) ? (
                <>
                    <NumberInput
                        label={<Translation id="TR_MAX_FEE_PER_GAS" />}
                        locale={locale}
                        control={control}
                        inputState={getInputState(errors.maxFeePerGas)}
                        innerAddon={gweiInputAddon}
                        name={MAX_FEE_PER_GAS}
                        data-testid={MAX_FEE_PER_GAS}
                        rules={maxFeePerGasRules}
                        bottomText={
                            errors.maxFeePerGas?.message && (
                                <InputError
                                    message={errors.maxFeePerGas?.message}
                                    buttonProps={
                                        recommendedMaxFeePerGas
                                            ? maxFeePerGasValidationButtonProps
                                            : undefined
                                    }
                                />
                            )
                        }
                    />
                    <NumberInput
                        label={<Translation id="TR_MAX_PRIORITY_FEE_PER_GAS" />}
                        locale={locale}
                        control={control}
                        inputState={getInputState(errors.maxPriorityFeePerGas)}
                        innerAddon={gweiInputAddon}
                        name={MAX_PRIORITY_FEE_PER_GAS}
                        data-testid={MAX_PRIORITY_FEE_PER_GAS}
                        rules={maxPriorityFeePerGasRules}
                        bottomText={errors.maxPriorityFeePerGas?.message || null}
                    />
                </>
            ) : (
                <NumberInput
                    label={<Translation id="TR_GAS_PRICE" />}
                    locale={locale}
                    control={control}
                    inputState={getInputState(errors.feePerUnit)}
                    innerAddon={gweiInputAddon}
                    name={FEE_PER_UNIT}
                    data-testid={FEE_PER_UNIT}
                    rules={gasPriceRules}
                    bottomText={errors.feePerUnit?.message || null}
                />
            )}
        </>
    );
};
