import { type FieldPath, useFormContext, useFormState } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { selectLanguage } from '@suite/settings';
import { type FormState } from '@suite-common/wallet-types';
import { Text } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { validateDecimals } from 'src/utils/suite/validation';

import { type CustomFeeBasicProps } from './CustomFeeBasicProps';
import { FEE_LIMIT, FEE_PER_UNIT } from './constants';
import { DustPreventionNotice } from '../../DustPreventionNotice';
import { useFeesContext } from '../../context/FeesContext';

export const CustomFeeMisc = ({
    composedFeePerByte,
    translationString,
    feeUnits,
    sharedRules,
}: CustomFeeBasicProps) => {
    const { networkType, feeInfo } = useFeesContext();
    const locale = useSelector(selectLanguage);

    const { control, getValues, register } = useFormContext<FormState>();
    const { errors } = useFormState<FormState>();

    const feePerUnitValue = getValues(FEE_PER_UNIT);
    const feePerUnitError = errors.feePerUnit;

    const isDustPreventionRelevant = feePerUnitError === undefined && networkType === 'bitcoin';

    const { maxFee, minFee } = feeInfo;
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
            <input type="hidden" {...register(FEE_LIMIT satisfies FieldPath<FormState>)} />
            <NumberInput
                locale={locale}
                control={control}
                hasError={!!feePerUnitError}
                rightContent={
                    <Text intent="neutral" priority="secondary" typographyStyle="body-xs">
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
                    feeUnits={feeUnits}
                />
            )}
        </>
    );
};
