import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    type TradingType,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

type TradingHistoryDetailSupportBannerProps = {
    providerName?: string;
    tradeType: TradingType;
};

export const TradingHistoryDetailSupportBanner = ({
    providerName,
    tradeType,
}: TradingHistoryDetailSupportBannerProps) => {
    const provider = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, providerName, tradeType),
    );

    const openLink = useOpenLink();

    const providerDisplayName = provider?.companyName ?? providerName;
    const supportUrl = provider?.supportUrl;

    if (!providerDisplayName || !supportUrl) {
        return null;
    }

    const handleContactProvider = () => {
        openLink(supportUrl);
    };

    return (
        <BannerInline
            buttonLabel={
                <Translation
                    id="moduleTrading.tradeHistory.detail.actionButton.contactProvider"
                    values={{ providerName: providerDisplayName }}
                />
            }
            buttonProps={{ testID: '@trading-history/detail/support/button' }}
            iconName="question"
            onButtonPress={handleContactProvider}
            testID="@trading-history/detail/support"
            title={<Translation id="moduleTrading.tradeHistory.detail.supportBanner.title" />}
        />
    );
};
