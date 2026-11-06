import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

export type NavigateFlowType =
    | 'buy'
    | 'sell'
    | 'exchange'
    | 'send'
    | 'receive'
    | 'earn'
    | 'account-detail'
    | 'account-list'
    | 'asset'
    | 'hidden-tokens';

export const NAVIGATE_FLOW_FROM = [
    'dashboard/header',
    'sidebar',
    'tab',
    'home-asset-table',
    'asset',
    'asset-detail',
    'dashboard',
    'menu',
] as const;

export type NavigateFlowFrom = (typeof NAVIGATE_FLOW_FROM)[number];

type Attributes = {
    action: AttributeDef<'navigate'>;
    type: AttributeDef<NavigateFlowType>;
    from: AttributeDef<NavigateFlowFrom>;
    networkSymbol?: AttributeDef<string>;
};

export const navigateFlowEvent: EventDef<Attributes, EventType.NavigateFlow> = {
    name: EventType.NavigateFlow,
    descriptionTrigger:
        'User clicks a button that starts a buy, sell, exchange, send, receive or earn flow, or opens an account detail, account list, asset detail or hidden tokens. Shared by desktop and mobile and meant to cover these flows from every place in the app',
    changelog: [{ version: '26.11.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description: '`navigate` when the user proceeds to the flow',
        },
        type: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description: 'The flow the user navigates to',
        },
        from: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description:
                'Where the navigation started: `dashboard/header` for the dashboard header buttons, `sidebar` for the main navigation sidebar, `tab` for an account row in the sidebar accounts list on desktop and the Accounts tab on mobile, `home-asset-table` for an asset row in the Home asset table, `asset` for the asset detail Earn section on desktop, `asset-detail` for an account in the asset detail accounts list and for the asset detail Earn section on mobile, `dashboard` for the Home asset table filter menu, `menu` for the asset detail menu on mobile',
        },
        networkSymbol: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description:
                'The network symbol of the asset the flow starts with (e.g., `btc`, `eth`). Empty when no asset is preselected, as on the dashboard',
        },
    },
};
