import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type DashboardActivateAssetsModalEventSource = 'empty-wallet' | 'my-assets';

type Attributes = {
    source: AttributeDef<DashboardActivateAssetsModalEventSource>;
};

export const dashboardActivateAssetsModalEvent: EventDef<
    Attributes,
    EventType.DashboardActivateAssetsModal
> = {
    name: EventType.DashboardActivateAssetsModal,
    descriptionTrigger:
        'User opens the Activate Assets (add networks) modal. `source` tells us whether it was triggered from the empty-wallet CTA ("Get started") or from the My Assets section ("Add networks").',
    changelog: [{ version: '26.3.0', notes: 'added' }],

    attributes: {
        source: {
            changelog: [{ version: '26.3.0', notes: 'added' }],
        },
    },
};
