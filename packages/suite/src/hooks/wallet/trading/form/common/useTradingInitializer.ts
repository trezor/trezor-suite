import { useDevice } from '@suite/device';
import { type TrezorDevice } from '@suite-common/suite-types';

import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';

export interface UseTradingCommonReturnProps {
    device: TrezorDevice | undefined;
}

export const useTradingInitializer = (): UseTradingCommonReturnProps => {
    const { device } = useDevice();

    useServerEnvironment();

    return {
        device,
    };
};
