import { Translation } from '@suite/intl';
import {
    type TradingProviderInfo,
    type TradingTradeType,
    getStatusUrl,
    tradeApi,
} from '@suite-common/trading';
import { Row, TextButton } from '@trezor/components';
import { ArrowSquareOutIcon } from '@trezor/icons';

import { getTradingProviderName } from 'src/views/wallet/trading/common/TradingDetail/utils';
import { TradingIcon } from 'src/views/wallet/trading/common/TradingIcon';

type TradingDetailProviderStatusLinkProps = {
    provider?: TradingProviderInfo;
    trade: TradingTradeType;
};

export const TradingDetailProviderStatusLink = ({
    provider,
    trade,
}: TradingDetailProviderStatusLinkProps) => {
    const statusUrl = getStatusUrl(provider, trade);

    if (!statusUrl) {
        return null;
    }

    return (
        <Row gap={8}>
            {!!provider?.logo && (
                <TradingIcon iconUrl={tradeApi.getProviderLogoUrl(provider.logo)} />
            )}
            <TextButton
                size="small"
                intent="neutral"
                isUnderlined
                iconRight={ArrowSquareOutIcon}
                href={statusUrl}
                target="_blank"
                data-testid="@trading/transaction/detail/status-link"
            >
                <Translation
                    id="TR_TRADING_DETAIL_CHECK_STATUS"
                    values={{ providerName: getTradingProviderName(provider) }}
                />
            </TextButton>
        </Row>
    );
};
