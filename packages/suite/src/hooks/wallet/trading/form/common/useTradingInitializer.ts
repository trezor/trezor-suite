import { type TrezorDevice } from '@suite-common/suite-types';

import { useDevice } from 'src/hooks/suite';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { type TradingPageType } from 'src/types/trading/trading';

export type UseTradingCommonProps = {
    pageType: TradingPageType;
    isLoading: boolean;
};
export interface UseTradingCommonReturnProps {
    device: TrezorDevice | undefined;
}

export const useTradingInitializer = ({
    pageType: _pageType,
    isLoading: _isLoading,
}: UseTradingCommonProps): UseTradingCommonReturnProps => {
    const { device } = useDevice();

    useServerEnvironment();

    return {
        device,
    };
};
