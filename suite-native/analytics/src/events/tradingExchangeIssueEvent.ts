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
    descriptionTrigger: 'An issue is shown during exchange transaction preview',
    changelog: [{ version: '26.8.1', notes: 'added' }],

    attributes: {
        issue: {
            changelog: [{ version: '26.8.1', notes: 'added' }],
            description:
                'Issue shown during transaction preview: `high-risk` | `high-risk-with-price-impact` | `slippage-too-low` | `price-impact-warning` | `price-impact-critical`',
        },
        isSimulation: {
            changelog: [{ version: '26.8.1', notes: 'added' }],
            description:
                'Whether the issue was derived from transaction simulation (`true`) or quote data (`false`)',
        },
    },
};
