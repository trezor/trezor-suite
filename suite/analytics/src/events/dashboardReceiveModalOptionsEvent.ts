import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type DashboardReceiveModalOptionsEventOption = 'account' | 'close' | 'addAccount';

type Attributes = {
    option: AttributeDef<DashboardReceiveModalOptionsEventOption>;
    filledSearch?: AttributeDef<boolean>;
};

export const dashboardReceiveModalOptionsEvent: EventDef<
    Attributes,
    EventType.DashboardReceiveModalOptions
> = {
    name: EventType.DashboardReceiveModalOptions,
    descriptionTrigger:
        'User selects one of the options - clicks on any of the accounts or clicks on close button or Add Account button',
    changelog: [{ version: '25.10.0', notes: 'added' }],

    attributes: {
        option: {
            changelog: [{ version: '25.10.0', notes: 'added' }],
            description:
                'User selection: `account` when selecting a specific account to receive to, `close` when closing the modal, `addAccount` when clicking to add a new account',
        },
        filledSearch: {
            changelog: [{ version: '25.10.0', notes: 'added' }],
            description:
                'Whether the user typed in the account search field (`true`) or not (`false`)',
        },
    },
};
