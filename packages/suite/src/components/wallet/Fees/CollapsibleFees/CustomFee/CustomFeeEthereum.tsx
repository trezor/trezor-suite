import { useEffect } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { type FormState } from '@suite-common/wallet-types';
import { isEip1559 } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { InputError } from 'src/components/wallet';
import { validateDecimals } from 'src/utils/suite/validation';

import { type CustomFeeBasicProps } from './CustomFeeBasicProps';
import { FEE_LIMIT, FEE_PER_UNIT } from './constants';
import { useFeesContext } from '../../context/FeesContext';

const MAX_FEE_PER_GAS = 'maxFeePerGas' satisfies keyof FormState;
const MAX_PRIORITY_FEE_PER_GAS = 'maxPriorityFeePerGas' satisfies keyof FormState;

export const CustomFeeEthereum = ({
    translationString,
    feeUnits,
    sharedRules,
}: Omit<CustomFeeBasicProps, 'composedFeePerByte'>) => {
    const { feeInfo, networkType } = useFeesContext();
    const locale = useSelector(selectLanguage);

    const { control, getValues, setValue, trigger, watch } = useFormContext<FormState>();

    const { errors } = useFormState<FormState>();

    const { maxFee, minFee, levels, minPriorityFee } = feeInfo;

    // Use `watch` (not `getValues`) so the cross-field `trigger` effects re-run and validate closures see fresh values.
    const customMaxFeePerGas = watch(MAX_FEE_PER_GAS);
    const customMaxPriorityFeePerGas = watch(MAX_PRIORITY_FEE_PER_GAS);

    useEffect(() => {
        trigger(MAX_FEE_PER_GAS);
        trigger(MAX_PRIORITY_FEE_PER_GAS);
    }, [customMaxPriorityFeePerGas, customMaxFeePerGas, trigger]);

    const gasLimitRules = {
        required: translationString('GAS_LIMIT_IS_NOT_SET'),
        validate: {
            ...sharedRules.validate,
            feeLimit: (value: string) => {
                const estimatedFeeLimit = getValues('estimatedFeeLimit');
                const feeBig = new BigNumber(value);
                if (estimatedFeeLimit && feeBig.lt(estimatedFeeLimit)) {
                    return translationString('CUSTOM_FEE_LIMIT_BELOW_RECOMMENDED');
                }
            },
        },
    };

    const gasLimitValidationProps = {
        onClick: () => {
            const estimatedFeeLimit = getValues('estimatedFeeLimit');

            if (!estimatedFeeLimit) return;

            setValue(FEE_LIMIT, estimatedFeeLimit, { shouldValidate: true });
        },
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

    const recommendedMaxFeePerGas = levels.find(level => level.label === 'normal')?.maxFeePerGas;
    const maxFeePerGasValidationProps = {
        onClick: () => {
            if (!recommendedMaxFeePerGas) return;

            setValue(MAX_FEE_PER_GAS, recommendedMaxFeePerGas, { shouldValidate: true });
        },
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
        <Text intent="neutral" priority="secondary" typographyStyle="body-xs">
            {feeUnits}
        </Text>
    );

    return (
        <>
            <NumberInput
                label={<Translation id="TR_GAS_LIMIT" />}
                locale={locale}
                control={control}
                hasError={!!errors.feeLimit}
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
                        hasError={!!errors.maxFeePerGas}
                        rightContent={gweiInputAddon}
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
                        hasError={!!errors.maxPriorityFeePerGas}
                        rightContent={gweiInputAddon}
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
                    hasError={!!errors.feePerUnit}
                    rightContent={gweiInputAddon}
                    name={FEE_PER_UNIT}
                    data-testid={FEE_PER_UNIT}
                    rules={gasPriceRules}
                    bottomText={errors.feePerUnit?.message || null}
                />
            )}
        </>
    );
};
