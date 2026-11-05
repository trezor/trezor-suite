import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    networkSymbol: AttributeDef<string>;
};

export const assetsTransactionDetailEvent: EventDef<Attributes, EventType.AssetsTransactionDetail> =
    {
        name: EventType.AssetsTransactionDetail,
        descriptionTrigger:
            'User opens a transaction detail from the asset detail transaction list',
        changelog: [{ version: '26.11.0', notes: 'added' }],

        attributes: {
            networkSymbol: {
                changelog: [{ version: '26.11.0', notes: 'added' }],
                description: 'The network symbol of the transaction (e.g., `btc`, `eth`)',
            },
        },
    };
