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

import { useAddCoinAccount } from '../hooks/useAddCoinAccount';
import { AccountTypeDecisionBottomSheet } from '../components/AccountTypeDecisionBottomSheet';

export const AddCoinAccountScreen = ({
    route,
}: StackProps<AddCoinAccountStackParamList, AddCoinAccountStackRoutes.AddCoinAccount>) => {
    const { translate } = useTranslate();

    const {
        supportedNetworkSymbols,
        onSelectedNetworkItem,
        networkSymbolWithTypeToBeAdded,
        clearNetworkWithTypeToBeAdded,
        handleAccountTypeSelection,
        addCoinAccount,
        getAccountTypeToBeAddedName,
    } = useAddCoinAccount();

    const { flowType } = route.params;

    const handleTypeSelectionTap = () => handleAccountTypeSelection(flowType);

    const handleConfirmTap = () => {
        if (networkSymbolWithTypeToBeAdded) {
            // Timeout is needed so AccountTypeDecisionBottomSheet has time to hide otherwise app crashes
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
                <VStack spacing="sp24">
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
            <AccountTypeDecisionBottomSheet
                coinName={
                    G.isNotNullable(networkSymbolWithTypeToBeAdded)
                        ? networkSymbolWithTypeToBeAdded[0]
                        : ''
                }
                typeName={getAccountTypeToBeAddedName()}
                isVisible={G.isNotNullable(networkSymbolWithTypeToBeAdded)}
                onClose={clearNetworkWithTypeToBeAdded}
                onTypeSelectionTap={handleTypeSelectionTap}
                onConfirmTap={handleConfirmTap}
            />
        </Screen>
    );
};
