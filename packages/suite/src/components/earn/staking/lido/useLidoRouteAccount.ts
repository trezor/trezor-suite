import { type Account } from '@suite-common/wallet-types';
import { getLidoDeployment } from '@trezor/network-ethereum-suite-common';

import { useEarnRouteAccount } from '../../utils/useEarnRouteAccount';

export const useLidoRouteAccount = (): Account | undefined => {
    const { account } = useEarnRouteAccount();

    return account && getLidoDeployment(account.symbol) !== null ? account : undefined;
};
