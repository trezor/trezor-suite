### G01 | thread PRRT_kwDOCNxUSM6BUnjx | PR #27590 (@matusbalascak) Self-composed `withdraw` / `redeem` calldata for stablecoin yield
FILE: packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutput.tsx:119
TOPIC (current): typescript-type-safety [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  ```suggestion
    Object.keys(yieldStrings).includes(evmTxType)
```

### G02 | thread PRRT_kwDOCNxUSM6BUoKa | PR #27590 (@matusbalascak) Self-composed `withdraw` / `redeem` calldata for stablecoin yield
FILE: packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutput.tsx:118
TOPIC (current): typescript-type-safety [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  ```suggestion
): evmTxType is keyof typeof yieldStrings  =>
```

### G03 | thread PRRT_kwDOCNxUSM6BUsbo | PR #27590 (@matusbalascak) Self-composed `withdraw` / `redeem` calldata for stablecoin yield
FILE: packages/suite/src/components/earn/yield/hooks/useYieldFlow.ts:170
TOPIC (current): nullability-and-sentinel-values [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  isn't better to pass undefined than empty strings so a react component could decide if it should display some placeholder for example?

### G04 | thread PRRT_kwDOCNxUSM6BUvxw | PR #27590 (@matusbalascak) Self-composed `withdraw` / `redeem` calldata for stablecoin yield
FILE: packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutput.tsx:205
TOPIC (current): acknowledgements-and-pointers [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  👍

### G05 | thread PRRT_kwDOCNxUSM6BVoxk | PR #27590 (@matusbalascak) Self-composed `withdraw` / `redeem` calldata for stablecoin yield
FILE: packages/suite/src/actions/wallet/stablecoin-yield/composeYieldWithdrawTransaction.ts:111
TOPIC (current): performance-and-memoization [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  NIT: It could run in concurrently:

```ts
    const nonceTask = dispatch(
        ethereumGetCurrentNonceThunk({ selectedAccount: account }),
    ).unwrap();

    const estimatedFeeTask = TrezorConnect.blockchainEstimateFee({
        coin: account.symbol,
        identity: getAccountIdentity(account),
        request: {
            blocks: [2],
            specific: {
                from: account.descriptor,
                to: vaultAddress,
                data: builderResult.data,
                value: '0x0',
            },
        },
    });

   const [{nonce}, estimatedFee] = await Promise.all([nonceTask, estimatedFeeTask] as const)
```

### G06 | thread PRRT_kwDOCNxUSM6BVo8_ | PR #27590 (@matusbalascak) Self-composed `withdraw` / `redeem` calldata for stablecoin yield
FILE: packages/suite/src/actions/wallet/stablecoin-yield/composeYieldWithdrawTransaction.ts:87
TOPIC (current): acknowledgements-and-pointers [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  👍

### G07 | thread PRRT_kwDOCNxUSM6BYOnF | PR #27584 (@izmy) Control Earn actions through message-system feature flags
FILE: packages/suite/src/components/earn/dashboard/yield/EarnYieldAccountOpportunity.tsx:44
TOPIC (current): single-source-of-truth [override]
COMMENTS: 3 (reviewer: 1)
REVIEWER SAID:
  There's going to be a new endpoint:

```ts
    const { address: vaultAddress } = await getYieldVault({
        routeParams: {
            networkSymbol: account.symbol,
            vaultId: vault.id,
        },
    });
```

https://github.com/trezor/trezor-suite/pull/27497/changes#diff-a3b8ddad088598b73f8c4910ec5a6e9748405a090dc807317b2d8e1ff2c55993R45-R48

The worker should be deployed sometime today. 🙏

### G08 | thread PRRT_kwDOCNxUSM6Btmtm | PR #27621 (@BrantalikP) fix(suite-native): fee selector balance error
FILE: suite-native/module-earn/src/hooks/useComposeEarnFees.ts:164
TOPIC (current): data-fetching-tanstack-query [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  suggestion for the proper fix: it looks like good job for `useMutation` / `useQuery` (it'd be cleaner & requiring less code)

### G09 | thread PRRT_kwDOCNxUSM6B-tIg | PR #27716 (@matusbalascak) Yield issues
FILE: suite-common/suite-constants/src/evm.ts:18
TOPIC (current): single-source-of-truth [override]
COMMENTS: 4 (reviewer: 2)
REVIEWER SAID:
  I though there were a consensus making the Earn yield worker source of the truth in this matter. 🤔 Has it changed? cc @tomasklim
  --- (next comment by reviewer) ---
  If it's about the label, I can extend the res. of `https://earn.trezor.io/yield/vaults/v1`

### G10 | thread PRRT_kwDOCNxUSM6CDjHz | PR #27725 (@izmy) fix(suite): handle Solana tx timeout in review modal
FILE: packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewModalBody.tsx:49
TOPIC (current): react-hooks-and-effects [override]
COMMENTS: 4 (reviewer: 2)
REVIEWER SAID:
  I think the intent here prevent triggering useEffect on `serializedTx` change but having fresh `serializedTx` value in the useEffect, right? If so, use `useFreshRef` 🙏
  --- (next comment by reviewer) ---
  this only stores the value on mount, if you want prev., the `useCurrentRef` is the solution (I can see now, the naming is misleading 😄)

### G11 | thread PRRT_kwDOCNxUSM6CDmn5 | PR #27725 (@izmy) fix(suite): handle Solana tx timeout in review modal
FILE: packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewModal.tsx:74
TOPIC (current): error-handling-and-devx [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  now the thunk's promise can be rejected, causing the component to crash, let's please add `try/catch` / `useMutation` 🙏

### G12 | thread PRRT_kwDOCNxUSM6DtN5y | PR #27901 (@matusbalascak) Yield speed up transaction support
FILE: packages/suite/src/views/wallet/trading/common/TradingForm/TradingApproveModal.tsx:96
TOPIC (current): readability-and-simplification [override]
COMMENTS: 2 (reviewer: 2)
REVIEWER SAID:
  Would it make sense to return the `spender` from `decode` as `approvalData?.spender.toLowerCase() ?? null`?
  --- (next comment by reviewer) ---
  Or use some general method for formatting the address based on network?

### G13 | thread PRRT_kwDOCNxUSM6DtSw4 | PR #27901 (@matusbalascak) Yield speed up transaction support
FILE: suite-common/calldata/src/calldata.ts:56
TOPIC (current): acknowledgements-and-pointers [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  👍

### G14 | thread PRRT_kwDOCNxUSM6DtUdu | PR #27901 (@matusbalascak) Yield speed up transaction support
FILE: suite-common/wallet-core/src/accounts/accountsThunks.ts:166
TOPIC (current): readability-and-simplification [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  NIT 🤏: `.filter` > `if/else`

### G15 | thread PRRT_kwDOCNxUSM6DtaNF | PR #27901 (@matusbalascak) Yield speed up transaction support
FILE: suite-common/wallet-utils/src/ethUtils.ts:91
TOPIC (current): acknowledgements-and-pointers [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  nice cleanup 🎉

### G16 | thread PRRT_kwDOCNxUSM6EENVt | PR #27718 (@BrantalikP) feat(suite-native): yield deposit
FILE: packages/suite/src/actions/wallet/stablecoin-yield/claimMerkleRewardsThunk.ts:7
TOPIC (current): code-placement-and-reuse [override]
COMMENTS: 3 (reviewer: 2)
REVIEWER SAID:
  This was intentional because putting all exports into single file leads to cir. dep. Nested exports effectively mitigate that. At the same time some encapsulation is good (at section/category level) so the package can expose only certain components. 

I know, it was only discussed here https://satoshilabs.slack.com/archives/G019WLX2P7B/p1776270754685949 but could be please stay by this? I think we are all quite happy that there're finally no (ecma-script module) cir. dep. 😀
  --- (next comment by reviewer) ---
  Awesome 🙌

### G17 | thread PRRT_kwDOCNxUSM6EEQHH | PR #27718 (@BrantalikP) feat(suite-native): yield deposit
FILE: packages/suite/src/components/tx-simulation/earn-stablecoin/EarnYieldTxSimulationModal.tsx:24
TOPIC (current): acknowledgements-and-pointers [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  thanks 👍

### G18 | thread PRRT_kwDOCNxUSM6EEXhV | PR #27718 (@BrantalikP) feat(suite-native): yield deposit
FILE: suite-common/earn-stablecoin/src/signing/stablecoinYieldSigningUtils.ts:220
TOPIC (current): error-handling-and-devx [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  Great that you moved it to common 👍 One thing worries me though there's breaking change how the validation works now: i.e. instead of throwing errors it returns null.  
At least from DevX it'll be much harder to deduce what's wrong or am I missing something? 🤔

### G19 | thread PRRT_kwDOCNxUSM6EE1NZ | PR #27718 (@BrantalikP) feat(suite-native): yield deposit
FILE: suite-common/wallet-core/src/index.ts:65
TOPIC (current): code-placement-and-reuse [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  Disclaimer: I know it was already here so just genuinely asking 😃 could it be moved in theory to `@suite-common/earn-stablecoin`? Because I don't see dependency on the wallet-core what so ever.

### G20 | thread PRRT_kwDOCNxUSM6EE24t | PR #27718 (@BrantalikP) feat(suite-native): yield deposit
FILE: suite-native/tx-simulation/package.json:28
TOPIC (current): component-structure-and-files [override]
COMMENTS: 2 (reviewer: 2)
REVIEWER SAID:
  Nice! 🎉
  --- (next comment by reviewer) ---
  One thing though: could you please follow similar structure as in other tx-simulation packages so it's going to be easy to extend them in future for other non-evm networks too? E.g.:
```ts
tx-simulation/src 
   /common
       /components
       /hooks
   /evm
       /components   
       /hooks
```

Anyway it could be done in some follow up 🙏

### G21 | thread comment:3288598035 | PR #27829 (@unknown) (PR no longer accessible — deleted or hidden)
FILE: suite-common/earn-staking-api/src/staking/hooks/useEthereumValidatorsQueue.ts:19
TOPIC (current): data-fetching-tanstack-query [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  Sure, checking for `null` account and enabling it only when it's defined makes sense. But why have you removed the `queryOptions`? This is general hook and the usage might vary in `suite` and `suite-native`. 

It'd be better to this like this:
```ts
import { type ResponseError, type ResponseValidationError } from '@suite-common/http-client';
import { type UseQueryOptions, commonQueryKeys, useQuery } from '@suite-common/react-query';
import { type Account } from '@suite-common/wallet-types';

import { type EthValidatorsQueue } from '../../api/types';
import { getEthereumValidatorsQueue } from '../services';

interface UseEthereumValidatorsQueueProps {
    account: Account | null;
    timestamp?: number;
}

export function useEthereumValidatorsQueue(
    { account, timestamp }: UseEthereumValidatorsQueueProps,
    {
        enabled = Boolean(account),
        ...restQueryOptions
    }: Omit<
        UseQueryOptions<EthValidatorsQueue, ResponseError | ResponseValidationError>,
        'queryKey'
    > = {},
) {
    return useQuery({
        staleTime: 60 * 1000, // 1 minute
        ...restQueryOptions,
        queryKey: commonQueryKeys.validatorsQueue(account?.key, timestamp),
        queryFn: () =>
            getEthereumValidatorsQueue({
                params: { timestamp },
            }),
    });
}
```
of course and edit the query key: `validatorsQueue: (accountKey: string | undefined, timestamp?: number) => [`

### G22 | thread PRRT_kwDOCNxUSM6EuQjn | PR #27718 (@BrantalikP) feat(suite-native): yield deposit
FILE: suite-native/module-earn/src/components/YieldPendingTransactionModal.tsx:129
TOPIC (current): react-hooks-and-effects [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  Shouldn't be this rather done via `useRef` hook?

### G23 | thread PRRT_kwDOCNxUSM6EuhYu | PR #27718 (@BrantalikP) feat(suite-native): yield deposit
FILE: suite-native/module-earn/src/components/YieldPendingTransactionModalConstants.ts:9
TOPIC (current): component-structure-and-files [override]
COMMENTS: 3 (reviewer: 2)
REVIEWER SAID:
  This is out of scope this PR, anyway I believe it'd be good to at least open up the discussion on the topic:

I've just noticed that suite-native packages are following some really strict linear file structure. However, the issue with that it breaks implicit relationships between components apposed to tree-like file structure.

Linear:
```
some-pkg/src/
    /components
         SomeScreen.tsx
         SomeFooter.tsx
         SomeFooterButton.tsx
         ...
  /hooks
        useSomeFooter.tsx
        useSomeXYZ.tsx
        ...
```

Tree-like:
```
some-pkg/src/
    /components
         /SomeScreen
                  /hooks
                       useSomeXYZ.tsx # hook for the `SomeScreen`.tsx
                 /constants
                 /{other-architectual-primitives}
                 /SomeFooter
                        /hooks
                             useSomeFooter.tsx # hook only for the relevant   footer
                        SomeFooterButton.tsx
                  SomeScreen.tsx
```

- The relationship between components is implicit by the structure. If something is shared across more of them, it can be just move respective level up. 
- It scales: It can effectively decrease browsing complexity to O(logn) making much better for bigger file structure to orient to.
  --- (next comment by reviewer) ---
  Glad to hear that! 

I kind of agree that it's better to have unified approaches across teams in the same codebase, however if I should always wait for everything to be accepted by our Suite Council, I'm afraid there'd be not much of progress. Maybe the borderline might be defined on team-level / package-level (something like that), when there's a need to introduce a new pattern / coding practice like this. 

Anyway, thank you for your feedback on that. I hope we will make this work soon. 🚀

### G24 | thread PRRT_kwDOCNxUSM6Eutly | PR #27718 (@BrantalikP) feat(suite-native): yield deposit
FILE: suite-native/module-earn/src/hooks/__tests__/useResolvedYieldFlowData.test.ts:49
TOPIC (current): typescript-type-safety [override]
COMMENTS: 3 (reviewer: 2)
REVIEWER SAID:
  I understand the `vault` should have the type, however at least partial type validation might be a good idea via `satisfies`.
  --- (next comment by reviewer) ---
  nice 💪

### G25 | thread PRRT_kwDOCNxUSM6Euzhb | PR #27718 (@BrantalikP) feat(suite-native): yield deposit
FILE: suite-native/module-earn/src/hooks/__tests__/useResolvedYieldFlowData.test.ts:27
TOPIC (current): typescript-type-safety [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  e.g.:
```suggestion
    ] satisfies Omit<TokenInfo, 'standard'>[],
```

### G26 | thread PRRT_kwDOCNxUSM6Eu6Ts | PR #27718 (@BrantalikP) feat(suite-native): yield deposit
FILE: suite-native/module-earn/src/hooks/useYieldDepositReview.ts:34
TOPIC (current): readability-and-simplification [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  `depositStatus` might be more suitable for so many states

### G27 | thread PRRT_kwDOCNxUSM6Eu8Pd | PR #27718 (@BrantalikP) feat(suite-native): yield deposit
FILE: suite-native/module-earn/src/hooks/useYieldPendingTransactionTracking.ts:40
TOPIC (current): code-placement-and-reuse [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  It looks like the same fn as in `@trezor/suite`, what about putting it to suite-common?

### G28 | thread PRRT_kwDOCNxUSM6EvADR | PR #27718 (@BrantalikP) feat(suite-native): yield deposit
FILE: suite-native/module-earn/src/screens/YieldDepositReviewScreen.tsx:162
TOPIC (current): component-structure-and-files [override]
COMMENTS: 3 (reviewer: 2)
REVIEWER SAID:
  One component per file please to make it easily readable 🙏
  --- (next comment by reviewer) ---
  TBH I still think it'd be better to divide it (better readability, so less bugs; easier composibility; potential easier refactoring in the future) but I don't push it. Also, it might be subject of some follow-up.

### G29 | thread PRRT_kwDOCNxUSM6GIZu2 | PR #28234 (@matusbalascak) feat(suite): add transaction data editor to tron send form
FILE: suite-common/wallet-core/src/send/tron/buildContract.ts:9
TOPIC (current): readability-and-simplification [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  nit: put it to shared interface / type with `buildTransferContract`?

### G30 | thread PRRT_kwDOCNxUSM6GImBo | PR #28234 (@matusbalascak) feat(suite): add transaction data editor to tron send form
FILE: suite-common/wallet-core/src/send/sendFormThunks.ts:84
TOPIC (current): acknowledgements-and-pointers [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  I like the nesting per network 👍

### G31 | thread PRRT_kwDOCNxUSM6HT_F2 | PR #28374 (@matusbalascak) feat(suite): add Tron staking page basics
FILE: packages/suite/src/components/earn/modals/EarnInANutshell/TronStakeInANutshellModal.tsx:28
TOPIC (current): code-placement-and-reuse [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  What about putting this `maxApy` to `useTronStakingStats` so suite-native can re-use it?

### G32 | thread PRRT_kwDOCNxUSM6JfIUb | PR #28414 (@marekrjpolak) Eth conversion utils
FILE: suite-common/wallet-utils/src/ethConverter.ts:33
TOPIC (current): runtime-validation-and-parsing [override]
COMMENTS: 4 (reviewer: 1)
REVIEWER SAID:
  Why can't it be negative?

### G33 | thread PRRT_kwDOCNxUSM6Jsnb1 | PR #28761 (@OriginalEveres) refactor(suite): extract shared debug utilities
FILE: suite/settings/src/settingsSelectors.ts:30
TOPIC (current): code-placement-and-reuse [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  But then, shouldn't be done same for other debug options too?

### G34 | thread PRRT_kwDOCNxUSM6KLrm- | PR #28797 (@mroz22) chore(validators): remove dead validator types
FILE: suite-common/validators/src/types.ts:1
TOPIC (current): typescript-type-safety [override]
COMMENTS: 3 (reviewer: 2)
REVIEWER SAID:
  it's this or `import './types';` in `validators/src/index.ts` 🤷‍♂️
  --- (next comment by reviewer) ---
  no, now it can actually be just `validators.d.ts` that should be picked by ts without import, right?

### G35 | thread PRRT_kwDOCNxUSM6KxA-t | PR #28908 (@matusbalascak) feat(suite): implement tron staking dashboard
FILE: packages/suite/src/views/wallet/staking/components/TronStakingDashboard/TronResourcesCard/TronResourcesCard.tsx:15
TOPIC (current): typescript-type-safety [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  It might be useful to go with `AccountWithNetworkType<'tron'>` for stricter types and less conditions. 
```suggestion
    account: AccountWithNetworkType<'tron'>;
```
and do the "is it correct account check" only once somewhere upstream

### G36 | thread PRRT_kwDOCNxUSM6LQoSc | PR #28948 (@53gur0) fix(suite-native): display aggregated amounts on tx list item
FILE: suite-native/transactions/src/components/TransactionTarget.tsx:125
TOPIC (current): performance-and-memoization [override]
COMMENTS: 2 (reviewer: 2)
REVIEWER SAID:
  ```suggestion
    }, [type, payload.amount, isSolanaUnstakeTx]);
```
  --- (next comment by reviewer) ---
  These memo seem redundant, there's no complexity (`O(1)`), it could some `get____Amount` util. I just need to say but it's not your code, I know 😄

### G37 | thread PRRT_kwDOCNxUSM6LQoco | PR #28948 (@53gur0) fix(suite-native): display aggregated amounts on tx list item
FILE: suite-native/transactions/src/components/TransactionTarget.tsx:119
TOPIC (current): readability-and-simplification [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  All cases return the same value, so:
```suggestion
```

### G38 | thread PRRT_kwDOCNxUSM6LQqvp | PR #28948 (@53gur0) fix(suite-native): display aggregated amounts on tx list item
FILE: suite-native/transactions/src/components/TransactionListItem.tsx:134
TOPIC (current): performance-and-memoization [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  I'd suggest using memo for this, wdyt?

### G39 | thread PRRT_kwDOCNxUSM6LQ-O5 | PR #28816 (@53gur0) feat(wallet-core): improve nonce discovery for EVM
FILE: suite-common/wallet-core/src/send/sendFormEthereumThunks.ts:68
TOPIC (current): acknowledgements-and-pointers [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  nice to mention this 👍

### G40 | thread PRRT_kwDOCNxUSM6LQ_3e | PR #28816 (@53gur0) feat(wallet-core): improve nonce discovery for EVM
FILE: suite-common/wallet-core/src/send/sendFormEthereumThunks.ts:439
TOPIC (current): typescript-type-safety [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  NIT: 
```suggestion
    selectedAccount: AccountWithNetworkType<'ethereum'>
```

### G41 | thread PRRT_kwDOCNxUSM6LR8C5 | PR #28816 (@53gur0) feat(wallet-core): improve nonce discovery for EVM
FILE: suite-common/wallet-core/src/send/sendFormEthereumThunks.ts:82
TOPIC (current): runtime-validation-and-parsing [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  What about using some Zod schema for parsing of the unknown data instead of the casting? There's already something related to that here `suite-common/schemas/src/evm/fees/index.ts` but it's been done only for hex strings yet.

### G42 | thread PRRT_kwDOCNxUSM6LR8QV | PR #28816 (@53gur0) feat(wallet-core): improve nonce discovery for EVM
FILE: suite-common/wallet-core/src/send/sendFormEthereumThunks.ts:75
TOPIC (current): typescript-type-safety [override]
COMMENTS: 3 (reviewer: 1)
REVIEWER SAID:
  ```suggestion
    const firstLevel: FeeLevel = levels[0];
```

### G43 | thread PRRT_kwDOCNxUSM6L4rFn | PR #29054 (@53gur0) perf(suite-desktop): tanstack query improvements
FILE: suite-common/earn-stablecoin-api/src/hooks/merkl-rewards/useGetMerklRewards.ts:73
TOPIC (current): ci-tooling-and-guardrails [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  We should (in another PR) try to introduce some Eslint rule to warn us about that. ✍️ 🤔 
I didn't realize it's gonna break the proxy, even though it's now very much obvious.

### G44 | thread PRRT_kwDOCNxUSM6L4rvu | PR #29054 (@53gur0) perf(suite-desktop): tanstack query improvements
FILE: packages/suite/src/components/earn/dashboard/yield/EarnYieldTable.tsx:63
TOPIC (current): performance-and-memoization [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  nit: what about using static array (i.e it has stable ref) so it doesn't break the useMemo?

### G45 | thread PRRT_kwDOCNxUSM6L4tds | PR #29054 (@53gur0) perf(suite-desktop): tanstack query improvements
FILE: suite-common/earn-stablecoin-api/src/hooks/useYieldOpportunity.ts:22
TOPIC (current): acknowledgements-and-pointers [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  hehe, how so I didn't notice that, thanks 😄

### G46 | thread PRRT_kwDOCNxUSM6L4vls | PR #29054 (@53gur0) perf(suite-desktop): tanstack query improvements
FILE: suite-native/module-earn/src/hooks/useResolvedYieldFlowData.ts:239
TOPIC (current): acknowledgements-and-pointers [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  https://github.com/trezor/trezor-suite/pull/29054/changes#r3466751441 🙏

### G47 | thread PRRT_kwDOCNxUSM6L4v29 | PR #29054 (@53gur0) perf(suite-desktop): tanstack query improvements
FILE: suite-native/module-earn/src/hooks/useStablecoinYieldListData.ts:47
TOPIC (current): acknowledgements-and-pointers [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  ❤️

### G48 | thread PRRT_kwDOCNxUSM6L4wXG | PR #29054 (@53gur0) perf(suite-desktop): tanstack query improvements
FILE: suite-common/earn-stablecoin-api/src/hooks/useGetYieldOpportunities.ts:32
TOPIC (current): acknowledgements-and-pointers [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  nice 👍

### G49 | thread PRRT_kwDOCNxUSM6L6fov | PR #29031 (@TomasBoda) Tron - Earn dashboard + Staking limits
FILE: packages/suite/src/components/earn/dashboard/staking/hooks/useStakingTableData.ts:52
TOPIC (current): single-source-of-truth [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  I'm not sure why we haven't done up to this point but what about using network config `getNetwork(account.symbol).features.includes('staking')` so we move the source of truth there?

### G50 | thread PRRT_kwDOCNxUSM6L6pCr | PR #29031 (@TomasBoda) Tron - Earn dashboard + Staking limits
FILE: packages/suite/src/hooks/earn/useStakingYield.ts:46
TOPIC (current): performance-and-memoization [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  If nothing changes this should be really low O(n), right? My point is if it would make sense move to some `useStakingYieldApy` with `useMemo` or not.

### G51 | thread PRRT_kwDOCNxUSM6L6tfc | PR #29031 (@TomasBoda) Tron - Earn dashboard + Staking limits
FILE: packages/suite/src/components/earn/dashboard/staking/EarnStakingAccountRow.tsx:386
TOPIC (current): readability-and-simplification [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  there's same condition for this and the case above, what about putting it into some var?
```ts
const apyAvailable = stakingStatus !== 'staking-outdated-provider' && stakingStatus !== 'staking-remaining-votes'
```

### G52 | thread PRRT_kwDOCNxUSM6SN0xn | PR #30091 (@MiroslavProchazka) fix(workflows): adjust aws session duration for icon workflow
FILE: .github/workflows/release-suite-coin-icons.yml:46
TOPIC (current): ci-tooling-and-guardrails [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  It seems like a good hotfix. I'd just increase it to 5h as some successful runs took more than 4h.

https://github.com/trezor/trezor-suite/actions/workflows/release-suite-coin-icons.yml?query=is%3Asuccess

### G53 | thread PRRT_kwDOCNxUSM6SNxR0 | PR #30091 (@MiroslavProchazka) fix(workflows): adjust aws session duration for icon workflow
FILE: .github/workflows/release-suite-coin-icons.yml:46
TOPIC (current): ci-tooling-and-guardrails [override]
COMMENTS: 4 (reviewer: 2)
REVIEWER SAID:
  The default is 1h, so is 4x longer really too long? The script might run over 4h (which itself the core issue) https://github.com/trezor/trezor-suite/actions/workflows/release-suite-coin-icons.yml?query=is%3Asuccess.
  --- (next comment by reviewer) ---
  This should become hopefully irrelevant once this is going to be merged. 🙏   https://github.com/trezor/trezor-suite/pull/30108

### G54 | thread PRRT_kwDOCNxUSM6TLEtD | PR #29947 (@peter-sanderson) fix(earn): reduce Yield.xyz declaration size
FILE: suite-common/earn-stablecoin-api/src/services/yieldxyz.ts:50
TOPIC (current): code-placement-and-reuse [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  I can see the type decl. size improvement. However, it seems, we are going to need doing this for each service / endpoint. What about rather improving the `createHttpClient` itself?

I've drafted it as kind of a `0.0.1` version to iterate it later on as we gather more usage experience, thus it's easier to design a better interface for it. I can think of extending it with schemas for search params / URL params (e.g. `/users/:userId`), request body. 

Do you have some design interface idea for reducing the type decl. size?

### G55 | thread PRRT_kwDOCNxUSM6VEtNU | PR #30255 (@53gur0) feat(suite-native): label wrap/unwrap transactions
FILE: suite-native/module-transactions/src/screens/TransactionDetailScreen.tsx:134
TOPIC (current): component-structure-and-files [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  To maintain the render method readability, I'd suggest move this to new component and doing early returns

### G56 | thread PRRT_kwDOCNxUSM6VFRu_ | PR #29622 (@53gur0) feat(suite-native): evm cancel 
FILE: packages/suite/src/hooks/wallet/useEthereumCancelTxCompose.ts:66
TOPIC (current): data-fetching-tanstack-query [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  Why not using useQuery if it's more declarative than imperative use-case? It would result in shorter code a little:

```ts
    const { ... } = useQuery({
        enabled: account.networkType === 'ethereum' && !!feeInfo && tx.rbfParams?.type === 'ethereum',
        queryKey: [],
        queryFn: async () => {
            const result = await dispatch(composeEthereumCancelTransactionThunk({ account, tx }));

            if (isRejected(result)) {
                throw result.payload ?? new Error('Unknown error');
            }

            return result.payload;
        }
    })
```

### G57 | thread PRRT_kwDOCNxUSM6VFTbC | PR #29622 (@53gur0) feat(suite-native): evm cancel 
FILE: suite-common/wallet-core/src/send/composeCancelTransaction/composeEthereumCancelTransactionThunk.ts:100
TOPIC (current): typescript-type-safety [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  The casting doesn't feel right here. Can we rather use `satisfies` or add new type?

### G58 | thread PRRT_kwDOCNxUSM6VFXRL | PR #29622 (@53gur0) feat(suite-native): evm cancel 
FILE: suite-common/wallet-core/src/send/useEvmNonceInfo.ts:95
TOPIC (current): data-fetching-tanstack-query [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  NIT (ignore if you will): This might be part of the useQuery as `select` method. Anyway I guess there's no advantage compare to this solution.

### G59 | thread PRRT_kwDOCNxUSM6VFbQ1 | PR #29622 (@53gur0) feat(suite-native): evm cancel 
FILE: suite-native/module-transactions/src/hooks/useCancelEvmTransaction.ts:67
TOPIC (current): runtime-validation-and-parsing [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  I dunno, I'd either use Zod schema for parsing or use `.?` operator as it can be undefined

### G60 | thread PRRT_kwDOCNxUSM6VFeR0 | PR #29622 (@53gur0) feat(suite-native): evm cancel 
FILE: suite-native/module-transactions/src/hooks/useDeviceGuardedSign.ts:74
TOPIC (current): data-fetching-tanstack-query [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  this looks like job for `useQuery`

### G61 | thread PRRT_kwDOCNxUSM6VFgQk | PR #29622 (@53gur0) feat(suite-native): evm cancel 
FILE: suite-native/module-transactions/src/components/CancelEvmTransactionButton.tsx:46
TOPIC (current): component-structure-and-files [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  Let's please have single react component per file (easier to find the component, easier to refactor the component, easier to read this file) 🙏

### G62 | thread PRRT_kwDOCNxUSM6VF1ES | PR #29622 (@53gur0) feat(suite-native): evm cancel 
FILE: suite-native/module-transactions/src/redux.d.ts:11
TOPIC (current): typescript-type-safety [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  is this really required? 👀

### G63 | thread PRRT_kwDOCNxUSM6V6ebt | PR #30154 (@vojtatranta) WIP: 28878 playwright perf tracking
FILE: packages/suite/src/support/suite/Main.tsx:39
TOPIC (current): component-structure-and-files [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  Let's move everything new here to `RenderProfiler` component

### G64 | thread PRRT_kwDOCNxUSM6V6hAa | PR #30154 (@vojtatranta) WIP: 28878 playwright perf tracking
FILE: suite/e2e/performance/perfMeasure.ts:53
TOPIC (current): error-handling-and-devx [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  It's for desktop too. I think this should throw an error instead (i.e. if a dev attempts to measure a test there's missing `__trezorPerf__`, why skipping it, right?)

### G65 | thread PRRT_kwDOCNxUSM6V942D | PR #30154 (@vojtatranta) WIP: 28878 playwright perf tracking
FILE: packages/perf-e2e/src/instrumentation.ts:69
TOPIC (current): error-handling-and-devx [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  it might not a break the app but could signal something's off regarding the perf. measurement. What about enabling the logging when adding `--debug` flag?

### G66 | thread PRRT_kwDOCNxUSM6V95Qp | PR #30154 (@vojtatranta) WIP: 28878 playwright perf tracking
FILE: packages/perf-e2e/src/instrumentation.ts:91
TOPIC (current): acknowledgements-and-pointers [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  https://github.com/trezor/trezor-suite/pull/30154/changes#r3703857163

### G67 | thread PRRT_kwDOCNxUSM6WR352 | PR #30791 (@TomasBoda) Earn Yield - Add Rewards Tooltips
FILE: packages/suite/src/components/earn/dashboard/yield/hooks/useYieldClaimRewardsData.ts:85
TOPIC (current): performance-and-memoization [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  NIT (memory):  all useMemo hooks can be combined into single one, all of them have the same dep (`rewards.data.accountsRewards`)

### G68 | thread PRRT_kwDOCNxUSM6WS_VP | PR #30028 (@tomasklim) Cardano staking updates
FILE: suite-common/wallet-utils/src/cardanoStakingUtils.ts:111
TOPIC (current): readability-and-simplification [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  nit: `pools.toSorted`

### G69 | thread PRRT_kwDOCNxUSM6WTJXX | PR #30028 (@tomasklim) Cardano staking updates
FILE: packages/suite/src/actions/wallet/stake/stakeFormCardanoActions.ts:421
TOPIC (current): readability-and-simplification [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  NIT (readability): It took me a while to digest this piece, I'd move it to `getPoolDelegation` with early `return` avoiding nesting.

### G70 | thread PRRT_kwDOCNxUSM6WTvIt | PR #30797 (@53gur0) feat(suite-desktop): ensure auto-tracked wrapped native assets
FILE: packages/suite/src/actions/wallet/wrapNativeTokenThunks.ts:93
TOPIC (current): comments-and-docs [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  This comment misses some parts. Maybe adding one-line sentence comment could do it:
```
// Make sure re-wrapping doesn't create a duplicate
```

### G71 | thread PRRT_kwDOCNxUSM6WUXFG | PR #29445 (@tomasklim) fix(suite): keep account graph data visible while refetching
FILE: packages/suite/src/actions/wallet/graphActions.ts:105
TOPIC (current): acknowledgements-and-pointers [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  ooff, so until now there wasn't any pagination. 😄 Nice improvement 👍

### G72 | thread PRRT_kwDOCNxUSM6WUawu | PR #29445 (@tomasklim) fix(suite): keep account graph data visible while refetching
FILE: packages/suite/src/actions/wallet/graphActions.ts:171
TOPIC (current): data-fetching-tanstack-query [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  I really don't like this thunk, it could be fairly easily replaced with tanstack query. But that's for another time, I know.

### G73 | thread PRRT_kwDOCNxUSM6Wrxn2 | PR #30910 (@53gur0) fix(suite-desktop): double-check nonces origination
FILE: suite-common/wallet-utils/src/transactionUtils.ts:182
TOPIC (current): readability-and-simplification [override]
COMMENTS: 3 (reviewer: 2)
REVIEWER SAID:
  So is it really ok not to take the highest one, right?

I know it's minor but what about wrapping it to new fn so it's easily digestible (for other readers) by the fn name and if needed then the long comment?
```ts
/**
   ...
*/
function getNextAvailableEvmNonce(confirmedNonces: Set<string>, accountNonce: string) {
  let effectiveAccountNonce = accountNonce;

   while (confirmedNonces.has(effectiveAccountNonce)) effectiveAccountNonce += 1

  return effectiveAccountNonce  
}
  --- (next comment by reviewer) ---
  okay

### G74 | thread PRRT_kwDOCNxUSM6Wr1b2 | PR #30910 (@53gur0) fix(suite-desktop): double-check nonces origination
FILE: packages/suite/src/views/wallet/send/Options/EthereumOptions/EthereumNonce.tsx:90
TOPIC (current): performance-and-memoization [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  uff, no useMemo anywhere... anyway that's for another PR (I know it was here before, I just help myself not commenting it) 😄

### G75 | thread PRRT_kwDOCNxUSM6Wr22C | PR #30910 (@53gur0) fix(suite-desktop): double-check nonces origination
FILE: suite-common/wallet-utils/src/transactionUtils.ts:80
TOPIC (current): readability-and-simplification [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  what about using `areEvmAddressesEqual`?

### G76 | thread PRRT_kwDOCNxUSM6Wr665 | PR #30910 (@53gur0) fix(suite-desktop): double-check nonces origination
FILE: suite-common/wallet-utils/src/transactionUtils.ts:93
TOPIC (current): typescript-type-safety [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  If I understand it correctly, the `sent` type is basically useless / broken because of: 

> call may name any `from` — and 'failed' for the account's own reverted sends

so wouldn't be better to fix the `sent` type or introduce new one... something in this direction?

### G77 | thread PRRT_kwDOCNxUSM6X2f7S | PR #30994 (@TomasBoda) Mobile - Asset Detail Screen Revamp
FILE: suite-native/module-earn/src/hooks/useYieldBadge.tsx:41
TOPIC (current): nullability-and-sentinel-values [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  Is there real use case with undefined token.symbol and setting `''` seems like way to potential bug / unnecessary checks down stream. Therefore:
```suggestion
        if (!networkSymbol || !token || !token.symbol) return [];
```

### G78 | thread PRRT_kwDOCNxUSM6X2gF2 | PR #30994 (@TomasBoda) Mobile - Asset Detail Screen Revamp
FILE: suite-native/module-earn/src/hooks/useYieldBadge.tsx:45
TOPIC (current): nullability-and-sentinel-values [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  ```suggestion
            symbol: token.symbol,
```

### G79 | thread PRRT_kwDOCNxUSM6X2j-v | PR #30994 (@TomasBoda) Mobile - Asset Detail Screen Revamp
FILE: suite-native/module-accounts-management/src/components/YourPositionCard.tsx:30
TOPIC (current): readability-and-simplification [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  I know if I'd do this in Suite desktop, Growth team will say something... but I assume it's more relaxed in suite-native 😄

### G80 | thread PRRT_kwDOCNxUSM6X2lnu | PR #30994 (@TomasBoda) Mobile - Asset Detail Screen Revamp
FILE: suite-native/module-accounts-management/src/components/YourPositionCard.tsx:103
TOPIC (current): component-structure-and-files [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  Let's put it to new file with the name of the hook. 🙏

### G81 | thread PRRT_kwDOCNxUSM6X2m4p | PR #30994 (@TomasBoda) Mobile - Asset Detail Screen Revamp
FILE: suite-native/module-accounts-management/src/components/YourPositionCard.tsx:113
TOPIC (current): nullability-and-sentinel-values [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  This selection should be done outside this component so the types here can assert only `account` and doesn't have to always check for undefined/null cases 🙏

### G82 | thread PRRT_kwDOCNxUSM6X2nwb | PR #30994 (@TomasBoda) Mobile - Asset Detail Screen Revamp
FILE: suite-native/module-accounts-management/src/components/YourPositionCard.tsx:122
TOPIC (current): nullability-and-sentinel-values [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  Might be the case for `symbol` and `token` too 🙏 
https://github.com/trezor/trezor-suite/pull/30994/changes#r3749145328

### G83 | thread PRRT_kwDOCNxUSM6X2oxc | PR #30994 (@TomasBoda) Mobile - Asset Detail Screen Revamp
FILE: suite-native/module-earn/src/components/YieldBadge.tsx:52
TOPIC (current): data-fetching-tanstack-query [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  Let's use `useYieldOpportunity` instead of `useAllYieldOpportunities`

### G84 | thread PRRT_kwDOCNxUSM6X20J5 | PR #30994 (@TomasBoda) Mobile - Asset Detail Screen Revamp
FILE: suite-native/module-accounts-management/src/components/YourPositionCard.tsx:52
TOPIC (current): nullability-and-sentinel-values [override]
COMMENTS: 2 (reviewer: 1)
REVIEWER SAID:
  are we sure it can handle `formattedBalance` balance too?

### G85 | thread PRRT_kwDOCNxUSM6X4-oe | PR #31076 (@izmy) fix(suite-native): polish standalone wrap/unwrap UI
FILE: suite-native/module-earn/src/components/YieldCompleteScreenPresets.tsx:166
TOPIC (current): acknowledgements-and-pointers [override]
COMMENTS: 1 (reviewer: 1)
REVIEWER SAID:
  nice 👍

### G86 | thread PRRT_kwDOCNxUSM6X1LU- | PR #31071 (@TomasBoda) fix(suite-native): communicate weth vault as eth
FILE: suite-native/module-accounts-management/src/components/StablecoinYieldTokenOverview.tsx:262
TOPIC (current): typescript-type-safety [override]
COMMENTS: 4 (reviewer: 1)
REVIEWER SAID:
  what about `wrappedNativeSymbol && isNetworkSymbol(wrappedNativeSymbol) ? ... : ...`?
