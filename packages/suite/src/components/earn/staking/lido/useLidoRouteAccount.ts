import { type Account } from '@suite-common/wallet-types';

import { selectIsLidoStakingEnabled } from '#src/actions/wallet/lido/lidoStakingAccess';
import { useSelector } from '#src/hooks/suite/useSelector';

import { useEarnRouteAccount } from '../../utils/useEarnRouteAccount';

/**
 * The account a Lido page is opened for. None while Lido staking is not opted into: a page opened
 * by its address then has no account to work with, as for an account that does not exist.
 */
export const useLidoRouteAccount = (): Account | undefined => {
    const isLidoStakingEnabled = useSelector(selectIsLidoStakingEnabled);
    const { account } = useEarnRouteAccount();

    return isLidoStakingEnabled ? account : undefined;
};
