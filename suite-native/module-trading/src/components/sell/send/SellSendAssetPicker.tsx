import { useCallback, useRef, useState } from 'react';
import { type TextInput } from 'react-native';

import { tradingSellActions } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { HStack } from '@suite-native/atoms';
import { useWatch } from '@suite-native/forms';
import { sellActions } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { SellSendAmountInput } from './SellSendAmountInput';
import { useTradeableAssetChange } from '../../../hooks/general/form/useTradeableAssetChange';
import { useMyAssetPickerNavigation } from '../../../hooks/general/useMyAssetPickerNavigation';
import { useTradingMyAssets } from '../../../hooks/general/useTradingMyAssets';
import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { SelectTradeableAssetButton } from '../../general/SelectTradeableAssetButton';

const ASSET_PICKER_TEST_ID = '@trading/sell/asset-send-button';

export const SellSendAssetPicker = () => {
    const inputRef = useRef<TextInput>(null);
    const form = useSellFormContext();
    const { control, setValue } = form;
    const [shouldFocusInput, setShouldFocusInput] = useState<boolean>(false);
    const myAssets = useTradingMyAssets('sell');
    const selectedValue = useWatch({ control, name: 'sendAsset' });
    const setSelectedValue = useCallback(
        (asset: TradeableAsset) => setValue('sendAsset', asset),
        [setValue],
    );

    const changeAsset = useTradeableAssetChange({
        form,
        tradingType: 'sell',
        selectedValue,
        setSelectedValue,
        analyticsParameter: 'cryptoFrom',
        amountField: 'cryptoStringAmount',
        getAssetChangedAction: sellActions.sendAssetChanged,
        getSetTradingAccountKeyAction: tradingSellActions.setTradingAccountKey,
    });

    const onAssetSelect = useCallback(
        (asset: TradeableAsset, account: Account) => {
            changeAsset(asset, account);

            if (shouldFocusInput) {
                setShouldFocusInput(false);
                // CryptoAmountInput is rendered disabled allow changes to propagate.
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 0);
            }
        },
        [changeAsset, shouldFocusInput],
    );

    const showAssetsScreen = useMyAssetPickerNavigation({
        assets: myAssets,
        onAssetSelect,
        tradingType: 'sell',
    });

    const showAssetsScreenAndFocusInput = useCallback(() => {
        setShouldFocusInput(true);
        showAssetsScreen();
    }, [showAssetsScreen]);

    return (
        <HStack justifyContent="space-between" alignItems="center">
            <SelectTradeableAssetButton
                onPress={showAssetsScreen}
                selectedAsset={selectedValue}
                buttonColorProps={{ intent: 'brand', priority: 'primary' }}
                testID={ASSET_PICKER_TEST_ID}
                caret
            />
            <SellSendAmountInput ref={inputRef} showAssetsScreen={showAssetsScreenAndFocusInput} />
        </HStack>
    );
};
