import { Pressable } from 'react-native';

import { TransactionScanResponse } from '@suite-common/tx-simulation';
import { BottomSheet, Card, Text, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/helpers';
import { Translation } from '@suite-native/intl';

export const ContractInfoBottomSheet = ({
    isVisible,
    onClose,
    targetContract,
    simulationResult,
}: {
    isVisible: boolean;
    onClose: () => void;
    targetContract: string;
    simulationResult: TransactionScanResponse | null;
}) => {
    const copyToClipboard = useCopyToClipboard();
    const handleCopy = () => copyToClipboard(targetContract);

    if (simulationResult?.simulation?.status !== 'Success') return null;

    const contractDetails = Object.entries(simulationResult.simulation.address_details).find(
        ([address]) => address.toLowerCase() === targetContract.toLowerCase(),
    )?.[1];

    const items = [
        {
            label: <Translation id="moduleConnectPopup.simulation.protocol" />,
            value: contractDetails?.name_tag,
        },
        {
            label: <Translation id="moduleConnectPopup.simulation.address" />,
            value: targetContract && (
                <Pressable onPress={handleCopy}>
                    <Text variant="hint">{targetContract}</Text>
                </Pressable>
            ),
        },
        {
            label: <Translation id="moduleConnectPopup.simulation.contractFunction" />,
            value: simulationResult.simulation.params?.calldata?.function_signature,
        },
    ];

    return (
        <BottomSheet
            isVisible={isVisible}
            onClose={onClose}
            title={<Translation id="moduleConnectPopup.simulation.contractInfo" />}
        >
            <Card>
                <VStack>
                    {items.map((item, index) =>
                        item.value ? (
                            <VStack key={index} spacing="sp8">
                                <Text>{item.label}</Text>
                                <Text variant="hint">{item.value}</Text>
                            </VStack>
                        ) : null,
                    )}
                </VStack>
            </Card>
        </BottomSheet>
    );
};
