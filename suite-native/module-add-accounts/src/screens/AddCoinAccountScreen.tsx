import { AccountTypeDecisionBottomSheet, useAddCoinAccount } from '@suite-native/add-coin-account';
import { VStack } from '@suite-native/atoms';
import { NetworkListItem } from '@suite-native/coin-enabling';
import { Icon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import {
    type AddCoinAccountStackParamList,
    type AddCoinAccountStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
} from '@suite-native/navigation';
import { isNotNullOrUndefined } from '@trezor/utils';

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
        handleAccountTypeConfirmation,
        getAccountTypeToBeAddedName,
        bottomSheetRef,
    } = useAddCoinAccount();

    const { flowType } = route.params;

    const handleTypeSelectionTap = () => handleAccountTypeSelection(flowType);

    const handleConfirmTap = () => handleAccountTypeConfirmation(flowType);

    return (
        <Screen
            header={
                <ScreenHeader
                    title={translate('moduleAddAccounts.addCoinAccountScreen.title')}
                    closeActionType="close"
                />
            }
        >
            <VStack spacing="sp12">
                {supportedNetworkSymbols.map(symbol => (
                    <NetworkListItem
                        key={symbol}
                        symbol={symbol}
                        accessory={<Icon name="caretRight" color="contentSecondary" />}
                        onPress={() =>
                            onSelectedNetworkItem({
                                symbol,
                                flowType,
                            })
                        }
                        accessibilityRole="button"
                        testID={`@onboarding/select-coin/${symbol}`}
                    />
                ))}
            </VStack>
            <AccountTypeDecisionBottomSheet
                coinName={
                    isNotNullOrUndefined(networkSymbolWithTypeToBeAdded)
                        ? networkSymbolWithTypeToBeAdded[0]
                        : ''
                }
                typeName={getAccountTypeToBeAddedName()}
                ref={bottomSheetRef}
                onClose={clearNetworkWithTypeToBeAdded}
                onTypeSelectionTap={handleTypeSelectionTap}
                onConfirmTap={handleConfirmTap}
            />
        </Screen>
    );
};
