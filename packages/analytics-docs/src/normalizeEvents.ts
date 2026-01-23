import type { EventDef, AttributeDef } from '@suite-common/analytics-types';

import { normalizeChangelog } from './normalizeChangelog';
import { AttributeDoc, EventDoc } from './types';

export const normalizeEvents = (
    events: Array<EventDef<any, any> & { platform?: string }>,
): Record<string, EventDoc> =>
    Object.fromEntries(
        events.map(event => {
            const attributes: Record<string, AttributeDoc> = Object.fromEntries(
                Object.entries(event.attributes ?? {}).map(
                    ([name, attribute]: [string, AttributeDef<unknown>]) => [
                        name,
                        {
                            description: attribute.description,
                            limitations: attribute.limitations,
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
                    changelog: normalizeChangelog(event.changelog),
                    attributes,
                    platform: event.platform,
                },
            ];
        }),
    );
