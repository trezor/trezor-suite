import { useSelector } from 'react-redux';

import {
    TradingRootState,
    TradingType,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

type TradeDetailProviderSupportButtonProps = {
    provider: string;
    tradeType: TradingType;
};

export const TradeDetailProviderSupportButton = ({
    provider,
    tradeType,
}: TradeDetailProviderSupportButtonProps) => {
    const openLink = useOpenLink();
    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, provider, tradeType),
    );

    if (!providerInfo?.supportUrl) {
        return null;
    }
    const { supportUrl } = providerInfo;

    const handleProviderSupportPress = () => openLink(supportUrl);

    return (
        <Button colorScheme="tertiaryElevation0" onPress={handleProviderSupportPress}>
            <Translation id="moduleTrading.tradeHistory.detail.buttons.providerSupport" />
        </Button>
    );
};
