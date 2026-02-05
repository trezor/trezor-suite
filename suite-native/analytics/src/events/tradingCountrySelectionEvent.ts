import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import type { CountryChangeAction, CountryChangeContextCheck } from '../definitions';

type Attributes = {
    type: AttributeDef<CountryChangeContextCheck>;
    action: AttributeDef<CountryChangeAction>;
};

export const tradingCountrySelectionEvent: EventDef<Attributes, EventType.TradingCountrySelection> =
    {
        name: EventType.TradingCountrySelection,
        descriptionTrigger:
            'User interacts with country selection modal. Either selects country or dismisses it.',
        changelog: [{ version: '25.11.1', notes: 'added' }],
        attributes: {
            type: {
                changelog: [{ version: '25.11.1', notes: 'added' }],
                description: `- \`sell\` - country is set via sell form in trading;
- \`buy\` - country is set via buy form in trading; settings - country is set through settings;
- \`onboarding\` - country is set as part of first start or after app update (if not viewed before)`,
            },
            action: {
                changelog: [{ version: '25.11.1', notes: 'added' }],
                description: `
- \`submitDefault\` - user selected country based on system region;
- \`submitCustom\` - user selected different country than system region;
- \`cancel\` - user dismissed country setting`,
            },
        },
    };
