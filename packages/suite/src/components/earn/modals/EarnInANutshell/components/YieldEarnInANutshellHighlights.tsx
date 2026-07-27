import { FormattedList } from 'react-intl';

import { Translation } from '@suite/intl';
import { CoinsIcon, HandCoinsIcon, LockSimpleIcon, PlusCircleIcon } from '@trezor/icons';

import {
    type EarnInANutshellHighlight,
    EarnInANutshellHighlights,
} from './EarnInANutshellHighlights';

interface YieldEarnInANutshellHighlightsProps {
    depositSymbol: string;
    vaultSymbol?: string;
    rewardsSymbols?: string[];
}

export const YieldEarnInANutshellHighlights = ({
    depositSymbol,
    vaultSymbol,
    rewardsSymbols,
}: YieldEarnInANutshellHighlightsProps) => {
    const highlights: EarnInANutshellHighlight[] = [
        {
            icon: LockSimpleIcon,
            content: (
                <Translation
                    id="TR_EARN_YIELD_NUTSHELL_DEPOSITED_AMOUNT"
                    values={{ supplySymbol: depositSymbol }}
                />
            ),
        },
        {
            icon: HandCoinsIcon,
            content: (
                <Translation
                    id="TR_EARN_YIELD_NUTSHELL_COMPOUND_INTEREST"
                    values={{ supplySymbol: depositSymbol }}
                />
            ),
        },
        ...(vaultSymbol !== undefined
            ? [
                  {
                      icon: CoinsIcon,
                      content: (
                          <Translation
                              id="TR_EARN_YIELD_NUTSHELL_VAULT_TOKENS"
                              values={{ supplySymbol: depositSymbol, vaultSymbol }}
                          />
                      ),
                  },
              ]
            : []),
        ...(rewardsSymbols !== undefined && rewardsSymbols.length > 0
            ? [
                  {
                      icon: PlusCircleIcon,
                      content: (
                          <Translation
                              id="TR_EARN_YIELD_NUTSHELL_CLAIM_REWARDS"
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
