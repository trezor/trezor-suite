import { selectTradeServerEnvironment } from '@suite/settings';
import { tradeApi } from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';

export const useServerEnvironment = () => {
    const tradeServerEnvironment = useSelector(selectTradeServerEnvironment);

    if (tradeServerEnvironment) {
        tradeApi.setServersEnvironment(tradeServerEnvironment);
    }
};
