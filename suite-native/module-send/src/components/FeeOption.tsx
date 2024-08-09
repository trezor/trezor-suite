import { useContext } from 'react';
import { TouchableOpacity } from 'react-native';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { Text, HStack, VStack, Radio } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter, CryptoAmountFormatter } from '@suite-native/formatters';
import { FormContext } from '@suite-native/forms';
import { TxKeyPath, Translation } from '@suite-native/intl';

import { SendFeesFormValues } from '../sendFeesFormSchema';
import { NativeSupportedFeeLevel } from '../types';

const feeLabelsMap = {
    economy: {
        label: 'moduleSend.fees.levels.low.label',
        timeEstimate: 'moduleSend.fees.levels.low.timeEstimate',
    },
    normal: {
        label: 'moduleSend.fees.levels.medium.label',
        timeEstimate: 'moduleSend.fees.levels.medium.timeEstimate',
    },
    high: {
        label: 'moduleSend.fees.levels.high.label',
        timeEstimate: 'moduleSend.fees.levels.high.timeEstimate',
    },
} as const satisfies Record<NativeSupportedFeeLevel, { label: TxKeyPath; timeEstimate: TxKeyPath }>;

export const FeeOption = ({
    feeKey,
    feeLevel,
    networkSymbol,
}: {
    feeKey: SendFeesFormValues['feeLevel'];
    feeLevel: GeneralPrecomposedTransactionFinal;
    networkSymbol: NetworkSymbol;
}) => {
    const { watch, setValue } = useContext(FormContext);
    const selectedLevel = watch('feeLevel');

    const isChecked = selectedLevel === feeKey;

    const { label, timeEstimate } = feeLabelsMap[feeKey];

    const handleSelectFeeLevel = () => {
        setValue('feeLevel', feeKey, {
            shouldValidate: true,
        });
    };

    return (
        <TouchableOpacity onPress={handleSelectFeeLevel}>
            <HStack spacing="large" justifyContent="space-between" flex={1} alignItems="center">
                <VStack alignItems="flex-start" spacing="extraSmall">
                    <Text variant="highlight">
                        <Translation id={label} />
                    </Text>
                    <Text variant="hint" color="textSubdued">
                        <Translation id={timeEstimate} />
                    </Text>
                </VStack>
                <VStack flex={1} alignItems="flex-end" spacing="extraSmall">
                    <CryptoToFiatAmountFormatter
                        variant="body"
                        color="textDefault"
                        value={feeLevel.fee}
                        network={networkSymbol}
                    />
                    <CryptoAmountFormatter
                        variant="hint"
                        color="textSubdued"
                        value={feeLevel.fee}
                        network={networkSymbol}
                        isBalance={false}
                    />
                </VStack>
                <Radio
                    isChecked={isChecked}
                    value={feeKey}
                    onPress={handleSelectFeeLevel}
                    testID={`@send/fees-level-${feeKey}`}
                />
            </HStack>
        </TouchableOpacity>
    );
};
