import { useSelector } from 'react-redux';

import {
    AccountsRootState,
    SendRootState,
    selectAccountNetworkSymbol,
    selectSendFormDraftOutputsByAccountKey,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { Text, VStack, Card, HStack } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter, CryptoAmountFormatter } from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';
import { selectIsAmountInSats, SettingsSliceRootState } from '@suite-native/settings';

type FeesRecipientsProps = {
    accountKey: AccountKey;
};

const cardStyle = prepareNativeStyle(utils => ({
    borderColor: utils.colors.borderElevation0,
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation0,
    borderWidth: utils.borders.widths.small,
    paddingVertical: 12,
    ...utils.boxShadows.none,
}));

const addressStyle = prepareNativeStyle(() => ({
    letterSpacing: 0, // negative letter spacing has to be overwritten for ellipsizeMode='middle' to work
}));

export const RecipientsSummary = ({ accountKey }: FeesRecipientsProps) => {
    const { applyStyle } = useNativeStyles();

    const outputs = useSelector((state: SendRootState) =>
        selectSendFormDraftOutputsByAccountKey(state, accountKey),
    );

    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const isAmountInSats = useSelector((state: SettingsSliceRootState) =>
        selectIsAmountInSats(state, networkSymbol),
    );

    if (!outputs || !networkSymbol) return null;

    return (
        <VStack>
            {/* TODO handle UI of multiple recipients in better way when is the design ready. */}
            {outputs.map(output => (
                <Card key={output.address} style={applyStyle(cardStyle)}>
                    <HStack>
                        <VStack flex={0.6} justifyContent="center" spacing="extraSmall">
                            <Text variant="callout">
                                <Translation id="moduleSend.fees.recipient.singular" />
                            </Text>
                            <Text
                                variant="hint"
                                ellipsizeMode="middle"
                                numberOfLines={1}
                                style={applyStyle(addressStyle)}
                            >
                                {output.address}
                            </Text>
                        </VStack>
                        <VStack flex={0.4} alignItems="flex-end" spacing="extraSmall">
                            <CryptoToFiatAmountFormatter
                                variant="hint"
                                color="textDefault"
                                value={output.amount}
                                network={networkSymbol}
                                isBalance={!isAmountInSats}
                            />
                            <CryptoAmountFormatter
                                variant="hint"
                                color="textSubdued"
                                value={output.amount}
                                network={networkSymbol}
                                isBalance={!isAmountInSats}
                            />
                        </VStack>
                    </HStack>
                </Card>
            ))}
        </VStack>
    );
};
