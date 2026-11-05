import { gotoThunk } from '@suite/router';
import { selectAccountEarnSplit } from '@suite-common/assets';
import { type AccountKey } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useStakingRate } from '#src/hooks/earn/useStakingRate';
import { useSelector } from '#src/hooks/suite';
import { AssetDetailEarnCard } from '#src/views/home/AssetDetail/AssetDetailEarnCard';

type AccountAssetEarnProps = {
    accountKey: AccountKey;
};

/** The account's coin split as the asset detail splits the wallet's; View all opens Staking. */
export const AccountAssetEarn = ({ accountKey }: AccountAssetEarnProps) => {
    const { dispatch } = useServices(injectDispatch);
    const split = useSelector(state => selectAccountEarnSplit(state, accountKey));
    const { rate: apy } = useStakingRate({ symbol: split?.symbol, accountKey });

    if (split === undefined) {
        return null;
    }

    return (
        <AssetDetailEarnCard
            {...split}
            apy={apy}
            onViewAll={() =>
                dispatch(gotoThunk({ routeName: 'wallet-staking', preserveParams: true }))
            }
            data-testid="@wallet/account-assets/earn"
        />
    );
};
