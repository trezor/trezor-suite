# Cardano screenshot visual quality review

Reviewed all **10 final captures, numbered 229–238**, using two temporary contact sheets and three original-size checks. The source call chain for Change delegate and the separate provider migration entry was also inspected. No UI/device/service or main-manifest/image changes were made.

[Structured audit](./screenshot-quality-cardano.json) records every image hash and visible scope. [One additive erratum](../parts/runtime-cardano-qc-errata.json) corrects the delegated-dashboard association while preserving the original record and feature catalog.

## Voting preference versus staking-pool provider

The dashboard button says **Change delegate**, but it opens **Change voting preference**. `StakingCard` dispatches `change-delegate`; `UserContextModal` resolves that to `StakeChangeDelegateModal`, whose heading and fields concern DRep/governance voting. The new effective visual associations are `earn.staking.ada` and `earn.staking.ada.voting`.

The separate `NewProviderCard` uses `EarnFlow.UpdateProvider`. This batch does not demonstrate that pool-provider migration flow. Its feature remains in the map without attaching this unrelated screenshot as proof.

## Capture scope

- **web-t3t1-cardano-staking-introduction** — Staking introduction and Start staking entry only. Retained spending access, deposit and APY are explanatory/fixture UI; no actual delegation.
- **web-t3t1-cardano-provider-consent** — Provider consent and unchecked acknowledgement visible. Consent explains switching pools but does not demonstrate the pool-provider update flow.
- **web-t3t1-cardano-delegation-form** — Full-balance delegation form, refundable deposit explanation, calculated QA fee and timeline visible. No delegation or hardware confirmation submitted.
- **web-t3t1-cardano-voting-preference** — Abstain, Everstake and custom DRep options visible with Abstain selected. No vote transaction executed.
- **web-t3t1-cardano-custom-drep** — Custom DRep selected and its empty identifier input visible. Fee reads To be calculated and Continue is disabled; no identifier entered/validated or submitted.
- **web-t3t1-cardano-delegated-position** — Existing Cardano delegation shows APY, reward cycle, full-balance staking, restaked-reward fixture state and Claim rewards, Unstake and Change delegate entries. Change delegate opens the separate Change voting preference dialog; this is a voting-delegation entry, not evidence of changing the staking-pool provider.
- **web-t3t1-cardano-claim-rewards** — Rewards fixture and calculated QA network fee visible. Claim rewards action was not submitted; no claim result.
- **web-t3t1-cardano-unstake-form** — Unstake explanation, calculated QA fee and refundable-deposit/reward timeline visible. Continue not submitted; no undelegation/refund occurred.
- **web-t3t1-cardano-change-voting-preference** — Current fixture Everstake DRep record and alternative voting choices visible. Fee reads To be calculated and Continue is disabled until a valid new choice. This changes governance voting, not pool provider.
- **web-t3t1-cardano-signature-key-format** — Raw key is selected, COSE (CIP-30) option visible, address/message/signature/public-key fields empty and Hex toggle off. No COSE output, message signature or hardware confirmation was generated.

## Fixture and privacy interpretation

This batch follows a fresh app profile with the established academic Cardano fixture and **funded → rewarded** backend modes. Earlier unfunded observations describe a different seed/profile phase and remain historically valid. The new screenshots now supply direct visible evidence of funded and rewarded forms; the [fixture checkpoint](./fixtures.md) records this separately.

No sensitive image was identified. No seed/PIN/passphrase or entered signing message/key appears. Existing provider/test DRep metadata is visible in the voting sheet; no identifier was entered by a user. QA amounts/identities are not copied into this report. No delegation, claim, undelegation, governance vote or signature was submitted. COSE (CIP-30) appears as an available selector option, with raw-key default selected and output fields empty.

## Source chain

- [packages/suite/src/views/wallet/staking/components/StakingDashboard/components/StakingCard.tsx](../../../../packages/suite/src/views/wallet/staking/components/StakingDashboard/components/StakingCard.tsx#L233).
- [packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/UserContextModal.tsx](../../../../packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/UserContextModal.tsx#L189).
- [packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/StakeChangeDelegateModal/StakeChangeDelegateModal.tsx](../../../../packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/StakeChangeDelegateModal/StakeChangeDelegateModal.tsx#L197).
- [packages/suite/src/components/earn/modals/shared/VotingDelegations/VotingPreferenceCard.tsx](../../../../packages/suite/src/components/earn/modals/shared/VotingDelegations/VotingPreferenceCard.tsx#L221).
- [packages/suite/src/views/wallet/staking/components/StakingDashboard/components/NewProviderCard.tsx](../../../../packages/suite/src/views/wallet/staking/components/StakingDashboard/components/NewProviderCard.tsx#L38).
- [suite/sign-verify/src/SignVerifyForm.tsx](../../../../suite/sign-verify/src/SignVerifyForm.tsx#L159).

Verification: ten retained image hashes, feature/observation IDs, source references, additive erratum and formatting checked.
