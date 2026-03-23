import { type InvityServerEnvironment } from '@suite-common/trading';
import { Banner } from '@trezor/components';

interface TradingEnvironmentWarningProps {
    tradingEnvironment: InvityServerEnvironment | undefined;
}

export const TradingEnvironmentWarning = ({
    tradingEnvironment,
}: TradingEnvironmentWarningProps) => {
    if (!tradingEnvironment || tradingEnvironment === 'production') {
        return null;
    }

    return <Banner intent="warning" description={`Trading environment: ${tradingEnvironment}`} />;
};
