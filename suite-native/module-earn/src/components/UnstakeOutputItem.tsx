import { type LayoutChangeEvent, View } from 'react-native';

import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type ReviewOutputState } from '@suite-common/wallet-types';
import { isSupportedEthStakingNetworkSymbol } from '@suite-common/wallet-utils';
import { Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { ReviewOutputCard } from '@suite-native/transaction-management';

type UnstakeOutputItemProps = {
    symbol: NetworkSymbol;
    outputState: ReviewOutputState;
    onLayout: (event: LayoutChangeEvent) => void;
};

export const UnstakeOutputItem = ({ symbol, outputState, onLayout }: UnstakeOutputItemProps) => {
    const { translate } = useTranslate();
    const displaySymbol = getNetworkDisplaySymbol(symbol);

    // Ethereum staking unstakes from the Everstake pool, other networks from a stake account.
    const isEverstakeUnstake = isSupportedEthStakingNetworkSymbol(symbol);

    return (
        <View onLayout={onLayout}>
            <ReviewOutputCard
                title={translate('earn.earnUnstakeOutputItem.title')}
                outputState={outputState}
            >
                <Text variant="body-sm" color="contentSecondary">
                    <Translation
                        id={
                            isEverstakeUnstake
                                ? 'earn.earnUnstakeOutputItem.descriptionEverstake'
                                : 'earn.earnUnstakeOutputItem.description'
                        }
                        values={{ displaySymbol }}
                    />
                </Text>
            </ReviewOutputCard>
        </View>
    );
};
