import { VStack } from '@suite-native/atoms';
import { AccountAddressFormatter } from '@suite-native/formatters';
import { TransactionOutputLabelEditable } from '@suite-native/labeling';
import type { StaticSessionId } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const addressTextStyle = prepareNativeStyle(_ => ({
    maxWidth: '80%',
}));

type TransactionUtxoAddressProps = {
    address: string;
    n: number;
    txId: string;
    deviceStaticSessionId: StaticSessionId;
    showLabels?: boolean;
};

export const TransactionUtxoAddress = ({
    deviceStaticSessionId,
    txId,
    n,
    address,
    showLabels,
}: TransactionUtxoAddressProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack>
            <AccountAddressFormatter
                key={address}
                value={address}
                style={applyStyle(addressTextStyle)}
            />
            {showLabels && (
                <TransactionOutputLabelEditable
                    txId={txId}
                    outputIndex={n}
                    deviceStaticSessionId={deviceStaticSessionId}
                />
            )}
        </VStack>
    );
};
