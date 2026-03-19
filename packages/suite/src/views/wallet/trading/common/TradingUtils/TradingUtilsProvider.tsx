import { Translation } from '@suite/intl';
import { type TradingUtilsProvidersProps, invityAPI } from '@suite-common/trading';
import { Row } from '@trezor/components';

import { TradingIcon } from '../TradingIcon';

interface TradingUtilsProviderProps {
    exchange?: string;
    className?: string;
    providers?: TradingUtilsProvidersProps;
}

export const TradingUtilsProvider = ({
    exchange,
    providers,
    className,
}: TradingUtilsProviderProps) => {
    const provider = providers && exchange ? providers[exchange] : null;
    const providerName = provider?.brandName ?? provider?.companyName;

    return (
        <Row gap={8} className={className} data-testid="@trading/offers/quote/provider">
            {provider ? (
                <>
                    {provider.logo && (
                        <TradingIcon iconUrl={invityAPI.getProviderLogoUrl(provider.logo)} />
                    )}
                    {providerName}
                </>
            ) : (
                <>{exchange ? exchange : <Translation id="TR_TRADING_UNKNOWN_PROVIDER" />}</>
            )}
        </Row>
    );
};
