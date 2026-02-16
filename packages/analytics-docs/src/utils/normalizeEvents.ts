import type { AttributeDef, EventDef } from '@suite-common/analytics';

import type { AttributeDoc, EventDoc } from '../types';
import { normalizeChangelog } from './normalizeChangelog';

function toAttributeDoc([name, attribute]: [string, AttributeDef<unknown>]): [
    string,
    AttributeDoc,
] {
    return [
        name,
        {
            description: attribute.description,
            runtimeType: undefined,
            changelog: normalizeChangelog(attribute.changelog),
        },
    ];
}

function toEventDoc(event: EventDef<unknown, unknown> & { platform?: string }): [string, EventDoc] {
    const attributes = Object.fromEntries(
        (Object.entries(event.attributes ?? {}) as [string, AttributeDef<unknown>][]).map(
            toAttributeDoc,
        ),
    );

    return [
        event.name,
        {
            name: event.name,
            description: event.description,
            descriptionTrigger: event.descriptionTrigger,
            possibleImprovements: event.possibleImprovements,
            changelog: normalizeChangelog(event.changelog),
            attributes,
            platform: event.platform ?? '',
        },
    ];
}

export const normalizeEvents = (
    events: Array<EventDef<unknown, unknown> & { platform?: string }>,
): Record<string, EventDoc> => Object.fromEntries(events.map(toEventDoc));

export type { AttributeDoc };
