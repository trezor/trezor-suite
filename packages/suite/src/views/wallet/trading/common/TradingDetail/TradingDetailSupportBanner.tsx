import { Translation } from '@suite/intl';
import { type TradingProviderInfo } from '@suite-common/trading';
import { Banner, Link } from '@trezor/components';

import { getTradingProviderName } from 'src/views/wallet/trading/common/TradingDetail/utils';

type TradingDetailSupportBannerProps = {
    provider?: TradingProviderInfo;
};

export const TradingDetailSupportBanner = ({ provider }: TradingDetailSupportBannerProps) => {
    if (!provider?.supportUrl) {
        return null;
    }

    const { supportUrl } = provider;

    return (
        <Banner
            intent="neutral"
            icon
            description={
                <Translation
                    id="TR_TRADING_PROCESSING_SUPPORT"
                    values={{
                        providerName: getTradingProviderName(provider),
                        link: chunks => <Link href={supportUrl}>{chunks}</Link>,
                    }}
                />
            }
        />
    );
};
