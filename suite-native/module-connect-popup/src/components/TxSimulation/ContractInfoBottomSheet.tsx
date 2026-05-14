import { Pressable } from 'react-native';

import { type TransactionSimulation } from '@suite-common/tx-simulation';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Card,
    Text,
    VStack,
} from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { Translation } from '@suite-native/intl';

export const ContractInfoBottomSheet = ({
    ref,
    targetContract,
    txSimulation,
}: {
    ref: BottomSheetModalRef;
    targetContract: string;
    txSimulation: TransactionSimulation;
}) => {
    const copyToClipboard = useCopyToClipboard();
    const handleCopy = () => copyToClipboard(targetContract);

    const contractDetails = Object.entries(txSimulation.address_details).find(
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
                    <Text variant="body-sm">{targetContract}</Text>
                </Pressable>
            ),
        },
        {
            label: <Translation id="moduleConnectPopup.simulation.contractFunction" />,
            value: txSimulation.params?.calldata?.function_signature,
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
                                <Text variant="body-sm">{item.value}</Text>
                            </VStack>
                        ) : null,
                    )}
                </VStack>
            </Card>
        </BottomSheetModal>
    );
};
