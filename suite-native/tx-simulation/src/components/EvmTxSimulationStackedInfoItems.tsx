import { Text, VStack } from '@suite-native/atoms';

import { type EvmTxSimulationInfoItem } from './EvmTxSimulationInfoPresets';

type EvmTxSimulationStackedInfoItemsProps = {
    items: EvmTxSimulationInfoItem[];
};

export const EvmTxSimulationStackedInfoItems = ({
    items,
}: EvmTxSimulationStackedInfoItemsProps) => (
    <VStack spacing="sp16" paddingHorizontal="sp16" paddingBottom="sp16">
        {items.map(item =>
            item.value ? (
                <VStack key={item.key} spacing="sp8">
                    <Text>{item.label}</Text>
                    {typeof item.value === 'string' ? (
                        <Text variant="body-sm">{item.value}</Text>
                    ) : (
                        item.value
                    )}
                </VStack>
            ) : null,
        )}
    </VStack>
);
