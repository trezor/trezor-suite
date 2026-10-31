import { gotoThunk } from '@suite/router';
import {
    selectWalletAssetContractAddress,
    selectWalletAssetUnstakedAccounts,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { EarnEthBannerView } from 'src/components/wallet/StakingBanner/EarnEthBannerView';
import { StakingBannerView } from 'src/components/wallet/StakingBanner/StakingBannerView';
import {
    type StakingBannerAccounts,
    isStakingBannerAccounts,
    useStakingBanner,
} from 'src/components/wallet/StakingBanner/useStakingBanner';
import { useSelector } from 'src/hooks/suite';

type AssetDetailAccountsStakingBannerProps = {
    accounts: StakingBannerAccounts;
};

const AssetDetailAccountsStakingBanner = ({ accounts }: AssetDetailAccountsStakingBannerProps) => {
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

type AssetDetailStakingBannerProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailStakingBanner = ({ assetKey }: AssetDetailStakingBannerProps) => {
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const accounts = useSelector(state => selectWalletAssetUnstakedAccounts(state, assetKey));

    if (contractAddress !== undefined || !isStakingBannerAccounts(accounts)) {
        return null;
    }

    return <AssetDetailAccountsStakingBanner accounts={accounts} />;
};
