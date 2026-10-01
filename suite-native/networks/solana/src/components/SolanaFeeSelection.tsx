import { useState } from 'react';

import { HStack, Radio, Text, VStack } from '@suite-native/atoms';

const priorityFeeOptions = [
    { label: 'No priority', lamports: 0 },
    { label: 'Standard priority', lamports: 1000 },
    { label: 'High priority', lamports: 10000 },
];

export const SolanaFeeSelection = () => {
    const [priorityFee, setPriorityFee] = useState(1000);

    return (
        <VStack spacing={12}>
            <Text variant="headline-sm">Solana priority fee</Text>
            {priorityFeeOptions.map(option => (
                <HStack key={option.lamports} spacing={12} alignItems="center">
                    <Radio
                        value={option.lamports}
                        isChecked={priorityFee === option.lamports}
                        onPress={setPriorityFee}
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
