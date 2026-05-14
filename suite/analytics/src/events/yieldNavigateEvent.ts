import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    from: AttributeDef<
        | 'earn-dashboard'
        | 'account-defi-tokens'
        | 'deposit-in-a-nutshell-modal'
        | 'deposit-morpho-modal'
        | 'claim-select-account-modal'
        | 'deposit-form'
        | 'withdraw-form'
        | 'claim-form'
    >;
    to: AttributeDef<
        | 'earn-dashboard'
        | 'deposit-form'
        | 'withdraw-form'
        | 'claim-form'
        | 'deposit-in-a-nutshell-modal'
        | 'deposit-morpho-modal'
        | 'claim-select-account-modal'
    >;
    networkSymbol?: AttributeDef<string>;
    contractAddress?: AttributeDef<string>;
};

export const yieldNavigateEvent: EventDef<Attributes, EventType.YieldNavigate> = {
    name: EventType.YieldNavigate,
    descriptionTrigger: 'fired when the user navigates from any yield button to yield sections',
    changelog: [{ version: '26.5.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        from: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        to: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        networkSymbol: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        contractAddress: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
    },
};
