import { useState } from 'react';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { SearchInput, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import type { RootStackParamList, RootStackRoutes } from '@suite-native/navigation';

import { AddressList } from '../components/general/AccountList/AddressList';

export const TradingReceiveAddressPickerScreen = () => {
    const { translate } = useTranslate();
    const [searchQuery, setSearchQuery] = useState('');
    const { params } =
        useRoute<RouteProp<RootStackParamList, RootStackRoutes.TradingReceiveAddress>>();

    return (
        <Screen
            isScrollable={false}
            header={
                <ScreenHeader
                    title={<Translation id="moduleTrading.accountScreen.receiveAddressTitle" />}
                    closeActionType="back"
                />
            }
        >
            <VStack flex={1} spacing="sp24">
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={translate('moduleTrading.accountScreen.searchPlaceholder')}
                    size="large"
                    autoCorrect={false}
                    testId="@trading/receive-address/search"
                    autoCapitalize="none"
                />
                <AddressList
                    accountKey={params.accountKey}
                    searchQuery={searchQuery}
                    tradingType={params.tradingType}
                />
            </VStack>
        </Screen>
    );
};
