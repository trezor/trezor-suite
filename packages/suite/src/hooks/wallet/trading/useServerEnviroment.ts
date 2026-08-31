import { selectTradeServerEnvironment } from '@suite/settings';
import { useSelector } from '@suite-common/redux-utils';
import { tradeApi } from '@suite-common/trading';
export const useServerEnvironment = () => {
    const tradeServerEnvironment = useSelector(selectTradeServerEnvironment);

    if (tradeServerEnvironment) {
        tradeApi.setServersEnvironment(tradeServerEnvironment);
    }
};
