import { EventType } from '../constants';
import type { EventDef } from '../eventDefinition';
import {
    type WrappedNativeFlowAttributes,
    wrappedNativeFlowAttributes,
} from './yieldWrappedNativeAttributes';

export const yieldWrapEvent: EventDef<WrappedNativeFlowAttributes, EventType.YieldWrap> = {
    name: EventType.YieldWrap,
    descriptionTrigger: 'fired on native-token wrap actions (e.g. ETH → WETH)',
    changelog: [{ version: '26.8.0', notes: 'added' }],

    attributes: wrappedNativeFlowAttributes,
};
