import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'buy' | 'sell' | 'exchange'>;
    count: AttributeDef<number>;
    input?: AttributeDef<'crypto' | 'fiat' | 'base-currency' | 'fraction'>;
};

export const tradeReceivedQuotesEvent: EventDef<Attributes, EventType.TradeReceivedQuotes> = {
    name: EventType.TradeReceivedQuotes,
    descriptionTrigger:
        'Trading quotes (prices and offers) are fetched and received from provider services',
    changelog: [
        { version: '25.10.0', notes: 'added' },
        { version: '26.10.0', notes: 'added `input`' },
    ],

    attributes: {
        type: {
            description:
                'The type of trading transaction: `buy` for purchasing cryptocurrency, `sell` for selling, `exchange` for swapping',
            changelog: [{ version: '25.10.0', notes: 'added' }],
        },
        count: {
            changelog: [{ version: '25.10.0', notes: 'added' }],
            description: 'Number of quotes received from trading providers',
        },
        input: {
            changelog: [{ version: '26.10.0', notes: 'added' }],
            description:
                'The input the user last entered the amount in: `crypto` = crypto amount input, `fiat` = fiat amount input in the trade currency (buy and sell only), `base-currency` = amount line in the base currency from Suite settings, `fraction` = fraction button (sell and exchange only). Omitted when the amount was not entered by the user (e.g. prefilled after a redirect). Automatic quote refreshes report the input of the amount being refreshed.',
        },
    },
};
