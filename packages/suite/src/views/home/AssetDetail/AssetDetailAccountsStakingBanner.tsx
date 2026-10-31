import { gotoThunk } from '@suite/router';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { EarnEthBannerView } from 'src/components/wallet/StakingBanner/EarnEthBannerView';
import { StakingBannerView } from 'src/components/wallet/StakingBanner/StakingBannerView';
import {
    type StakingBannerAccounts,
    useStakingBanner,
} from 'src/components/wallet/StakingBanner/useStakingBanner';

type AssetDetailAccountsStakingBannerProps = {
    accounts: StakingBannerAccounts;
};

export const AssetDetailAccountsStakingBanner = ({
    accounts,
}: AssetDetailAccountsStakingBannerProps) => {
    const { dispatch } = useServices(injectDispatch);
    const { kind, earnEthApy, close } = useStakingBanner(accounts);

    const goToEarn = () => dispatch(gotoThunk({ routeName: 'suite-earn' }));

    if (kind === undefined) {
        return null;
    }

    return kind === 'earnEth' ? (
        <EarnEthBannerView
            networkSymbol={accounts[0].symbol}
            apy={earnEthApy}
            onExplore={goToEarn}
            onClose={close}
        />
    ) : (
        <StakingBannerView accounts={accounts} onExplore={goToEarn} onClose={close} />
    );
};
