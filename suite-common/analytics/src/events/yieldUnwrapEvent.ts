import { EventType } from '../constants';
import type { EventDef } from '../eventDefinition';
import {
    type WrappedNativeFlowAttributes,
    wrappedNativeFlowAttributes,
} from './yieldWrappedNativeAttributes';

export const yieldUnwrapEvent: EventDef<WrappedNativeFlowAttributes, EventType.YieldUnwrap> = {
    name: EventType.YieldUnwrap,
    descriptionTrigger: 'fired on native-token unwrap actions (e.g. WETH → ETH)',
    changelog: [{ version: '26.8.0', notes: 'added' }],

    attributes: wrappedNativeFlowAttributes,
};
