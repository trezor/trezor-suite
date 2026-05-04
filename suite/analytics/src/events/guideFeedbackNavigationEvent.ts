import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'overview' | 'bug' | 'suggestion'>;
};

export const guideFeedbackNavigationEvent: EventDef<Attributes, EventType.GuideFeedbackNavigation> =
    {
        name: EventType.GuideFeedbackNavigation,
        descriptionTrigger: 'User navigates to the feedback section in Guide > Report Bug & Feedback',
        changelog: [{ version: '1.11.0', notes: 'added' }],

        attributes: {
            type: {
                description: 'The feedback page type: "overview" for main feedback page, "bug" for bug report form, "suggestion" for feature suggestion form',
                changelog: [{ version: '1.11.0', notes: 'added' }],
            },
        },
    };
