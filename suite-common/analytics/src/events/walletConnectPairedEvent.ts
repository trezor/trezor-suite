import { EventType } from '../constants';
import type { EventDef } from '../eventDefinition';

type Attributes = Record<never, never>;

export const walletConnectPairedEvent: EventDef<Attributes, EventType.WalletConnectPaired> = {
    name: EventType.WalletConnectPaired,
    descriptionTrigger: 'User successfully pairs Suite with a WalletConnect enabled DApp',
    changelog: [{ version: '25.5.0', notes: 'added' }],
    attributes: {},
};
