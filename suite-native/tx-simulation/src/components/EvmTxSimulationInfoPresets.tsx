import { type ReactNode } from 'react';

import { type Formatters } from '@suite-common/formatters';
import { type TransactionSimulation } from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';
import { type TxSimulationMethod } from '@suite-common/wallet-types';
import { fromBigInt, fromWei, getFeeUnits } from '@suite-common/wallet-utils';
import { PressableOpacity, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export type EvmTxSimulationInfoItem = {
    key: string;
    label: ReactNode;
    value?: ReactNode;
};

type GetEvmTxSimulationContractInfoItemsParams = {
    onCopyContractPress: () => void;
    targetContract: string;
    txSimulation: TransactionSimulation;
};

type GetEvmTxSimulationFeeInfoItemsParams = {
    formatCryptoAmount: Formatters['CryptoAmountFormatter']['format'];
    network: Network;
    transaction: TxSimulationMethod<'ethereumSignTransaction'>['payload']['transaction'];
};

export const getEvmTxSimulationContractInfoItems = ({
    onCopyContractPress,
    targetContract,
    txSimulation,
}: GetEvmTxSimulationContractInfoItemsParams): EvmTxSimulationInfoItem[] => {
    const contractDetails = Object.entries(txSimulation.address_details).find(
        ([address]) => address.toLowerCase() === targetContract.toLowerCase(),
    )?.[1];

    return [
        {
            key: 'protocol',
            label: <Translation id="moduleConnectPopup.simulation.protocol" />,
            value: contractDetails?.name_tag,
        },
        {
            key: 'address',
            label: <Translation id="moduleConnectPopup.simulation.address" />,
            value: (
                <PressableOpacity onPress={onCopyContractPress}>
                    <Text variant="body-sm">{targetContract}</Text>
                </PressableOpacity>
            ),
        },
        {
            key: 'contract-function',
            label: <Translation id="moduleConnectPopup.simulation.contractFunction" />,
            value: txSimulation.params?.calldata?.function_signature,
        },
    ];
};

export const getEvmTxSimulationFeeInfoItems = ({
    formatCryptoAmount,
    network,
    transaction,
}: GetEvmTxSimulationFeeInfoItemsParams): EvmTxSimulationInfoItem[] => {
    const { gasLimit, maxFeePerGas, maxPriorityFeePerGas, gasPrice } = transaction;
    const formattedGasLimit = Number(gasLimit).toLocaleString();
    const feeUnits = getFeeUnits(network.networkType);

    return [
        {
            key: 'total',
            label: <Translation id="moduleSend.fees.custom.bottomSheet.total" />,
            value: formatCryptoAmount(
                fromBigInt(BigInt(gasLimit) * BigInt(maxFeePerGas ?? gasPrice ?? '0'))
                    .asWei()
                    .toEther(),
                {
                    symbol: network.symbol,
                    isBalance: true,
                    isEllipsisAppended: false,
                },
            ),
        },
        {
            key: 'max-fee-per-gas',
            label: (
                <Translation id="transactionManagement.fees.custom.bottomSheet.label.maxFeePerGas" />
            ),
            value: maxFeePerGas && `${fromWei(maxFeePerGas).toGwei().toLocaleString()} ${feeUnits}`,
        },
        {
            key: 'max-priority-fee-per-gas',
            label: (
                <Translation id="transactionManagement.fees.custom.bottomSheet.label.maxPriorityFeePerGas" />
            ),
            value:
                maxPriorityFeePerGas &&
                `${fromWei(maxPriorityFeePerGas).toGwei().toLocaleString()} ${feeUnits}`,
        },
        {
            key: 'gas-price',
            label: (
                <Translation id="transactionManagement.fees.custom.bottomSheet.label.gasPrice" />
            ),
            value: gasPrice && `${fromWei(gasPrice).toGwei().toLocaleString()} ${feeUnits}`,
        },
        {
            key: 'gas-limit',
            label: (
                <Translation id="transactionManagement.fees.custom.bottomSheet.label.gasLimit" />
            ),
            value: formattedGasLimit,
        },
    ];
};
