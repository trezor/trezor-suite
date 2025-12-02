import { fromWei } from 'web3-utils';

import { ConnectPopupCall } from '@suite-common/connect-popup';
import { useFormatters } from '@suite-common/formatters';
import { Network } from '@suite-common/wallet-config';
import { getFeeUnits } from '@suite-common/wallet-utils';
import {
    BottomSheetModal,
    BottomSheetModalRef,
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
    popupCall,
}: {
    ref: BottomSheetModalRef;
    defaultGasLimit: string;
    network: Network;
    popupCall: ConnectPopupCall;
}) => {
    const { CryptoAmountFormatter } = useFormatters();
    const formattedGasLimit = Number(defaultGasLimit).toLocaleString();

    if (popupCall?.state !== 'tx-simulation') return null;

    const items = [
        {
            label: <Translation id="moduleSend.fees.custom.bottomSheet.total" />,
            value: CryptoAmountFormatter.format(
                fromWei(
                    Number(defaultGasLimit) *
                        (popupCall.payload?.transaction?.maxFeePerGas ??
                            popupCall.payload?.transaction?.gasPrice),
                    'ether',
                ),
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
                popupCall.payload?.transaction?.maxFeePerGas &&
                fromWei(popupCall.payload?.transaction?.maxFeePerGas, 'gwei').toLocaleString() +
                    ' ' +
                    getFeeUnits(network.networkType),
        },
        {
            label: (
                <Translation id="transactionManagement.fees.custom.bottomSheet.label.maxPriorityFeePerGas" />
            ),
            value:
                popupCall.payload?.transaction?.maxPriorityFeePerGas &&
                fromWei(
                    popupCall.payload?.transaction?.maxPriorityFeePerGas,
                    'gwei',
                ).toLocaleString() +
                    ' ' +
                    getFeeUnits(network.networkType),
        },
        {
            label: (
                <Translation id="transactionManagement.fees.custom.bottomSheet.label.gasPrice" />
            ),
            value:
                popupCall.payload?.transaction?.gasPrice &&
                fromWei(Number(popupCall.payload?.transaction?.gasPrice), 'gwei').toLocaleString() +
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
                                <Text variant="hint" textAlign="right">
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
