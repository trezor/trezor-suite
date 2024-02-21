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
        networkWithTypeToBeAdded,
        clearNetworkWithTypeToBeAdded,
        navigateToAccountTypeSelectionScreen,
        addCoinAccount,
    } = useAddCoinAccount();

    const { flowType } = route.params;

    const accountTypeName = networkWithTypeToBeAdded
        ? translate(accountTypeTranslationKeys[networkWithTypeToBeAdded[1]].titleKey)
        : '';

    const handleTypeSelectionTap = () => {
        if (networkWithTypeToBeAdded) {
            navigateToAccountTypeSelectionScreen(networkWithTypeToBeAdded[0], flowType);
        }
    };

    const handleConfirmTap = () => {
        if (networkWithTypeToBeAdded) {
            addCoinAccount({
                network: networkWithTypeToBeAdded[0],
                accountType: networkWithTypeToBeAdded[1],
                flowType,
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
                    {supportedNetworkSymbols.map(networkSymbol => (
                        <SelectableNetworkItem
                            key={networkSymbol}
                            symbol={networkSymbol}
                            data-testID={`@add-account/select-coin/${networkSymbol}`}
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
