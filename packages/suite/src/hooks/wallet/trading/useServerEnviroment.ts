import { selectTradeServerEnvironment } from '@suite/settings';
import { tradeApi } from '@suite-common/trading';

import { useSelector } from '../../suite';

export const useServerEnvironment = () => {
    const tradeServerEnvironment = useSelector(selectTradeServerEnvironment);

    if (tradeServerEnvironment) {
        tradeApi.setServersEnvironment(tradeServerEnvironment);
    }
};
