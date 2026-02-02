import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { TradingType } from '@suite-common/trading';

import { EventType } from '../constants';
import type { CountryChangeContext } from '../types';

export type TradingParameterChangedParameter =
    | 'fiat'
    | 'cryptoFrom'
    | 'cryptoTo'
    | 'paymentMethod'
    | 'provider'
    | 'country';

type Attributes = {
    type: AttributeDef<TradingType | CountryChangeContext>;
    parameter: AttributeDef<TradingParameterChangedParameter>;
};

export const tradingParameterChangedEvent: EventDef<Attributes, EventType.TradingParameterChanged> =
    {
        name: EventType.TradingParameterChanged,
        descriptionTrigger:
            'User changes a trading parameter (fiat, crypto, payment method, provider, country).',
        changelog: [{ version: '1.0.0', notes: 'added' }],
        attributes: {
            type: { changelog: [{ version: '1.0.0', notes: 'added' }] },
            parameter: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        },
    };
