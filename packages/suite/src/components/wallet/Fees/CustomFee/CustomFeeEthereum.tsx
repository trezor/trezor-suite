import { FieldErrors, UseFormReturn } from 'react-hook-form';

import { FormState } from '@suite-common/wallet-types';
import { getInputState } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { Translation } from 'src/components/suite';
import { InputError } from 'src/components/wallet';
import { validateDecimals } from 'src/utils/suite/validation';

import { CustomFeeBasicProps, FEE_LIMIT, FEE_PER_UNIT } from './CustomFee';

export const CustomFeeEthereum = <TFieldValues extends FormState>({
    networkType,
    feeInfo,
    control,
    locale,
    translationString,
    feeUnits,
    sharedRules,
    ...props
}: CustomFeeBasicProps<TFieldValues>) => {
    // Type assertion allowing to make the component reusable, see https://stackoverflow.com/a/73624072.
    const { getValues, setValue } = props as unknown as UseFormReturn<FormState>;
    const errors = props.errors as unknown as FieldErrors<FormState>;

    const { maxFee, minFee } = feeInfo;

    const estimatedFeeLimit = getValues('estimatedFeeLimit');
    const feePerUnitError = errors.feePerUnit;
    const feeLimitError = errors.feeLimit;

    const feeLimitRules = {
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
    const feeRules = {
        ...sharedRules,
        validate: {
            ...sharedRules.validate,
            // GWEI: 9 decimal places.
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

    const feeLimitValidationProps = {
        onClick: () =>
            estimatedFeeLimit &&
            setValue(FEE_LIMIT, estimatedFeeLimit, {
                shouldValidate: true,
            }),
        text: translationString('CUSTOM_FEE_LIMIT_USE_RECOMMENDED'),
    };

    const feeLimitValidationButtonProps =
        feeLimitError?.type === 'feeLimit' ? feeLimitValidationProps : undefined;

    const gasLimitInput = (
        <NumberInput
            label={<Translation id="TR_GAS_LIMIT" />}
            locale={locale}
            control={control}
            inputState={getInputState(feeLimitError)}
            name={FEE_LIMIT}
            data-testid={FEE_LIMIT}
            bottomText={
                feeLimitError?.message ? (
                    <InputError
                        message={feeLimitError?.message}
                        buttonProps={feeLimitValidationButtonProps}
                    />
                ) : null
            }
            rules={feeLimitRules}
        />
    );

    const legacyEvmInputFields = (
        <NumberInput
            label={<Translation id="TR_GAS_PRICE" />}
            locale={locale}
            control={control}
            inputState={getInputState(feePerUnitError)}
            innerAddon={
                <Text variant="tertiary" typographyStyle="label">
                    {feeUnits}
                </Text>
            }
            name={FEE_PER_UNIT}
            data-testid={FEE_PER_UNIT}
            rules={feeRules}
            bottomText={feePerUnitError?.message || null}
        />
    );

    return (
        <>
            {gasLimitInput}
            {legacyEvmInputFields}
        </>
    );
};
