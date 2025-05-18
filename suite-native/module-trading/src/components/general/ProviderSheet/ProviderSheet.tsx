import { BuyTrade, ExchangeTrade, SellFiatTrade } from 'invity-api';

import { TradingProviderInfo, TradingTradeType } from '@suite-common/trading';
import { BottomSheetFlashList } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { ESTIMATED_HEADER_HEIGHT, SimpleSheetHeader } from '../SimpleSheetHeader';
import { PROVIDER_LIST_ITEM_HEIGHT, ProviderListItem } from './ProviderListItem';

export type ProvidersSheetProps<T extends BuyTrade | SellFiatTrade | ExchangeTrade> = {
    quotes: T[];
    isVisible: boolean;
    onClose: () => void;
    onQuoteSelect: (quote: T) => void;
    selectedQuote?: T;
    providerInfos: { [name: string]: TradingProviderInfo };
};

const EXTRA_LIST_PADDING = 20;

const keyExtractor = <T extends TradingTradeType>(item: T) => item.orderId ?? '';
const getEstimatedListHeight = (itemsCount: number) =>
    itemsCount * PROVIDER_LIST_ITEM_HEIGHT + ESTIMATED_HEADER_HEIGHT + EXTRA_LIST_PADDING;

const getProviderInfo = (
    id: string | undefined,
    providerInfos: ProvidersSheetProps<TradingTradeType>['providerInfos'],
) =>
    providerInfos[id ?? ''] ?? {
        companyName: '',
        logo: '',
    };

export const ProviderSheet = <T extends BuyTrade | SellFiatTrade | ExchangeTrade>({
    quotes,
    isVisible,
    onClose,
    onQuoteSelect,
    selectedQuote,
    providerInfos,
}: ProvidersSheetProps<T>) => {
    const { translate } = useTranslate();
    const onQuoteSelectCallback = (quote: T) => {
        onQuoteSelect(quote);
        onClose();
    };

    return (
        <BottomSheetFlashList<T>
            isVisible={isVisible}
            onClose={onClose}
            renderItem={({ item }) => {
                const provider = getProviderInfo(item.exchange, providerInfos);

                const { companyName, logo } = provider;

                if (!companyName || !item.orderId) {
                    return null;
                }

                return (
                    <ProviderListItem
                        orderId={item.orderId}
                        companyName={companyName ?? ''}
                        logo={logo ?? ''}
                        onPress={() => onQuoteSelectCallback(item)}
                        isSelected={item.exchange === selectedQuote?.exchange}
                    />
                );
            }}
            handleComponent={() => (
                <SimpleSheetHeader
                    onClose={onClose}
                    title={translate('moduleTrading.tradingScreen.provider')}
                />
            )}
            data={quotes}
            estimatedListHeight={getEstimatedListHeight(quotes.length)}
            estimatedItemSize={PROVIDER_LIST_ITEM_HEIGHT}
            keyExtractor={keyExtractor}
        />
    );
};
