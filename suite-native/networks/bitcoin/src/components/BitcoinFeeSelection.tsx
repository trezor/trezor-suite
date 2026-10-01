import { useState } from 'react';

import { SegmentedControl, Text, VStack } from '@suite-native/atoms';

const feeRateOptions = [
    { label: 'Economy', value: '1' },
    { label: 'Standard', value: '5' },
    { label: 'Fast', value: '10' },
];

export const BitcoinFeeSelection = () => {
    const [feeRate, setFeeRate] = useState('5');

    return (
        <VStack spacing={12}>
            <Text variant="headline-sm">Bitcoin fee rate</Text>
            <SegmentedControl
                options={feeRateOptions}
                selectedValue={feeRate}
                onValueChange={setFeeRate}
            />
            <Text>Fee rate: {feeRate} sat/vB</Text>
        </VStack>
    );
};
