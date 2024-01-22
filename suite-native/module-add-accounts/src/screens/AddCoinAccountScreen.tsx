import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { Card, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { SelectableNetworkItem } from '@suite-native/accounts';

import { useAddCoinAccount } from '../hooks/useAddCoinAccount';

export const AddCoinAccountScreen = () => {
    const { translate } = useTranslate();

    const { supportedNetworkSymbols, onSelectedNetworkItem } = useAddCoinAccount();

    return (
        <Screen
            screenHeader={
                <ScreenSubHeader
                    content={translate('moduleAddAccounts.addCoinAccountScreen.title')}
                />
            }
        >
            <Card>
                <VStack spacing="large">
                    {supportedNetworkSymbols.map(symbol => (
                        <SelectableNetworkItem
                            key={symbol}
                            symbol={symbol}
                            data-testID={`@add-account/select-coin/${symbol}`}
                            onPress={onSelectedNetworkItem}
                            rightIcon="plus"
                        />
                    ))}
                </VStack>
            </Card>
        </Screen>
    );
};
