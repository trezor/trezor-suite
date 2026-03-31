import { type LayoutChangeEvent, View } from 'react-native';

import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type ReviewOutputState } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { ReviewOutputCard } from '@suite-native/transaction-management';

type ClaimOutputItemProps = {
    symbol: NetworkSymbol;
    outputState: ReviewOutputState;
    onLayout: (event: LayoutChangeEvent) => void;
};

export const ClaimOutputItem = ({ symbol, outputState, onLayout }: ClaimOutputItemProps) => {
    const { translate } = useTranslate();
    const displaySymbol = symbol ? getNetworkDisplaySymbol(symbol) : undefined;

    return (
        <View onLayout={onLayout}>
            <ReviewOutputCard
                title={translate('earn.claimOutputItem.title')}
                outputState={outputState}
            >
                <Text variant="body-sm" color="textSubdued">
                    <Translation
                        id="earn.claimOutputItem.description"
                        values={{
                            displaySymbol: displaySymbol ?? (
                                <Translation id="earn.notAvailableShort" />
                            ),
                        }}
                    />
                </Text>
            </ReviewOutputCard>
        </View>
    );
};
