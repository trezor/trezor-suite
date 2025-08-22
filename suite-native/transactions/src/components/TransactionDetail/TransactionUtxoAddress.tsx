import { HStack, Text, VStack } from '@suite-native/atoms';
import { isDebugEnv } from '@suite-native/config';
import { AccountAddressFormatter } from '@suite-native/formatters';
import { TransactionOutputLabelEditable } from '@suite-native/labeling';
import type { StaticSessionId } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const addressTextStyle = prepareNativeStyle(_ => ({
    maxWidth: '80%',
}));

type TransactionUtxoAddressProps = {
    address: string;
    outputIndex: number;
    txId: string;
    deviceStaticSessionId: StaticSessionId;
    showLabels?: boolean;
};

export const TransactionUtxoAddress = ({
    deviceStaticSessionId,
    txId,
    outputIndex,
    address,
    showLabels,
}: TransactionUtxoAddressProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack>
            <HStack spacing={2}>
                <AccountAddressFormatter
                    key={address}
                    value={address}
                    style={applyStyle(addressTextStyle)}
                />
                {isDebugEnv() && <Text>[{outputIndex}]</Text>}
            </HStack>

            {showLabels && (
                <TransactionOutputLabelEditable
                    txId={txId}
                    outputIndex={outputIndex}
                    deviceStaticSessionId={deviceStaticSessionId}
                />
            )}
        </VStack>
    );
};
