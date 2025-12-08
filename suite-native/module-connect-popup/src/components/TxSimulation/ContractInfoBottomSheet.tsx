import { Pressable } from 'react-native';

import { TxSimulationResult } from '@suite-common/tx-simulation';
import { BottomSheetModal, BottomSheetModalRef, Card, Text, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { Translation } from '@suite-native/intl';

export const ContractInfoBottomSheet = ({
    ref,
    targetContract,
    simulationResult,
}: {
    ref: BottomSheetModalRef;
    targetContract: string;
    simulationResult: TxSimulationResult | undefined;
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
        <BottomSheetModal
            ref={ref}
            title={<Translation id="moduleConnectPopup.simulation.contractInfo" />}
            paddingBottom="sp24"
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
        </BottomSheetModal>
    );
};
