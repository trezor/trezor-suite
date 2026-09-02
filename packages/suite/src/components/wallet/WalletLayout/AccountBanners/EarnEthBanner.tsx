import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectFlags, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { events as sharedEvents } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { type NetworkSymbol, getDisplaySymbol } from '@suite-common/wallet-config';
import { Banner } from '@trezor/components';
import { PiggyBankIcon, XIcon } from '@trezor/icons';

import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';
import { useSelector } from 'src/hooks/suite';

type EarnEthBannerProps = {
    networkSymbol: NetworkSymbol;
    apy: number | null;
};

export const EarnEthBanner = ({ networkSymbol, apy }: EarnEthBannerProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();
    const { earnEthBannerClosed } = useSelector(selectFlags);

    const displaySymbol = getDisplaySymbol(networkSymbol);

    const closeBanner = () => {
        dispatch(setFlag({ key: 'earnEthBannerClosed', value: true }));

        analytics.report({
            type: sharedEvents.yieldNavigateEvent.name,
            payload: {
                action: 'cancel',
                from: 'account-banner',
                to: 'earn-dashboard',
                networkSymbol,
            },
        });
    };

    const goToEarnDashboard = () => {
        dispatch(gotoThunk({ routeName: 'suite-earn' }));

        analytics.report({
            type: sharedEvents.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'account-banner',
                to: 'earn-dashboard',
                networkSymbol,
            },
        });
    };

    if (earnEthBannerClosed) {
        return null;
    }

    return (
        <Banner
            icon={PiggyBankIcon}
            intent="brand"
            title={
                apy === null ? (
                    <Translation
                        id="TR_STAKING_BANNER_ETH_EARN_TITLE_NO_RATE"
                        values={{ displaySymbol }}
                    />
                ) : (
                    <Translation
                        id="TR_STAKING_BANNER_ETH_EARN_TITLE"
                        values={{ apy: formatApyValue(apy), displaySymbol }}
                    />
                )
            }
            description={
                <Translation id="TR_STAKING_BANNER_ETH_EARN_TEXT" values={{ displaySymbol }} />
            }
            rightContent={
                <>
                    <Banner.Button onClick={goToEarnDashboard}>
                        <Translation id="TR_STAKING_BANNER_ETH_EARN_BUTTON" />
                    </Banner.Button>
                    <Banner.IconButton
                        priority="secondary"
                        icon={XIcon}
                        onClick={closeBanner}
                        tooltip={{ content: <Translation id="TR_DISMISS" /> }}
                    />
                </>
            }
        />
    );
};
