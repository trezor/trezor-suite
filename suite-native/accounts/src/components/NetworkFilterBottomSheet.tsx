import { type Ref, forwardRef, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    BottomSheetModal,
    Button,
    Card,
    CheckBox,
    HStack,
    PressableOpacity,
    Text,
    VStack,
} from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';

import { type NativeAccountsRootState, selectNetworkFilterOptions } from '../selectors';

type NetworkFilterBottomSheetProps = {
    selectedNetworks: NetworkSymbol[];
    onApply: (selected: NetworkSymbol[]) => void;
    onClear: () => void;
    isSendFlow: boolean;
};

export const NetworkFilterBottomSheet = forwardRef(
    (
        { selectedNetworks, onApply, onClear, isSendFlow }: NetworkFilterBottomSheetProps,
        ref: Ref<BottomSheetModalMethods>,
    ) => {
        const { translate } = useTranslate();
        const [pendingSelection, setPendingSelection] = useState<NetworkSymbol[]>(selectedNetworks);
        const selectedNetworksRef = useRef(selectedNetworks);
        selectedNetworksRef.current = selectedNetworks;

        const options = useSelector((state: NativeAccountsRootState) =>
            selectNetworkFilterOptions(state, isSendFlow),
        );

        useEffect(() => {
            setPendingSelection(selectedNetworks);
        }, [selectedNetworks]);

        const handleDismiss = () => {
            setPendingSelection(selectedNetworksRef.current);
        };

        const handleSelectNetwork = (symbol: NetworkSymbol) => {
            setPendingSelection(prev =>
                prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol],
            );
        };

        const dismissBottomSheet = () => {
            if (ref && 'current' in ref) {
                ref.current?.dismiss();
            }
        };

        const handleConfirmSelection = () => {
            onApply(pendingSelection);
            dismissBottomSheet();
        };

        const handleClear = () => {
            onClear();
            dismissBottomSheet();
        };

        return (
            <BottomSheetModal
                ref={ref}
                title={translate(
                    'moduleAccountManagement.accountsScreen.networkFilter.showAccountsOnTitle',
                )}
                isCloseDisplayed
                onDismiss={handleDismiss}
                footer={
                    <VStack spacing="sp12" paddingHorizontal="sp16" paddingBottom="sp16">
                        <Button onPress={handleConfirmSelection}>
                            <Translation id="moduleAccountManagement.accountsScreen.networkFilter.applyButton" />
                        </Button>
                        <Button intent="neutral" priority="secondary" onPress={handleClear}>
                            <Translation id="moduleAccountManagement.accountsScreen.networkFilter.clearButton" />
                        </Button>
                    </VStack>
                }
            >
                <VStack spacing="sp12" paddingBottom="sp16">
                    {options.map(({ symbol, accountCount }) => (
                        <PressableOpacity key={symbol} onPress={() => handleSelectNetwork(symbol)}>
                            <Card noShadow>
                                <HStack alignItems="center" spacing="sp16">
                                    <TokenIcon symbol={symbol} />
                                    <VStack flex={1} spacing={0}>
                                        <Text variant="body-md-strong">
                                            {getNetwork(symbol).name}
                                        </Text>
                                        <Text variant="body-sm" color="contentSecondary">
                                            <Translation
                                                id="moduleAccountManagement.accountsScreen.networkFilter.accountCount"
                                                values={{ count: accountCount }}
                                            />
                                        </Text>
                                    </VStack>
                                    <CheckBox
                                        isChecked={pendingSelection.includes(symbol)}
                                        onChange={() => handleSelectNetwork(symbol)}
                                    />
                                </HStack>
                            </Card>
                        </PressableOpacity>
                    ))}
                </VStack>
            </BottomSheetModal>
        );
    },
);
