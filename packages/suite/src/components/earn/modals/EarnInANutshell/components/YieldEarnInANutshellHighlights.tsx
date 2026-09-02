import { FormattedList } from 'react-intl';

import { Translation } from '@suite/intl';
import {
    CoinVerticalIcon,
    CoinsIcon,
    HandCoinsIcon,
    LockSimpleIcon,
    PlusCircleIcon,
} from '@trezor/icons';

import {
    type EarnInANutshellHighlight,
    EarnInANutshellHighlights,
} from './EarnInANutshellHighlights';

interface YieldEarnInANutshellHighlightsProps {
    depositSymbol: string;
    vaultSymbol?: string;
    rewardsSymbols?: string[];
    isWrappedNativeVault?: boolean;
    nativeSymbol?: string;
}

export const YieldEarnInANutshellHighlights = ({
    depositSymbol,
    vaultSymbol,
    rewardsSymbols,
    isWrappedNativeVault = false,
    nativeSymbol,
}: YieldEarnInANutshellHighlightsProps) => {
    // For a wrapped-native vault the user perceives their asset as the native coin (e.g. ETH),
    // while `depositSymbol` is the wrapped token the vault holds (e.g. WETH).
    const supplySymbol = isWrappedNativeVault && nativeSymbol ? nativeSymbol : depositSymbol;

    const highlights: EarnInANutshellHighlight[] = [
        ...(isWrappedNativeVault && nativeSymbol
            ? [
                  {
                      icon: CoinVerticalIcon,
                      content: (
                          <Translation
                              id="TR_EARN_WETH_NUTSHELL_WRAP"
                              values={{ nativeSymbol, wrappedSymbol: depositSymbol }}
                          />
                      ),
                  },
              ]
            : []),
        {
            icon: LockSimpleIcon,
            content: (
                <Translation
                    id="TR_EARN_YIELD_NUTSHELL_DEPOSITED_AMOUNT"
                    values={{ supplySymbol }}
                />
            ),
        },
        {
            icon: HandCoinsIcon,
            content: (
                <Translation
                    id="TR_EARN_YIELD_NUTSHELL_COMPOUND_INTEREST"
                    values={{ supplySymbol }}
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
                              values={{ supplySymbol, vaultSymbol }}
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
