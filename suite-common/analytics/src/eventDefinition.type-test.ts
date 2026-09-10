import type { AttributeDef, EventDef, EventInstance } from './eventDefinition';

type AttributeEventDefinition = EventDef<
    {
        requiredAttribute: AttributeDef<string>;
        optionalAttribute?: AttributeDef<number>;
    },
    'test/attribute-event'
>;

type EmptyAttributeEventDefinition = EventDef<Record<never, never>, 'test/empty-attribute-event'>;

type PayloadEventDefinition = EventDef<boolean, 'test/payload-event'>;

// Arbitrary payload with dynamic keys that are not listed as individual attributes.
type ArbitraryRecordPayloadEventDefinition = EventDef<
    Record<string, number>,
    'test/record-payload-event'
>;

const attributeEvent: EventInstance<AttributeEventDefinition> = {
    type: 'test/attribute-event',
    payload: { requiredAttribute: 'value' },
};

const attributeEventWithOptionalAttribute: EventInstance<AttributeEventDefinition> = {
    type: 'test/attribute-event',
    payload: { requiredAttribute: 'value', optionalAttribute: 42 },
};

// @ts-expect-error Attribute events with defined keys require a payload.
const attributeEventWithoutPayload: EventInstance<AttributeEventDefinition> = {
    type: 'test/attribute-event',
};

const attributeEventWithoutRequiredAttribute: EventInstance<AttributeEventDefinition> = {
    type: 'test/attribute-event',
    // @ts-expect-error Required attributes remain required in the event payload.
    payload: {},
};

const emptyAttributeEvent: EventInstance<EmptyAttributeEventDefinition> = {
    type: 'test/empty-attribute-event',
};

const emptyAttributeEventWithPayload: EventInstance<EmptyAttributeEventDefinition> = {
    type: 'test/empty-attribute-event',
    // @ts-expect-error Empty attribute maps produce events without a payload.
    payload: {},
};

const payloadEvent: EventInstance<PayloadEventDefinition> = {
    type: 'test/payload-event',
    payload: true,
};

// @ts-expect-error Payload-based events require their direct payload type.
const payloadEventWithoutPayload: EventInstance<PayloadEventDefinition> = {
    type: 'test/payload-event',
};

const recordPayloadEvent: EventInstance<ArbitraryRecordPayloadEventDefinition> = {
    type: 'test/record-payload-event',
    payload: { btc_normal: 3, eth_normal: 1 },
};

// @ts-expect-error Record payload events require their direct payload type.
const recordPayloadEventWithoutPayload: EventInstance<ArbitraryRecordPayloadEventDefinition> = {
    type: 'test/record-payload-event',
};

const recordPayloadEventWithEmptyPayload: EventInstance<ArbitraryRecordPayloadEventDefinition> = {
    type: 'test/record-payload-event',
    payload: {},
};

const recordPayloadEventWithWrongValueType: EventInstance<ArbitraryRecordPayloadEventDefinition> = {
    type: 'test/record-payload-event',
    // @ts-expect-error Record payload values must match the declared value type.
    payload: { btc_normal: 'not-a-number' },
};

type EventDefinitionUnion =
    AttributeEventDefinition | EmptyAttributeEventDefinition | PayloadEventDefinition;

const eventFromDefinitionUnion: EventInstance<EventDefinitionUnion> = {
    type: 'test/payload-event',
    payload: false,
};

const mismatchedEventFromDefinitionUnion: EventInstance<EventDefinitionUnion> = {
    type: 'test/empty-attribute-event',
    // @ts-expect-error Union conversion keeps the payload paired with its event name.
    payload: false,
};

void attributeEvent;
void attributeEventWithOptionalAttribute;
void attributeEventWithoutPayload;
void attributeEventWithoutRequiredAttribute;
void emptyAttributeEvent;
void emptyAttributeEventWithPayload;
void payloadEvent;
void payloadEventWithoutPayload;
void recordPayloadEvent;
void recordPayloadEventWithoutPayload;
void recordPayloadEventWithEmptyPayload;
void recordPayloadEventWithWrongValueType;
void eventFromDefinitionUnion;
void mismatchedEventFromDefinitionUnion;
