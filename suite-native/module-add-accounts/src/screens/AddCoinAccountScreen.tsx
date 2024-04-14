import { G } from '@mobily/ts-belt';

import {
    AddCoinAccountStackParamList,
    AddCoinAccountStackRoutes,
    Screen,
    ScreenSubHeader,
    StackProps,
} from '@suite-native/navigation';
import { Card, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { SelectableNetworkItem } from '@suite-native/accounts';

import { accountTypeTranslationKeys, useAddCoinAccount } from '../hooks/useAddCoinAccount';
import { AccountTypeDecisionBootomSheet } from '../components/AccountTypeDecisionBootomSheet';

export const AddCoinAccountScreen = ({
    route,
}: StackProps<AddCoinAccountStackParamList, AddCoinAccountStackRoutes.AddCoinAccount>) => {
    const { translate } = useTranslate();

    const {
        supportedNetworkSymbols,
        onSelectedNetworkItem,
        networkSymbolWithTypeToBeAdded,
        clearNetworkWithTypeToBeAdded,
        navigateToAccountTypeSelectionScreen,
        addCoinAccount,
    } = useAddCoinAccount();

    const { flowType } = route.params;

    const accountTypeName = networkSymbolWithTypeToBeAdded
        ? translate(accountTypeTranslationKeys[networkSymbolWithTypeToBeAdded[1]].titleKey)
        : '';

    const handleTypeSelectionTap = () => {
        if (networkSymbolWithTypeToBeAdded) {
            navigateToAccountTypeSelectionScreen(
                networkSymbolWithTypeToBeAdded[0],
                flowType,
                networkSymbolWithTypeToBeAdded[1],
            );
        }
    };

    const handleConfirmTap = () => {
        if (networkSymbolWithTypeToBeAdded) {
            // Timeout is needed so AccountTypeDecisionBootomSheet has time to hide otherwise app crashes
            setTimeout(() => {
                addCoinAccount({
                    networkSymbol: networkSymbolWithTypeToBeAdded[0],
                    accountType: networkSymbolWithTypeToBeAdded[1],
                    flowType,
                });
            }, 100);
            clearNetworkWithTypeToBeAdded();
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
                    {supportedNetworkSymbols.map(networkSymbol => (
                        <SelectableNetworkItem
                            key={networkSymbol}
                            symbol={networkSymbol}
                            onPress={() =>
                                onSelectedNetworkItem({
                                    networkSymbol,
                                    flowType,
                                })
                            }
                        />
                    ))}
                </VStack>
            </Card>
            <AccountTypeDecisionBootomSheet
                coinName={
                    G.isNotNullable(networkSymbolWithTypeToBeAdded)
                        ? networkSymbolWithTypeToBeAdded[0]
                        : ''
                }
                typeName={accountTypeName}
                isVisible={G.isNotNullable(networkSymbolWithTypeToBeAdded)}
                onClose={clearNetworkWithTypeToBeAdded}
                onTypeSelectionTap={handleTypeSelectionTap}
                onConfirmTap={handleConfirmTap}
            />
        </Screen>
    );
};
