import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

export type AppCopyToClipboardType = 'contractAddress' | 'fingerprint' | 'policyId';

type Attributes = {
    from: AttributeDef<'asset-detail'>;
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
