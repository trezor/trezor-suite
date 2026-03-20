import type { AttributeDef, EventDef } from '@suite-common/analytics';

import type { AttributeDoc, EventDoc } from '../types';
import { normalizeChangelog } from './normalizeChangelog';

const toAttributeDoc = ([name, attribute]: [string, AttributeDef<unknown>]): [
    string,
    AttributeDoc,
] => [
    name,
    {
        description: attribute.description,
        runtimeType: undefined,
        changelog: normalizeChangelog(attribute.changelog),
    },
];

type NormalizableEvent = (
    | EventDef<Record<string, AttributeDef<unknown>>, string>
    | EventDef<unknown, string>
) & { platform?: string; attributes?: Record<string, AttributeDef<unknown>> };

const toEventDoc = (event: NormalizableEvent): [string, EventDoc] => {
    const attributes = Object.fromEntries(
        (Object.entries(event.attributes ?? {}) as [string, AttributeDef<unknown>][]).map(
            toAttributeDoc,
        ),
    );

    const attributeChangelogs = Object.values(attributes).flatMap(
        attr => attr.changelog.entries || [],
    );

    const allChangelogEntries = [...(event.changelog ?? []), ...attributeChangelogs];

    return [
        event.name,
        {
            name: event.name,
            description: event.description,
            descriptionTrigger: event.descriptionTrigger,
            possibleImprovements: event.possibleImprovements,
            changelog: normalizeChangelog(allChangelogEntries),
            attributes,
            platform: event.platform ?? '',
        },
    ];
};

export const normalizeEvents = (events: NormalizableEvent[]): Record<string, EventDoc> =>
    Object.fromEntries(events.map(toEventDoc));

export type { AttributeDoc };
