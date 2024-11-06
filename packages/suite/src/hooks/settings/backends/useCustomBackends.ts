import { getCustomBackends } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

export const useCustomBackends = () => {
    const blockchains = useSelector(state => state.wallet.blockchain);

    return getCustomBackends(blockchains);
};
