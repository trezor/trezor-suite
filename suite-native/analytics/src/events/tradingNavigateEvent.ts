import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { TradingType } from '@suite-common/trading';

import { EventType } from '../constants';
import type { TradingNavigateFrom } from '../definitions';

export type TradingNavigateAction = 'navigate' | 'cancel';

type Attributes = {
    action: AttributeDef<TradingNavigateAction>;
    type: AttributeDef<TradingType>;
    from: AttributeDef<TradingNavigateFrom>;
    networkSymbol?: AttributeDef<string>;
    contractAddress?: AttributeDef<string>;
};

export const tradingNavigateEvent: EventDef<Attributes, EventType.TradingNavigate> = {
    name: EventType.TradingNavigate,
    descriptionTrigger:
        'When navigation from other place to trading happens, entry point of trade flow',
    changelog: [{ version: '25.5.1', notes: 'Added' }],
    attributes: {
        action: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        type: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                '`buy`/`sell`/`exchange` - set via trade form; `settings` - set via settings (currently on iOS only); `onboarding` - set via initial app onboarding or after user updated the app',
        },
        from: {
            changelog: [
                { version: '25.5.1', notes: 'added' },
                { version: '25.10.1', notes: 'added trade/buy, trade/sell, trade/exchange' },
            ],
            description:
                'Where does this navigation originate from. `trade` - trading screen from tabbar. `trade/buy` | `trade/sell` | `trade/exchange` - tab in trading screen (e.g. trade/sell = from sell tab)',
        },
        networkSymbol: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        contractAddress: { changelog: [{ version: '25.5.1', notes: 'added' }] },
    },
};
