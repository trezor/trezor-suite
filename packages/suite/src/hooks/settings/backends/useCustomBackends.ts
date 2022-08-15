import { useSelector } from '@suite-hooks';
import { getCustomBackends } from '@suite-common/wallet-utils';

export const useCustomBackends = () => {
    const blockchains = useSelector(state => state.wallet.blockchain);
    return getCustomBackends(blockchains);
};
