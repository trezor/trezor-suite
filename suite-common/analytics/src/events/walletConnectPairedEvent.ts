import { EventType } from '../constants';
import type { EventDef } from '../eventDefinition';

type Attributes = {};

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
export const walletConnectPairedEvent: EventDef<Attributes, EventType.WalletConnectPaired> = {
    name: EventType.WalletConnectPaired,
    descriptionTrigger: 'WalletConnect pairing string added',
    changelog: [{ version: '25.5.0', notes: 'added' }],
    attributes: {},
};
