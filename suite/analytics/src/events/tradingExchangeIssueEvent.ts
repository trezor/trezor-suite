import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type TradingExchangeIssue =
    | 'high-risk'
    | 'high-risk-with-price-impact'
    | 'slippage-too-low'
    | 'price-impact-warning'
    | 'price-impact-critical';

type Attributes = {
    issue: AttributeDef<TradingExchangeIssue>;
    isSimulation: AttributeDef<boolean>;
};

export const tradingExchangeIssueEvent: EventDef<Attributes, EventType.TradingExchangeIssue> = {
    name: EventType.TradingExchangeIssue,
    descriptionTrigger: 'An issue is shown on the swap confirm step',
    changelog: [{ version: '26.9.0', notes: 'added' }],

    attributes: {
        issue: {
            changelog: [{ version: '26.9.0', notes: 'added' }],
            description:
                'Issue shown on the swap confirm step: `high-risk` | `high-risk-with-price-impact` | `slippage-too-low` | `price-impact-warning` | `price-impact-critical`',
        },
        isSimulation: {
            changelog: [{ version: '26.9.0', notes: 'added' }],
            description:
                'Whether the issue was derived from transaction simulation (`true`) or quote data (`false`)',
        },
    },
};
