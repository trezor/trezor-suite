import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { TradingType } from '@suite-common/trading';

import { EventType } from '../constants';
import type { CountryChangeContext } from '../types';

export type TradingParameterChangedType = TradingType | CountryChangeContext;
export type TradingParameterChangedParameter =
    | 'fiat'
    | 'cryptoFrom'
    | 'cryptoTo'
    | 'paymentMethod'
    | 'provider'
    | 'country';

type Attributes = {
    type: AttributeDef<TradingParameterChangedType>;
    parameter: AttributeDef<TradingParameterChangedParameter>;
};

export const tradingParameterChangedEvent: EventDef<Attributes, EventType.TradingParameterChanged> =
    {
        name: EventType.TradingParameterChanged,
        descriptionTrigger: 'When user changes parameter of the form, before confirm_trade',
        changelog: [{ version: '25.5.1', notes: 'added' }],
        attributes: {
            type: {
                changelog: [
                    { version: '25.5.1', notes: 'added' },
                    { version: '25.11.1', notes: "extended with `'settings' | 'onboarding'`" },
                ],
                description:
                    '`buy`/`sell`/`exchange` - set via trade form; `settings` - set via settings (currently on iOS only); `onboarding` - set via initial app onboarding or after user updated the app',
            },
            parameter: {
                changelog: [{ version: '25.5.1', notes: 'added' }],
                description: 'Which form parameter was changed',
            },
        },
    };
