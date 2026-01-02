import { TradingType } from '@suite-common/trading';
import { Banner, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { Translation, TranslationKey } from 'src/components/suite/Translation';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';

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

    const { isTorEnabled } = useSelector(selectTorState);
    if (!isTorEnabled) return null;

    const handleGoToSettings = () => {
        dispatch(goto('settings-index', { anchor: SettingsAnchor.Tor }));
    };

    const translationId = getTorWarningTranslationId(tradingType, noOffer);

    return (
        <Banner
            intent="warning"
            rightContent={
                !showButton && (
                    <Banner.Button onClick={handleGoToSettings}>
                        <Translation id="TR_GO_TO_SETTINGS" />
                    </Banner.Button>
                )
            }
        >
            <Column gap={spacings.sm}>
                <Translation id={translationId} />
            </Column>
        </Banner>
    );
};
