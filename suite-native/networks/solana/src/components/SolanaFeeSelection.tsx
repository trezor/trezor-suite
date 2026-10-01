import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { HStack, Radio, Text, VStack } from '@suite-native/atoms';

import { selectSolanaSendFormPriorityFee, solanaActions } from '../solanaSlice';

const priorityFeeOptions = [
    { label: 'No priority', lamports: 0 },
    { label: 'Standard priority', lamports: 1000 },
    { label: 'High priority', lamports: 10000 },
];

export const SolanaFeeSelection = () => {
    const priorityFee = useSelector(selectSolanaSendFormPriorityFee);
    const { dispatch } = useServices(injectDispatch);

    const handlePriorityFeeChange = (value: number) => {
        dispatch(solanaActions.setSendFormPriorityFee(value));
    };

    return (
        <VStack spacing={12}>
            <Text variant="headline-sm">Solana priority fee</Text>
            {priorityFeeOptions.map(option => (
                <HStack key={option.lamports} spacing={12} alignItems="center">
                    <Radio
                        value={option.lamports}
                        isChecked={priorityFee === option.lamports}
                        onPress={handlePriorityFeeChange}
                        accessibilityRole="radio"
                        accessibilityLabel={`${option.label}: ${option.lamports} lamports`}
                        accessibilityState={{ checked: priorityFee === option.lamports }}
                    />
                    <Text>
                        {option.label}: {option.lamports} lamports
                    </Text>
                </HStack>
            ))}
            <Text>Priority fee: {priorityFee} lamports</Text>
        </VStack>
    );
};
