import { useSelector } from 'react-redux';

import { WithLabelingState, selectOutputLabel } from '@suite-common/local-first-storage';
import { Text, VStack } from '@suite-native/atoms';
import { AccountAddressFormatter } from '@suite-native/formatters';
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
};

export const TransactionUtxoAddress = ({
    deviceStaticSessionId,
    txId,
    n,
    address,
}: TransactionUtxoAddressProps) => {
    const { applyStyle } = useNativeStyles();

    const localFirstOutputLabel = useSelector((state: WithLabelingState) =>
        selectOutputLabel({
            state,
            txId,
            outputIndex: n,
            deviceStaticSessionId,
        }),
    );

    return (
        <VStack>
            <AccountAddressFormatter
                key={address}
                value={address}
                style={applyStyle(addressTextStyle)}
            />
            {localFirstOutputLabel?.label && <Text>{localFirstOutputLabel.label}</Text>}
        </VStack>
    );
};
