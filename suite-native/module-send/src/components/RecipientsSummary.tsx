import { useSelector } from 'react-redux';

import {
    AccountsRootState,
    selectAccountNetworkSymbol,
    selectSendFormDraftOutputsByAccountKey,
    SendRootState,
} from '@suite-common/wallet-core';
import {
    AccountKey,
    GeneralPrecomposedTransaction,
    isFinalPrecomposedTransaction,
    Output,
    TokenAddress,
} from '@suite-common/wallet-types';
import { Text, VStack, Card, HStack } from '@suite-native/atoms';
import { CoinToFiatAmountFormatter, CoinAmountFormatter } from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';
import { selectIsAmountInSats, SettingsSliceRootState } from '@suite-native/settings';

type FeesRecipientsProps = {
    accountKey: AccountKey;
    selectedFeeLevel: GeneralPrecomposedTransaction;
    tokenContract?: TokenAddress;
};

const cardStyle = prepareNativeStyle(utils => ({
    borderColor: utils.colors.borderElevation0,
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation0,
    borderWidth: utils.borders.widths.small,
    paddingVertical: utils.spacings.sp12,
    ...utils.boxShadows.none,
}));

const addressStyle = prepareNativeStyle(() => ({
    letterSpacing: 0, // negative letter spacing has to be overwritten for ellipsizeMode='middle' to work
}));

export const RecipientsSummary = ({
    accountKey,
    tokenContract,
    selectedFeeLevel,
}: FeesRecipientsProps) => {
    const { applyStyle } = useNativeStyles();

    const draftOutputs = useSelector((state: SendRootState) =>
        selectSendFormDraftOutputsByAccountKey(state, accountKey),
    );
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const isAmountInSats = useSelector((state: SettingsSliceRootState) =>
        selectIsAmountInSats(state, networkSymbol),
    );

    // If the fee level was not successfully created (there is not enough balance for it), use the draft outputs instead.
    const outputs = isFinalPrecomposedTransaction(selectedFeeLevel)
        ? selectedFeeLevel.outputs
        : draftOutputs;
    const addressTargetingOutputs = outputs?.filter(output => 'address' in output) as Output[];

    if (!addressTargetingOutputs || !networkSymbol) return null;

    // Successfully composed outputs values are always in "balance" format.
    const isBalance = !isAmountInSats && !isFinalPrecomposedTransaction(selectedFeeLevel);

    return (
        <VStack>
            {/* TODO handle UI of multiple recipients in better way when is the design ready. */}
            {addressTargetingOutputs.map(output => (
                <Card key={output.address} style={applyStyle(cardStyle)}>
                    <HStack>
                        <VStack flex={0.4} justifyContent="center" spacing="sp4">
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
                        <VStack flex={0.6} alignItems="flex-end" spacing="sp4">
                            <CoinToFiatAmountFormatter
                                variant="hint"
                                color="textDefault"
                                value={output.amount}
                                isBalance={isBalance}
                                accountKey={accountKey}
                                tokenContract={tokenContract}
                            />
                            <CoinAmountFormatter
                                variant="hint"
                                color="textSubdued"
                                value={output.amount}
                                isBalance={isBalance}
                                accountKey={accountKey}
                                tokenContract={tokenContract}
                                adjustsFontSizeToFit
                                numberOfLines={1}
                            />
                        </VStack>
                    </HStack>
                </Card>
            ))}
        </VStack>
    );
};
