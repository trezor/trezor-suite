import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type TradingType } from '@suite-common/trading';

import { EventType } from '../constants';
import { type CountryChangeContext } from '../definitions';

type TradingParameter =
    'fiat' | 'cryptoFrom' | 'cryptoTo' | 'paymentMethod' | 'provider' | 'country';

type Attributes = {
    type: AttributeDef<TradingType | CountryChangeContext>;
    parameter: AttributeDef<TradingParameter>;
};

export const tradingParameterChangedEvent: EventDef<Attributes, EventType.TradingParameterChanged> =
    {
        name: EventType.TradingParameterChanged,
        descriptionTrigger: 'User changes parameter of the form, before confirming the trade.',
        changelog: [
            { version: '25.5.1', notes: 'added' },
            {
                version: '25.11.1',
                notes: '`type` extended with `settings` and `onboarding` options',
            },
        ],

        attributes: {
            type: {
                changelog: [
                    { version: '25.5.1', notes: 'added' },
                    {
                        version: '25.11.1',
                        notes: 'extended with `settings` and `onboarding` values',
                    },
                ],
                description: `Type of trade or context:
- \`buy\`: purchasing crypto
- \`sell\`: selling crypto
- \`exchange\`: swapping
- \`settings\`: country setting
- \`onboarding\`: initial setup`,
            },
            parameter: {
                changelog: [{ version: '25.5.1', notes: 'added' }],
                description: `The parameter that was changed:
- \`fiat\`: fiat amount
- \`cryptoFrom\`: sending crypto
- \`cryptoTo\`: receiving crypto
- \`paymentMethod\`: payment type
- \`provider\`: exchange provider
- \`country\`: country selection`,
            },
        },
    };
