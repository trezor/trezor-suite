import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type DashboardSendModalOptionsEventOption = 'account' | 'close';

type Attributes = {
    option: AttributeDef<DashboardSendModalOptionsEventOption>;
    filledSearch?: AttributeDef<boolean>;
};

export const dashboardSendModalOptionsEvent: EventDef<
    Attributes,
    EventType.DashboardSendModalOptions
> = {
    name: EventType.DashboardSendModalOptions,
    descriptionTrigger:
        'User selects one of the options - clicks on any of the accounts or clicks on close button',
    changelog: [{ version: '25.10.0', notes: 'added' }],

    attributes: {
        option: {
            changelog: [{ version: '25.10.0', notes: 'added' }],
            description:
                'User selection: `account` when selecting a specific account to send from, `close` when closing the modal',
        },
        filledSearch: {
            changelog: [{ version: '25.10.0', notes: 'added' }],
            description:
                'Whether the user typed in the account search field (`true`) or not (`false`)',
        },
    },
};
