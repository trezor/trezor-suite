import { Box, HStack, Text, VStack } from '@suite-native/atoms';

import { type EvmTxSimulationInfoItem } from './EvmTxSimulationInfoPresets';

type EvmTxSimulationRowInfoItemsProps = {
    items: EvmTxSimulationInfoItem[];
};

export const EvmTxSimulationRowInfoItems = ({ items }: EvmTxSimulationRowInfoItemsProps) => (
    <VStack spacing="sp16" paddingHorizontal="sp16" paddingBottom="sp16">
        {items.map(item =>
            item.value ? (
                <HStack
                    key={item.key}
                    spacing="sp8"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Box flex={1}>
                        <Text>{item.label}</Text>
                    </Box>
                    <Box flex={1}>
                        <Text variant="body-sm" textAlign="right">
                            {item.value}
                        </Text>
                    </Box>
                </HStack>
            ) : null,
        )}
    </VStack>
);
