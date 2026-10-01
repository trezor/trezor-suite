import { HStack, Radio, Text, VStack } from '@suite-native/atoms';
import type { NativeSendFeeSelectorProps } from '@suite-native/network-module-suite-native-types';

// Copy is a platform concern; the ids come from the Solana send strategy.
const labelByLevelId: Record<string, string> = {
    none: 'No priority',
    normal: 'Standard priority',
    high: 'High priority',
};

export const SolanaPriorityFeeSelector = ({
    levels,
    selectedLevelId,
    onSelect,
}: NativeSendFeeSelectorProps) => (
    <VStack spacing={12}>
        <Text variant="headline-sm">Solana priority fee</Text>
        {levels.map(level => {
            const label = `${labelByLevelId[level.id] ?? level.id}: ${level.value} lamports`;
            const isChecked = level.id === selectedLevelId;

            return (
                <HStack key={level.id} spacing={12} alignItems="center">
                    <Radio
                        value={level.id}
                        isChecked={isChecked}
                        onPress={onSelect}
                        accessibilityRole="radio"
                        accessibilityLabel={label}
                        accessibilityState={{ checked: isChecked }}
                    />
                    <Text>{label}</Text>
                </HStack>
            );
        })}
    </VStack>
);
