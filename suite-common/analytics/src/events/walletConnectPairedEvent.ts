import { EventType } from '../constants';
import type { EventDef } from '../eventDefinition';

type Attributes = Record<never, never>;

export const walletConnectPairedEvent: EventDef<Attributes, EventType.WalletConnectPaired> = {
    name: EventType.WalletConnectPaired,
    descriptionTrigger: 'WalletConnect pairing string added',
    changelog: [{ version: '25.5.0', notes: 'added' }],
    attributes: {},
};
