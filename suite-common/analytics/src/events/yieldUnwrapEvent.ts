import { EventType } from '../constants';
import type { EventDef } from '../eventDefinition';
import {
    type WrappedNativeFlowAttributes,
    wrappedNativeFlowAttributes,
} from './yieldWrappedNativeAttributes';

export const yieldUnwrapEvent: EventDef<WrappedNativeFlowAttributes, EventType.YieldUnwrap> = {
    name: EventType.YieldUnwrap,
    descriptionTrigger: 'fired on native-token unwrap actions (e.g. WETH → ETH)',
    changelog: [
        { version: '26.8.0', notes: 'added' },
        { version: '26.8.1', notes: 'reported from mobile as well' },
        {
            version: '26.11.0',
            notes: 'Resolution is tied to a broadcast transaction; consecutive transactions with the same outcome are each reported. Mobile duration uses the stored broadcast time when a pending flow is reopened.',
        },
    ],

    attributes: wrappedNativeFlowAttributes,
};
