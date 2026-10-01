import { SegmentedControl, Text, VStack } from '@suite-native/atoms';
import type { NativeSendFeeSelectorProps } from '@suite-native/network-module-suite-native-types';

// Copy is a platform concern; the ids come from the Bitcoin send strategy.
const labelByLevelId: Record<string, string> = {
    economy: 'Economy',
    normal: 'Standard',
    high: 'Fast',
};

export const BitcoinFeeRateSelector = ({
    levels,
    selectedLevelId,
    onSelect,
}: NativeSendFeeSelectorProps) => {
    const selectedLevel = levels.find(level => level.id === selectedLevelId);

    return (
        <VStack spacing={12}>
            <Text variant="headline-sm">Bitcoin fee rate</Text>
            <SegmentedControl
                options={levels.map(level => ({
                    label: labelByLevelId[level.id] ?? level.id,
                    value: level.id,
                }))}
                selectedValue={selectedLevelId}
                onValueChange={onSelect}
            />
            {selectedLevel && <Text>Fee rate: {selectedLevel.value} sat/vB</Text>}
        </VStack>
    );
};
