import { useSelector } from 'react-redux';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor, type TxTargetId } from '@suite-common/wallet-types';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { isDebugEnv } from '@suite-native/config';
import { AddressFormatter } from '@suite-native/formatters';
import {
    AddressLabel,
    TransactionOutputLabelEditable,
    selectIsLabellingAllowed,
} from '@suite-native/labeling';
import type { StaticSessionId } from '@trezor/connect';

type TransactionUtxoAddressProps = {
    address: string;
    txTargetId: TxTargetId;
    txId: string;
    deviceStaticSessionId: StaticSessionId;
    showLabels?: boolean;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export const TransactionUtxoAddress = ({
    deviceStaticSessionId,
    txId,
    txTargetId,
    address,
    accountDescriptor,
    networkSymbol,
    showLabels,
}: TransactionUtxoAddressProps) => {
    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);

    return (
        <VStack alignItems="flex-start">
            <HStack spacing={4}>
                <AddressLabel
                    address={address}
                    deviceStaticSessionId={deviceStaticSessionId}
                    fallback={<AddressFormatter key={address} value={address} format="long" />}
                />

                {isLabellingAllowed && isDebugEnv() && <Text>[{`${txTargetId}`}]</Text>}
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
