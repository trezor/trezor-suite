import { type TradeServerEnvironment } from '@suite-common/trading';
import { Banner } from '@trezor/components';

interface TradingEnvironmentWarningProps {
    tradingEnvironment: TradeServerEnvironment | undefined;
}

export const TradingEnvironmentWarning = ({
    tradingEnvironment,
}: TradingEnvironmentWarningProps) => {
    if (!tradingEnvironment || tradingEnvironment === 'production') {
        return null;
    }

    return <Banner intent="warning" description={`Trading environment: ${tradingEnvironment}`} />;
};
