import { FormattedList } from 'react-intl';

import { Translation } from '@suite/intl';

import {
    type EarnInANutshellHighlight,
    EarnInANutshellHighlights,
} from './EarnInANutshellHighlights';

interface YieldEarnInANutshellHighlightsProps {
    supplySymbol: string;
    vaultSymbol?: string;
    rewardsSymbols?: string[];
}

export const YieldEarnInANutshellHighlights = ({
    supplySymbol,
    vaultSymbol,
    rewardsSymbols,
}: YieldEarnInANutshellHighlightsProps) => {
    const highlights: EarnInANutshellHighlight[] = [
        {
            icon: 'lockSimple',
            content: (
                <Translation id="TR_EARN_YIELD_NUTSHELL_AMOUNT_LOCKED" values={{ supplySymbol }} />
            ),
        },
        {
            icon: 'handCoins',
            content: <Translation id="TR_EARN_YIELD_NUTSHELL_COMPOUND_INTEREST" />,
        },
        ...(vaultSymbol !== undefined
            ? [
                  {
                      icon: 'coins' as const,
                      content: (
                          <Translation
                              id="TR_EARN_YIELD_NUTSHELL_VAULT_TOKENS"
                              values={{ supplySymbol, vaultSymbol }}
                          />
                      ),
                  },
              ]
            : []),
        ...(rewardsSymbols !== undefined && rewardsSymbols.length > 0
            ? [
                  {
                      icon: 'plusCircle' as const,
                      content: (
                          <Translation
                              id="TR_EARN_YIELD_NUTSHELL_PROTOCOL_REWARDS"
                              values={{
                                  rewardsSymbol: (
                                      <FormattedList type="conjunction" value={rewardsSymbols} />
                                  ),
                              }}
                          />
                      ),
                  },
              ]
            : []),
    ];

    return <EarnInANutshellHighlights items={highlights} />;
};
