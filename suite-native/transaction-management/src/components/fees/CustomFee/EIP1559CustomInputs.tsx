import { HStack, Text } from '@suite-native/atoms';
import { TextInputField } from '@suite-native/forms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { type FeeLevel } from '@trezor/connect';

import { type FeesFormValues } from '../../../feesFormSchema';
import { MAX_FEE_PER_GAS_FIELD_NAME, MAX_PRIORITY_FEE_PER_GAS_FIELD_NAME } from '../../../presets';

const getBaseFeePerGas = (feeLevel: FeeLevel, feeUnits: string) => {
    if (!feeLevel?.baseFeePerGas) {
        return '';
    }

    return `${Number(feeLevel?.baseFeePerGas).toFixed(4)} ${feeUnits}`;
};

type EIP1559CustomInputsProps = {
    handleFieldChangeValue: (
        fieldName: keyof FeesFormValues,
        transformer: 'crypto' | 'integer',
    ) => (value: string) => void;
    feeUnits: string;
    feeLevel: FeeLevel;
};

export const EIP1559CustomInputs = ({
    handleFieldChangeValue,
    feeUnits,
    feeLevel,
}: EIP1559CustomInputsProps) => {
    const { translate } = useTranslate();

    return (
        <>
            <TextInputField
                label={translate(
                    'transactionManagement.fees.custom.bottomSheet.label.maxFeePerGas',
                )}
                name={MAX_FEE_PER_GAS_FIELD_NAME}
                testID={`@transactionManagement/${MAX_FEE_PER_GAS_FIELD_NAME}-input`}
                accessibilityLabel="address input"
                keyboardType="decimal-pad"
                rightIcon={<Text color="contentSecondary">{feeUnits}</Text>}
                onChangeText={handleFieldChangeValue(MAX_FEE_PER_GAS_FIELD_NAME, 'crypto')}
            />
            <HStack paddingLeft="sp12" alignItems="center" spacing="sp4" paddingBottom="sp8">
                <Icon name="gasPump" size="medium" color="contentSecondary" />
                <Text variant="body-xs" color="contentSecondary">
                    <Translation
                        id="transactionManagement.fees.custom.bottomSheet.currentBaseFeeEthereum"
                        values={{
                            baseFee: getBaseFeePerGas(feeLevel, feeUnits),
                        }}
                    />
                </Text>
            </HStack>
            <TextInputField
                label={translate(
                    'transactionManagement.fees.custom.bottomSheet.label.maxPriorityFeePerGas',
                )}
                name={MAX_PRIORITY_FEE_PER_GAS_FIELD_NAME}
                testID={`@transactionManagement/${MAX_PRIORITY_FEE_PER_GAS_FIELD_NAME}-input`}
                accessibilityLabel="address input"
                rightIcon={<Text color="contentSecondary">{feeUnits}</Text>}
                keyboardType="decimal-pad"
                onChangeText={handleFieldChangeValue(MAX_PRIORITY_FEE_PER_GAS_FIELD_NAME, 'crypto')}
            />
        </>
    );
};
