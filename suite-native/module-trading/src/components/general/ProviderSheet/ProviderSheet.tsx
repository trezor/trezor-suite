import { TradingProviderInfo, TradingTradeType } from '@suite-common/trading';
import { BottomSheetFlashList } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { ESTIMATED_HEADER_HEIGHT, SimpleSheetHeader } from '../SimpleSheetHeader';
import { PROVIDER_LIST_ITEM_ESTIMATED_HEIGHT, ProviderListItem } from './ProviderListItem';

export type ProvidersSheetProps<T extends TradingTradeType> = {
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
    itemsCount * PROVIDER_LIST_ITEM_ESTIMATED_HEIGHT + ESTIMATED_HEADER_HEIGHT + EXTRA_LIST_PADDING;

const getProviderInfo = (
    id: string | undefined,
    providerInfos: ProvidersSheetProps<TradingTradeType>['providerInfos'],
) =>
    providerInfos[id ?? ''] ?? {
        companyName: '',
        logo: '',
    };

export const ProviderSheet = <T extends TradingTradeType>({
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

                return (
                    <ProviderListItem
                        onPress={onQuoteSelectCallback}
                        isSelected={item.orderId === selectedQuote?.orderId}
                        quote={item}
                        provider={provider}
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
            estimatedItemSize={PROVIDER_LIST_ITEM_ESTIMATED_HEIGHT}
            keyExtractor={keyExtractor}
            extraData={selectedQuote?.orderId}
        />
    );
};
