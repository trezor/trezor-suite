import { Translation, type TranslationKey } from '@suite/intl';
import { type TradingType, tradingThunks } from '@suite-common/trading';
import { type IconComponent, SubTabs, type SubTabsProps } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { MinusIcon, PlusIcon, RepeatIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

type TradingTypeTab = {
    type: TradingType;
    icon: IconComponent;
    translationId: TranslationKey;
};

const tradingTypeTabs: TradingTypeTab[] = [
    { type: 'exchange', icon: RepeatIcon, translationId: 'TR_TRADING_SWAP' },
    { type: 'buy', icon: PlusIcon, translationId: 'TR_NAV_BUY' },
    { type: 'sell', icon: MinusIcon, translationId: 'TR_NAV_SELL' },
];

type TradingTypeTabsProps = {
    activeType?: TradingType;
    onTypeChange: (type: TradingType) => void;
    size?: SubTabsProps['size'];
};

export const TradingTypeTabs = ({ activeType, onTypeChange, size }: TradingTypeTabsProps) => {
    const { dispatch } = useServices(injectDispatch);

    const selectType = (type: TradingType) => () => {
        if (type === activeType) {
            return;
        }

        dispatch(tradingThunks.clearQuotesAndParamsByTradingTypeThunk({ tradingType: type }));
        onTypeChange(type);
    };

    return (
        <SubTabs activeItemId={activeType} size={size}>
            {tradingTypeTabs.map(tab => (
                <SubTabs.Item
                    key={tab.type}
                    data-testid={`@trading/menu/wallet-trading-${tab.type}`}
                    id={tab.type}
                    icon={tab.icon}
                    onClick={selectType(tab.type)}
                >
                    <Translation id={tab.translationId} />
                </SubTabs.Item>
            ))}
        </SubTabs>
    );
};
