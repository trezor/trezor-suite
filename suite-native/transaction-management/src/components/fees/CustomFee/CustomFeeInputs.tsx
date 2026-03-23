import { useSelector } from 'react-redux';

import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    type FeesRootState,
    selectConvertedNetworkFeeInfo,
    selectIsEip1559Fee,
} from '@suite-common/wallet-core';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { Hint, Text, VStack } from '@suite-native/atoms';
import { TextInputField, useFormContext } from '@suite-native/forms';
import { decimalTransformer, integerTransformer } from '@suite-native/helpers';
import { Translation, useTranslate } from '@suite-native/intl';
import { useDebounce } from '@trezor/react-utils';
import { isNotNullOrUndefined } from '@trezor/utils';

import { EIP1559CustomInputs } from './EIP1559CustomInputs';
import { type FeesFormValues } from '../../../feesFormSchema';
import { FEE_LIMIT_FIELD_NAME, FEE_PER_UNIT_FIELD_NAME } from '../../../presets';

export type CustomFeeInputsProps = {
    symbol: NetworkSymbol;
};

export const CustomFeeInputs = ({ symbol }: CustomFeeInputsProps) => {
    const { translate } = useTranslate();
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, symbol),
    );

    const isEip1559Fee = useSelector((state: FeesRootState) => selectIsEip1559Fee(state, symbol));
    const debounce = useDebounce();
    const {
        formState: { errors },
        setValue,
        trigger,
    } = useFormContext<FeesFormValues>();

    const hasFeePerByteError = isNotNullOrUndefined(errors[FEE_PER_UNIT_FIELD_NAME]);

    const networkType = getNetworkType(symbol);
    const feeUnits = getFeeUnits(networkType);
    const formattedFeePerUnit = `${feeInfo?.minFee} ${feeUnits}`;

    const handleFieldChangeValue =
        (fieldName: keyof FeesFormValues, transformerType: 'crypto' | 'integer') =>
        (value: string) => {
            const transformer =
                transformerType === 'crypto' ? decimalTransformer : integerTransformer;
            const transformedValue = transformer(value);
            setValue(fieldName, transformedValue);

            debounce(() => trigger(fieldName));
        };

    return (
        <VStack spacing="sp8">
            {networkType === 'ethereum' && (
                <TextInputField
                    label={translate(
                        'transactionManagement.fees.custom.bottomSheet.label.gasLimit',
                    )}
                    name={FEE_LIMIT_FIELD_NAME}
                    testID={`@transactionManagement/${FEE_LIMIT_FIELD_NAME}-input`}
                    accessibilityLabel="address input"
                    keyboardType="number-pad"
                    onChangeText={handleFieldChangeValue(FEE_LIMIT_FIELD_NAME, 'integer')}
                />
            )}
            {isEip1559Fee && feeInfo?.levels?.[0] ? (
                <EIP1559CustomInputs
                    feeLevel={feeInfo.levels[0]}
                    feeUnits={feeUnits}
                    handleFieldChangeValue={handleFieldChangeValue}
                />
            ) : (
                <TextInputField
                    label={
                        networkType === 'ethereum'
                            ? translate(
                                  'transactionManagement.fees.custom.bottomSheet.label.gasPrice',
                              )
                            : translate(
                                  'transactionManagement.fees.custom.bottomSheet.label.feeRate',
                              )
                    }
                    name={FEE_PER_UNIT_FIELD_NAME}
                    testID={`@transactionManagement/${FEE_PER_UNIT_FIELD_NAME}-input`}
                    accessibilityLabel="address input"
                    keyboardType={networkType === 'bitcoin' ? 'decimal-pad' : 'number-pad'}
                    rightIcon={<Text color="textSubdued">{feeUnits}</Text>}
                    onChangeText={handleFieldChangeValue(FEE_PER_UNIT_FIELD_NAME, 'crypto')}
                />
            )}
            {networkType !== 'ethereum' && !hasFeePerByteError && (
                <Hint variant="info">
                    <Translation
                        id="transactionManagement.fees.custom.bottomSheet.minimumLabel"
                        values={{ feePerUnit: formattedFeePerUnit }}
                    />
                </Hint>
            )}
        </VStack>
    );
};
