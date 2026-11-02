import { selectFlags, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import {
    selectWalletAssetContractAddress,
    selectWalletAssetDisplaySymbol,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import { useYieldVaultApy } from '@suite-common/earn-stablecoin';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { PiggyBankIcon, XIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { useFormatApy } from 'src/hooks/earn/useFormatApy';
import { useSelector } from 'src/hooks/suite';

type AssetDetailYieldBannerProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailYieldBanner = ({ assetKey }: AssetDetailYieldBannerProps) => {
    const { dispatch } = useServices(injectDispatch);
    const formatApy = useFormatApy();
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const displaySymbol = useSelector(state => selectWalletAssetDisplaySymbol(state, assetKey));
    const { earnTokenYieldBannerClosed } = useSelector(selectFlags);
    const apy = useYieldVaultApy({ symbol, contractAddress });

    if (
        contractAddress === undefined ||
        displaySymbol === undefined ||
        earnTokenYieldBannerClosed ||
        apy === null ||
        !isApyAvailable(apy)
    ) {
        return null;
    }

    const goToEarn = () => dispatch(gotoThunk({ routeName: 'suite-earn' }));
    const close = () => dispatch(setFlag({ key: 'earnTokenYieldBannerClosed', value: true }));

    return (
        <Banner
            icon={PiggyBankIcon}
            intent="brand"
            title={
                <Translation
                    id="TR_STAKING_BANNER_ETH_EARN_TITLE"
                    values={{ apy: formatApy(apy), displaySymbol }}
                />
            }
            description={
                <Translation id="TR_EARN_TOKEN_YIELD_BANNER_TEXT" values={{ displaySymbol }} />
            }
            rightContent={
                <>
                    <Banner.Button onClick={goToEarn}>
                        <Translation id="TR_STAKING_BANNER_ETH_EARN_BUTTON" />
                    </Banner.Button>
                    <Banner.IconButton
                        priority="secondary"
                        icon={XIcon}
                        onClick={close}
                        tooltip={{ content: <Translation id="TR_DISMISS" /> }}
                    />
                </>
            }
            data-testid="@asset-detail/yield-banner"
        />
    );
};
