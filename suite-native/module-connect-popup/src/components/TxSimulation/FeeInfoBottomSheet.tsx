import { fromWei } from 'web3-utils';

import { useFormatters } from '@suite-common/formatters';
import { type Network } from '@suite-common/wallet-config';
import { type TxSimulationMethod } from '@suite-common/wallet-types';
import { getFeeUnits } from '@suite-common/wallet-utils';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Card,
    HStack,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const FeeInfoBottomSheet = ({
    ref,
    defaultGasLimit,
    network,
    transaction,
}: {
    ref: BottomSheetModalRef;
    defaultGasLimit: string;
    network: Network;
    transaction: TxSimulationMethod<'ethereumSignTransaction'>['payload']['transaction'];
}) => {
    const { CryptoAmountFormatter } = useFormatters();
    const formattedGasLimit = Number(defaultGasLimit).toLocaleString();
    const { maxFeePerGas, maxPriorityFeePerGas, gasPrice } = transaction;

    const items = [
        {
            label: <Translation id="moduleSend.fees.custom.bottomSheet.total" />,
            value: CryptoAmountFormatter.format(
                fromWei(Number(defaultGasLimit) * Number(maxFeePerGas ?? gasPrice ?? '0'), 'ether'),
                {
                    symbol: network.symbol,
                    isBalance: true,
                    isEllipsisAppended: false,
                },
            ),
        },
        {
            label: (
                <Translation id="transactionManagement.fees.custom.bottomSheet.label.maxFeePerGas" />
            ),
            value:
                maxFeePerGas &&
                fromWei(maxFeePerGas, 'gwei').toLocaleString() +
                    ' ' +
                    getFeeUnits(network.networkType),
        },
        {
            label: (
                <Translation id="transactionManagement.fees.custom.bottomSheet.label.maxPriorityFeePerGas" />
            ),
            value:
                maxPriorityFeePerGas &&
                fromWei(maxPriorityFeePerGas, 'gwei').toLocaleString() +
                    ' ' +
                    getFeeUnits(network.networkType),
        },
        {
            label: (
                <Translation id="transactionManagement.fees.custom.bottomSheet.label.gasPrice" />
            ),
            value:
                gasPrice &&
                fromWei(Number(gasPrice), 'gwei').toLocaleString() +
                    ' ' +
                    getFeeUnits(network.networkType),
        },
        {
            label: (
                <Translation id="transactionManagement.fees.custom.bottomSheet.label.gasLimit" />
            ),
            value: formattedGasLimit,
        },
    ];

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="moduleConnectPopup.simulation.feeInfo" />}
            paddingBottom="sp24"
        >
            <Card>
                <VStack>
                    {items.map((item, index) =>
                        item.value ? (
                            <HStack
                                key={index}
                                spacing="sp8"
                                alignItems="center"
                                justifyContent="space-between"
                            >
                                <Text>{item.label}</Text>
                                <Text variant="body-sm" textAlign="right">
                                    {item.value}
                                </Text>
                            </HStack>
                        ) : null,
                    )}
                </VStack>
            </Card>
        </BottomSheetModal>
    );
};
