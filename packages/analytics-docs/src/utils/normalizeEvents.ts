import type { AttributeDef, EventDef } from '@suite-common/analytics';

import type { AttributeDoc, EventDoc } from '../types';
import { normalizeChangelog } from './normalizeChangelog';

export const normalizeEvents = (
    events: Array<EventDef<any, any> & { platform?: string }>,
): Record<string, EventDoc> =>
    Object.fromEntries(
        events.map(event => {
            const attributes: Record<string, AttributeDoc> = Object.fromEntries(
                (Object.entries(event.attributes ?? {}) as [string, AttributeDef<unknown>][]).map(
                    ([name, attribute]) => [
                        name,
                        {
                            description: attribute.description,
                            runtimeType: undefined,
                            changelog: normalizeChangelog(attribute.changelog),
                        },
                    ],
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
                    platform: event.platform,
                },
            ];
        }),
    );

export { AttributeDoc };
