import type { EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    from: AttributeDef<
        | 'earn-dashboard'
        | 'account-banner'
        | 'account-defi-tokens'
        | 'deposit-in-a-nutshell-modal'
        | 'deposit-legal-modal'
        | 'claim-select-account-modal'
        | 'deposit-form'
        | 'withdraw-form'
        | 'claim-form'
        | 'choose-account-sheet'
        | 'account-detail'
        | 'insufficient-balance-screen'
    >;
    to: AttributeDef<
        | 'earn-dashboard'
        | 'deposit-form'
        | 'withdraw-form'
        | 'claim-form'
        | 'deposit-in-a-nutshell-modal'
        | 'deposit-legal-modal'
        | 'claim-select-account-modal'
        | 'choose-account-sheet'
        | 'account-detail'
        | 'insufficient-balance-screen'
    >;
    networkSymbol?: AttributeDef<string>;
    vaultId?: AttributeDef<string>;
};

export const yieldNavigateEvent: EventDef<Attributes, EventType.YieldNavigate> = {
    name: EventType.YieldNavigate,
    descriptionTrigger: 'fired when the user navigates between stablecoin yield sections',
    changelog: [
        { version: '26.5.0', notes: 'added' },
        { version: '26.7.1', notes: 'moved to suite-common, reported from mobile as well' },
    ],

    attributes: {
        action: {
            description:
                'User action: `continue` to proceed to the destination, `cancel` when the user leaves without continuing',
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        from: {
            description:
                'Origin of the navigation. On mobile, `deposit-in-a-nutshell-modal` = How yield works screen and `deposit-legal-modal` = consents screen (named after their desktop counterparts); `choose-account-sheet`, `account-detail` and `insufficient-balance-screen` are mobile-only, `account-defi-tokens` and `claim-select-account-modal` are desktop-only; `account-banner` = in-account earn promo banner',
            changelog: [
                { version: '26.5.0', notes: 'added' },
                {
                    version: '26.7.1',
                    notes: 'added `choose-account-sheet`, `account-detail`, `insufficient-balance-screen` values (mobile)',
                },
                { version: '26.8.0', notes: 'added `account-banner` value' },
            ],
        },
        to: {
            description: 'Destination of the navigation',
            changelog: [
                { version: '26.5.0', notes: 'added' },
                {
                    version: '26.7.1',
                    notes: 'added `choose-account-sheet`, `account-detail`, `insufficient-balance-screen` values (mobile)',
                },
            ],
        },
        networkSymbol: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        vaultId: {
            description: 'Internal vault identifier (vault.id), unique per Morpho vault',
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
    },
};
