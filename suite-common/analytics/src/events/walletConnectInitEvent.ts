import { EventType } from '../constants';
import type { EventDef } from '../eventDefinition';

type Attributes = Record<never, never>;

export const walletConnectInitEvent: EventDef<Attributes, EventType.WalletConnectInit> = {
    name: EventType.WalletConnectInit,
    descriptionTrigger: 'Suite started with WalletConnect enabled',
    changelog: [{ version: '25.5.0', notes: 'added' }],
    attributes: {},
};
