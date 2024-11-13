import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { FeesRootState, selectNetworkFeeInfo } from '@suite-common/wallet-core';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { VStack, Hint, Text } from '@suite-native/atoms';
import { TextInputField, useFormContext } from '@suite-native/forms';
import { useTranslate, Translation } from '@suite-native/intl';

import { useSendAmountTransformers, integerTransformer } from '../hooks/useSendAmountTransformers';
import { SendFeesFormValues } from '../sendFeesFormSchema';

type CustomFeeInputsProps = {
    networkSymbol: NetworkSymbol;
};

export const CustomFeeInputs = ({ networkSymbol }: CustomFeeInputsProps) => {
    const { translate } = useTranslate();
    const feeInfo = useSelector((state: FeesRootState) => selectNetworkFeeInfo(state, 'btc'));
    const { cryptoAmountTransformer } = useSendAmountTransformers(networkSymbol!);

    const {
        formState: { errors },
    } = useFormContext<SendFeesFormValues>();
    const feePerUnitFieldName = 'customFeePerUnit';
    const hasFeePerByteError = G.isNotNullable(errors[feePerUnitFieldName]);

    const networkType = getNetworkType(networkSymbol);
    const feeUnits = getFeeUnits(networkType);
    const formattedFeePerUnit = `${feeInfo?.minFee} ${feeUnits}`;

    return (
        <VStack spacing="sp8">
            {networkType === 'ethereum' && (
                <TextInputField
                    label={translate('moduleSend.fees.custom.bottomSheet.label.gasLimit')}
                    name="customFeeLimit"
                    testID="customFeeLimit"
                    accessibilityLabel="address input"
                    keyboardType="number-pad"
                    valueTransformer={integerTransformer}
                />
            )}
            <TextInputField
                label={
                    networkType === 'ethereum'
                        ? translate('moduleSend.fees.custom.bottomSheet.label.gasPrice')
                        : translate('moduleSend.fees.custom.bottomSheet.label.feeRate')
                }
                name={feePerUnitFieldName}
                testID={feePerUnitFieldName}
                accessibilityLabel="address input"
                keyboardType="number-pad"
                rightIcon={<Text color="textSubdued">{feeUnits}</Text>}
                valueTransformer={cryptoAmountTransformer}
            />
            {networkType !== 'ethereum' && !hasFeePerByteError && (
                <Hint variant="info">
                    <Translation
                        id="moduleSend.fees.custom.bottomSheet.minimumLabel"
                        values={{ feePerUnit: formattedFeePerUnit }}
                    />
                </Hint>
            )}
        </VStack>
    );
};
