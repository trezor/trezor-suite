import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { FeesRootState, selectConvertedNetworkFeeInfo } from '@suite-common/wallet-core';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { Hint, Text, VStack } from '@suite-native/atoms';
import { TextInputField, useFormContext } from '@suite-native/forms';
import { integerTransformer, useAmountInputTransformers } from '@suite-native/helpers';
import { Translation, useTranslate } from '@suite-native/intl';
import { useDebounce } from '@trezor/react-utils';

import { FeesFormValues } from '../../../feesFormSchema';

export type CustomFeeInputsProps = {
    symbol: NetworkSymbol;
};

export const CustomFeeInputs = ({ symbol }: CustomFeeInputsProps) => {
    const { translate } = useTranslate();
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, symbol),
    );
    const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);
    const debounce = useDebounce();
    const {
        formState: { errors },
        setValue,
        trigger,
    } = useFormContext<FeesFormValues>();

    const customFeeLimitName = 'customFeeLimit';
    const feePerUnitFieldName = 'customFeePerUnit';
    const hasFeePerByteError = G.isNotNullable(errors[feePerUnitFieldName]);

    const networkType = getNetworkType(symbol);
    const feeUnits = getFeeUnits(networkType);
    const formattedFeePerUnit = `${feeInfo?.minFee} ${feeUnits}`;

    const handleFieldChangeValue =
        (fieldName: keyof FeesFormValues, transformer: (value: string) => string) =>
        (value: string) => {
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
                    name={customFeeLimitName}
                    testID={`@transactionManagement/${customFeeLimitName}-input`}
                    accessibilityLabel="address input"
                    keyboardType="number-pad"
                    onChangeText={handleFieldChangeValue(customFeeLimitName, integerTransformer)}
                />
            )}
            <TextInputField
                label={
                    networkType === 'ethereum'
                        ? translate('transactionManagement.fees.custom.bottomSheet.label.gasPrice')
                        : translate('transactionManagement.fees.custom.bottomSheet.label.feeRate')
                }
                name={feePerUnitFieldName}
                testID={`@transactionManagement/${feePerUnitFieldName}-input`}
                accessibilityLabel="address input"
                keyboardType="number-pad"
                rightIcon={<Text color="textSubdued">{feeUnits}</Text>}
                onChangeText={handleFieldChangeValue(feePerUnitFieldName, cryptoAmountTransformer)}
            />
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
