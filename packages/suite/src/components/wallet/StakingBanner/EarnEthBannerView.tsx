import { Translation } from '@suite/intl';
import { type NetworkSymbol, getDisplaySymbol } from '@suite-common/wallet-config';
import { Banner } from '@trezor/components';
import { PiggyBankIcon, XIcon } from '@trezor/icons';

import { useFormatApy } from 'src/hooks/earn/useFormatApy';

type EarnEthBannerViewProps = {
    networkSymbol: NetworkSymbol;
    apy: number | null;
    onExplore: () => void;
    onClose: () => void;
};

export const EarnEthBannerView = ({
    networkSymbol,
    apy,
    onExplore,
    onClose,
}: EarnEthBannerViewProps) => {
    const formatApyValue = useFormatApy();

    const displaySymbol = getDisplaySymbol(networkSymbol);

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
                    <Banner.Button onClick={onExplore}>
                        <Translation id="TR_STAKING_BANNER_ETH_EARN_BUTTON" />
                    </Banner.Button>
                    <Banner.IconButton
                        priority="secondary"
                        icon={XIcon}
                        onClick={onClose}
                        tooltip={{ content: <Translation id="TR_DISMISS" /> }}
                    />
                </>
            }
        />
    );
};
