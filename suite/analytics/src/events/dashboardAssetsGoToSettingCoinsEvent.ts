import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {};

export const dashboardAssetsGoToSettingCoinsEvent: EventDef<
    Attributes,
    EventType.DashboardAssetsGoToSettingCoins
> = {
    name: EventType.DashboardAssetsGoToSettingCoins,
    descriptionTrigger: 'Fired on click on the Activate new coins on the dashboard view.',
    changelog: [{ version: '26.1.2', notes: 'added' }],

    attributes: {},
};
