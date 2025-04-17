import { TradingProviderInfo, TradingTradeType } from '@suite-common/trading';
import { BottomSheetFlashList } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { ESTIMATED_HEADER_HEIGHT, SimpleSheetHeader } from '../SimpleSheetHeader';
import { PROVIDER_LIST_ITEM_HEIGHT, ProviderListItem } from './ProviderListItem';

export type ProvidersSheetProps = {
    quotes: TradingTradeType[];
    isVisible: boolean;
    onClose: () => void;
    onQuoteSelect: (quote: TradingTradeType) => void;
    selectedQuote?: TradingTradeType;
    providerInfos: { [name: string]: TradingProviderInfo };
};

const EXTRA_LIST_PADDING = 20;

const keyExtractor = (item: TradingTradeType) => item.orderId ?? '';
const getEstimatedListHeight = (itemsCount: number) =>
    itemsCount * PROVIDER_LIST_ITEM_HEIGHT + ESTIMATED_HEADER_HEIGHT + EXTRA_LIST_PADDING;

const getProviderInfo = (
    id: string | undefined,
    providerInfos: ProvidersSheetProps['providerInfos'],
) =>
    providerInfos[id ?? ''] ?? {
        companyName: '',
        logo: '',
    };

export const ProvidersSheet = ({
    quotes,
    isVisible,
    onClose,
    onQuoteSelect,
    selectedQuote,
    providerInfos,
}: ProvidersSheetProps) => {
    const { translate } = useTranslate();
    const onQuoteSelectCallback = (quote: TradingTradeType) => {
        onQuoteSelect(quote);
        onClose();
    };

    return (
        <BottomSheetFlashList<TradingTradeType>
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
                        isSelected={item.orderId === selectedQuote?.orderId}
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
