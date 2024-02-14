import { G } from '@mobily/ts-belt';

import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { Card, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { SelectableNetworkItem } from '@suite-native/accounts';

import { accountTypeTranslationKeys, useAddCoinAccount } from '../hooks/useAddCoinAccount';
import { AccountTypeDecisionBootomSheet } from '../components/AccountTypeDecisionBootomSheet';

export const AddCoinAccountScreen = () => {
    const { translate } = useTranslate();

    const {
        supportedNetworkSymbols,
        onSelectedNetworkItem,
        networkWithTypeToBeAdded,
        clearNetworkWithTypeToBeAdded,
        navigateToAccountTypeSelectionScreen,
        addCoinAccount,
    } = useAddCoinAccount();

    const accountTypeName = networkWithTypeToBeAdded
        ? translate(accountTypeTranslationKeys[networkWithTypeToBeAdded[1]].titleKey)
        : '';

    const handleTypeSelectionTap = () => {
        if (networkWithTypeToBeAdded) {
            navigateToAccountTypeSelectionScreen(networkWithTypeToBeAdded[0]);
        }
    };

    const handleConfirmTap = () => {
        if (networkWithTypeToBeAdded) {
            addCoinAccount({
                network: networkWithTypeToBeAdded[0],
                accountType: networkWithTypeToBeAdded[1],
            });
        }
    };

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
                        />
                    ))}
                </VStack>
            </Card>
            <AccountTypeDecisionBootomSheet
                coinName={
                    G.isNotNullable(networkWithTypeToBeAdded)
                        ? networkWithTypeToBeAdded[0].symbol
                        : ''
                }
                typeName={accountTypeName}
                isVisible={G.isNotNullable(networkWithTypeToBeAdded)}
                onClose={clearNetworkWithTypeToBeAdded}
                onTypeSelectionTap={handleTypeSelectionTap}
                onConfirmTap={handleConfirmTap}
            />
        </Screen>
    );
};
