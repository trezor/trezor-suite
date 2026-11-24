import { TradingTokenMetadataProvider } from '@suite-common/trading';
import { TradingExchangeAllowance } from '@trezor/suite';

export const TradingExchangeAllowancePage = () => (
    <TradingTokenMetadataProvider>
        <TradingExchangeAllowance />
    </TradingTokenMetadataProvider>
);
