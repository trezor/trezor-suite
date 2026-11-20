import { type AddressType } from '@suite-common/wallet-types';

import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type AppCopyToClipboardType = 'contractAddress' | 'fingerprint' | 'policyId';

export type AppCopyToClipboardFrom = 'asset-detail';

export const COPY_TO_CLIPBOARD_TYPE_BY_ADDRESS_TYPE: Record<AddressType, AppCopyToClipboardType> = {
    contract: 'contractAddress',
    fingerprint: 'fingerprint',
    policyId: 'policyId',
};

type Attributes = {
    from: AttributeDef<AppCopyToClipboardFrom>;
    type: AttributeDef<AppCopyToClipboardType>;
};

export const appCopyToClipboardEvent: EventDef<Attributes, EventType.AppCopyToClipboard> = {
    name: EventType.AppCopyToClipboard,
    descriptionTrigger: 'User clicks a copy button to copy a value to the clipboard',
    changelog: [{ version: '26.11.0', notes: 'added' }],

    attributes: {
        from: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description:
                'Where the value was copied from: `asset-detail` for the asset detail menu',
        },
        type: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description:
                'What was copied: `contractAddress` for a token contract, `fingerprint` and `policyId` for Cardano tokens',
        },
    },
};
