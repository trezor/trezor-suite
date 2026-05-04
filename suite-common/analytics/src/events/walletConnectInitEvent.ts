import { EventType } from '../constants';
import type { EventDef } from '../eventDefinition';

type Attributes = Record<never, never>;

export const walletConnectInitEvent: EventDef<Attributes, EventType.WalletConnectInit> = {
    name: EventType.WalletConnectInit,
    descriptionTrigger: 'Suite application initializes with WalletConnect protocol support enabled',
    changelog: [{ version: '25.5.0', notes: 'added' }],
    attributes: {},
};
