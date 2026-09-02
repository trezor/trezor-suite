import { Translation, type TranslationKey } from '@suite/intl';
import { SettingsAnchor, gotoThunk } from '@suite/router';
import { selectIsTorEnabled } from '@suite/tor';
import { useDispatch } from '@suite-common/redux-utils';
import { type TradingType } from '@suite-common/trading';
import { Banner, Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

interface TradingUtilsTorWarningProps {
    tradingType: TradingType;
    noOffer: boolean;
    showButton?: boolean;
}

const getTorWarningTranslationId = (tradingType: TradingType, noOffer: boolean): TranslationKey => {
    if (!noOffer) {
        return 'TR_TRADING_DISABLE_TOR';
    }

    switch (tradingType) {
        case 'exchange':
            return 'TR_TRADING_NO_OFFER_SWAP_TOR';
        case 'buy':
        case 'sell':
            return 'TR_TRADING_NO_OFFER_BUY_OR_SELL_TOR';
        default:
            return 'TR_TRADING_DISABLE_TOR';
    }
};

export const TradingUtilsTorWarning = ({
    tradingType,
    noOffer,
    showButton = false,
}: TradingUtilsTorWarningProps) => {
    const dispatch = useDispatch();

    const isTorEnabled = useSelector(selectIsTorEnabled);
    if (!isTorEnabled) return null;

    const handleGoToSettings = () => {
        dispatch(gotoThunk({ routeName: 'settings-index', anchor: SettingsAnchor.Tor }));
    };

    const translationId = getTorWarningTranslationId(tradingType, noOffer);

    return (
        <Banner
            intent="warning"
            rightContent={
                showButton && (
                    <Banner.Button onClick={handleGoToSettings}>
                        <Translation id="TR_GO_TO_SETTINGS" />
                    </Banner.Button>
                )
            }
            description={
                <Column gap={12}>
                    <Translation id={translationId} />
                </Column>
            }
        />
    );
};
