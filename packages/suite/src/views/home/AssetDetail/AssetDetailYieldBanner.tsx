import { injectDesktopAnalytics } from '@suite/analytics';
import { AssetSymbol } from '@suite/assets';
import { closeTokenYieldBanner, selectIsTokenYieldBannerClosed } from '@suite/flags';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { events as sharedEvents } from '@suite-common/analytics';
import {
    selectWalletAssetContractAddress,
    selectWalletAssetSymbol,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { useYieldVaultApy } from '@suite-common/earn-stablecoin';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { PiggyBankIcon, XIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { useFormatApy } from '#src/hooks/earn/useFormatApy';
import { useSelector } from '#src/hooks/suite';

type AssetDetailYieldBannerProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailYieldBanner = ({ assetKey }: AssetDetailYieldBannerProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const formatApy = useFormatApy();
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const tokenSymbol = useSelector(state => selectWalletAssetTokenSymbol(state, assetKey));
    const tokenDecimals = useSelector(state => selectWalletAssetTokenDecimals(state, assetKey));
    const bannerKey = `${symbol}-${contractAddress?.toLowerCase()}`;
    const isBannerClosed = useSelector(state => selectIsTokenYieldBannerClosed(state, bannerKey));
    const apy = useYieldVaultApy({ symbol, contractAddress, tokenSymbol, tokenDecimals });

    if (
        symbol === undefined ||
        contractAddress === undefined ||
        isBannerClosed ||
        apy === null ||
        !isApyAvailable(apy)
    ) {
        return null;
    }

    const symbolLabel = (
        <AssetSymbol networkSymbol={symbol} contractAddress={contractAddress} isTruncated />
    );

    const reportYieldNavigate = (action: 'continue' | 'cancel') =>
        analytics.report({
            type: sharedEvents.yieldNavigateEvent.name,
            payload: {
                action,
                from: 'asset-detail-banner',
                to: 'earn-dashboard',
                networkSymbol: symbol,
            },
        });

    const goToEarn = () => {
        dispatch(gotoThunk({ routeName: 'suite-earn' }));
        reportYieldNavigate('continue');
    };
    const close = () => {
        dispatch(closeTokenYieldBanner(bannerKey));
        reportYieldNavigate('cancel');
    };

    return (
        <Banner
            icon={PiggyBankIcon}
            intent="brand"
            title={
                <Translation
                    id="TR_STAKING_BANNER_ETH_EARN_TITLE"
                    values={{ apy: formatApy(apy), displaySymbol: symbolLabel }}
                />
            }
            description={
                <Translation
                    id="TR_EARN_TOKEN_YIELD_BANNER_TEXT"
                    values={{ displaySymbol: symbolLabel }}
                />
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
