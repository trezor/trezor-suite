import { Dimensions } from 'react-native';

import { TradingProviderInfo, TradingTradeType } from '@suite-common/trading';
import { BottomSheetFlashList, Box } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { SimpleSheetHeader } from '../SimpleSheetHeader';
import { PROVIDER_LIST_ITEM_ESTIMATED_HEIGHT, ProviderListItem } from './ProviderListItem';
import { TradingTypeAwareContextMessage } from '../TradingTypeAwareContextMessage';

export type ProvidersSheetProps<T extends TradingTradeType> = {
    quotes: T[];
    isVisible: boolean;
    onClose: () => void;
    onQuoteSelect: (quote: T) => void;
    selectedQuote?: T;
    providerInfos: { [name: string]: TradingProviderInfo };
};

const keyExtractor = <T extends TradingTradeType>(item: T) => item.orderId ?? '';

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

    const screenHeight = Dimensions.get('screen').height;

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
                <>
                    <SimpleSheetHeader
                        onClose={onClose}
                        title={translate('moduleTrading.tradingScreen.provider')}
                    />
                    {/* context message cant scroll for some use cases (UK banner) so it cant be in items */}
                    <Box paddingHorizontal="sp16" paddingVertical="sp4">
                        <TradingTypeAwareContextMessage />
                    </Box>
                </>
            )}
            data={quotes}
            estimatedListHeight={screenHeight}
            estimatedItemSize={PROVIDER_LIST_ITEM_ESTIMATED_HEIGHT}
            keyExtractor={keyExtractor}
            extraData={selectedQuote?.orderId}
        />
    );
};
