import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { SegmentedControl, Text, VStack } from '@suite-native/atoms';

import { bitcoinActions, selectBitcoinSendFormFeeRate } from '../bitcoinSlice';

const feeRateOptions = [
    { label: 'Economy', value: '1' },
    { label: 'Standard', value: '5' },
    { label: 'Fast', value: '10' },
];

export const BitcoinFeeSelection = () => {
    const feeRate = useSelector(selectBitcoinSendFormFeeRate);
    const { dispatch } = useServices(injectDispatch);

    const handleFeeRateChange = (value: string) => {
        dispatch(bitcoinActions.setSendFormFeeRate(value));
    };

    return (
        <VStack spacing={12}>
            <Text variant="headline-sm">Bitcoin fee rate</Text>
            <SegmentedControl
                options={feeRateOptions}
                selectedValue={feeRate}
                onValueChange={handleFeeRateChange}
            />
            <Text>Fee rate: {feeRate} sat/vB</Text>
        </VStack>
    );
};
