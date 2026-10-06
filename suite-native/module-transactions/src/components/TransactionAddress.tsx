import { useSelector } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectDeviceAccountByDescriptorAndNetworkSymbol,
} from '@suite-common/wallet-core';
import { type AccountDescriptor, type TxTargetId } from '@suite-common/wallet-types';
import { isUtxoBased } from '@suite-common/wallet-utils';
import { AddressLabel } from '@suite-native/address';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { isDebugEnv } from '@suite-native/config';
import { AddressFormatter } from '@suite-native/formatters';
import { selectIsLabellingAllowed } from '@suite-native/labeling';
import { TransactionOutputLabelEditable } from '@suite-native/transactions';
import type { StaticSessionId } from '@trezor/connect';

type TransactionAddressProps = {
    address: string;
    txTargetId: TxTargetId;
    txId: string;
    deviceStaticSessionId: StaticSessionId;
    showLabels?: boolean;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export const TransactionAddress = ({
    deviceStaticSessionId,
    txId,
    txTargetId,
    address,
    accountDescriptor,
    networkSymbol,
    showLabels,
}: TransactionAddressProps) => {
    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);

    const account = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountByDescriptorAndNetworkSymbol(state, accountDescriptor, networkSymbol),
    );
    const isUtxoBasedAccount = account !== null && isUtxoBased(account);

    return (
        <VStack alignItems="flex-start">
            <HStack spacing={4}>
                <AddressLabel
                    address={address}
                    deviceStaticSessionId={deviceStaticSessionId}
                    fallback={<AddressFormatter key={address} value={address} format="long" />}
                />

                {isUtxoBasedAccount && isLabellingAllowed && isDebugEnv() && (
                    <Text>[{`${txTargetId}`}]</Text>
                )}
            </HStack>

            {showLabels && (
                <TransactionOutputLabelEditable
                    txId={txId}
                    txTargetId={txTargetId}
                    deviceStaticSessionId={deviceStaticSessionId}
                    accountDescriptor={accountDescriptor}
                    networkSymbol={networkSymbol}
                />
            )}
        </VStack>
    );
};
