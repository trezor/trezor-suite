import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<string>;
    symbol: AttributeDef<string>;
};

export const accountsActionsEvent: EventDef<Attributes, EventType.AccountsActions> = {
    name: EventType.AccountsActions,
    descriptionTrigger:
        'User navigates between account page tabs and interacts with the account details page',
    changelog: [{ version: '23.12.0', notes: 'added' }],

    attributes: {
        action: {
            description: `The wallet route navigated to, or \`add-token\` when the Add token button is clicked. Observed values include:
- \`add-token\`: Add token button clicked
- \`wallet-details\`: account details tab
- \`wallet-index\`: account overview/index
- \`wallet-nfts\`: NFTs tab
- \`wallet-receive\`: receive tab
- \`wallet-send\`: send form
- \`wallet-sign-verify\`: sign & verify tab
- \`wallet-staking\`: staking tab
- \`wallet-tokens\`: tokens tab
- \`wallet-trading-buy\`: trading buy tab
- \`wallet-trading-exchange\`: trading exchange tab
- \`wallet-trading-sell\`: trading sell tab`,
            changelog: [{ version: '23.12.0', notes: 'added' }],
        },
        symbol: {
            description:
                'The blockchain network or asset symbol for the account that the action was performed on',
            changelog: [{ version: '23.12.0', notes: 'added' }],
        },
    },
};
