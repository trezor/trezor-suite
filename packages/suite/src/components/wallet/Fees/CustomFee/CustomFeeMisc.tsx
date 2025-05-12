import { FieldErrors, FieldPath, UseFormReturn } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { FormState } from '@suite-common/wallet-types';
import { getInputState } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import { validateDecimals } from 'src/utils/suite/validation';

import { CustomFeeBasicProps, FEE_LIMIT, FEE_PER_UNIT } from './CustomFee';
import { DustPreventionNotice } from '../DustPreventionNotice';

export const CustomFeeMisc = <TFieldValues extends FormState>({
    networkType,
    feeInfo,
    register,
    control,
    composedFeePerByte,
    translationString,
    feeUnits,
    sharedRules,
    ...props
}: CustomFeeBasicProps<TFieldValues>) => {
    const locale = useSelector(selectLanguage);

    // Type assertion allowing to make the component reusable, see https://stackoverflow.com/a/73624072.
    const { getValues } = props as unknown as UseFormReturn<FormState>;
    const errors = props.errors as unknown as FieldErrors<FormState>;

    const { maxFee, minFee } = feeInfo;

    const feePerUnitValue = getValues(FEE_PER_UNIT);
    const feePerUnitError = errors.feePerUnit;

    const isDustPreventionRelevant = feePerUnitError === undefined && networkType === 'bitcoin';

    const feeRules = {
        ...sharedRules,
        validate: {
            ...sharedRules.validate,
            bitcoinDecimalsLimit: validateDecimals(translationString, {
                decimals: 2,
                except: networkType !== 'bitcoin',
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

    return (
        <>
            <input type="hidden" {...register(FEE_LIMIT as FieldPath<TFieldValues>)} />
            <NumberInput
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
            {isDustPreventionRelevant && (
                <DustPreventionNotice
                    chosenFeePerByte={feePerUnitValue}
                    composedFeePerByte={composedFeePerByte}
                    baseFee={getValues('baseFee')}
                    feeUnits={feeUnits}
                />
            )}
        </>
    );
};
