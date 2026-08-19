# Single source of truth

Deriving behaviour from network config features and from the Earn yield worker API rather than duplicating constants in the client.

**3 review-thread-group(s)** · [← back to index](../README.md)

Tags: `earn-worker-api` ×2, `hardcoded-constants`, `network-config-features`, `staking`

| # | PR | File | Tags |
| --- | --- | --- | --- |
| [G07](#g07--packagessuitesrccomponentsearndashboardyieldearnyieldaccountopportunitytsx44) | [#27584](https://github.com/trezor/trezor-suite/pull/27584) | `EarnYieldAccountOpportunity.tsx:44` | earn-worker-api |
| [G09](#g09--suite-commonsuite-constantssrcevmts18) | [#27716](https://github.com/trezor/trezor-suite/pull/27716) | `evm.ts:18` | earn-worker-api, hardcoded-constants |
| [G49](#g49--packagessuitesrccomponentsearndashboardstakinghooksusestakingtabledatats52) | [#29031](https://github.com/trezor/trezor-suite/pull/29031) | `useStakingTableData.ts:52` | network-config-features, staking |

---

### G07 — `packages/suite/src/components/earn/dashboard/yield/EarnYieldAccountOpportunity.tsx:44`

- **PR** [#27584 — Control Earn actions through message-system feature flags](https://github.com/trezor/trezor-suite/pull/27584) · author `@izmy` · merged
- **My first comment** 2026-05-12
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27584#discussion_r3226868495
- **Line of code** https://github.com/trezor/trezor-suite/blob/d80db0d9dd30dcdff39e3356cf862e0dfdadb3a2/packages/suite/src/components/earn/dashboard/yield/EarnYieldAccountOpportunity.tsx#L44 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 3 comment(s), 1 mine
- **Status** resolved · outdated
- **Tags** `earn-worker-api`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -39,6 +41,9 @@ export const EarnYieldAccountOpportunity = ({ opportunity }: EarnYieldAccountOpp
     const [isFirmwareModalOpen, setIsFirmwareModalOpen] = useState(false);
     const selectedDevice = useSelector(selectSelectedDevice);
     const isFirmwareOutdated = !isStablecoinYieldSupported(selectedDevice);
+    const vaultContractAddress = EVM_VAULT_ADDRESSES[opportunity.vault.id];
```

</details>

**Conversation**

**@matusbalascak** · 2026-05-12

> [This](https://github.com/trezor/trezor-suite/pull/27497) PR removed the `EVM_VAULT_ADDRESSES`, so just FYI, this will have to change

**🟦 @cermakjiri (me)** · 2026-05-12

> There's going to be a new endpoint:
>
> ```ts
>     const { address: vaultAddress } = await getYieldVault({
>         routeParams: {
>             networkSymbol: account.symbol,
>             vaultId: vault.id,
>         },
>     });
> ```
>
> https://github.com/trezor/trezor-suite/pull/27497/changes#diff-a3b8ddad088598b73f8c4910ec5a6e9748405a090dc807317b2d8e1ff2c55993R45-R48
>
> The worker should be deployed sometime today. 🙏

**@izmy** · 2026-05-12

> I ended up using the address from the output token instead.

---

### G09 — `suite-common/suite-constants/src/evm.ts:18`

- **PR** [#27716 — Yield issues](https://github.com/trezor/trezor-suite/pull/27716) · author `@matusbalascak` · merged
- **My first comment** 2026-05-14
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27716#discussion_r3239510765
- **Line of code** https://github.com/trezor/trezor-suite/blob/ed136b658b979ccd43f691bbd6661c7e53b5a37c/suite-common/suite-constants/src/evm.ts#L18
- **Thread** 4 comment(s), 2 mine
- **Status** unresolved
- **Tags** `earn-worker-api`, `hardcoded-constants`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -8,4 +8,13 @@ export const EVM_SPENDER_LABELS: Record<string, string> = {
     '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae': 'LiFi Diamond',
 };
 
+/**
+ * Exact copy of KNOWN_VAULTS from the firmware
+ * (trezor/trezor-firmware/blob/main/core/src/apps/ethereum/yielding_vaults.py),
+ */
+export const KNOWN_VAULTS: Record<string, string> = {
+    '0xe4db1c5a1b709ce4d2ada6985d9d506e58f73829': 'Trezor Steakhouse USDT Prime Vault',
+    '0xde6c23e561f3e55846207ec45a91b777e0f7c889': 'Trezor Steakhouse USDC Prime Vault',
+};
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-14

> I though there were a consensus making the Earn yield worker source of the truth in this matter. 🤔 Has it changed? cc @tomasklim

**🟦 @cermakjiri (me)** · 2026-05-14

> If it's about the label, I can extend the res. of `https://earn.trezor.io/yield/vaults/v1`

**@matusbalascak** · 2026-05-14

> IMO, the Earn API response may change over time, which could cause the approve flow to get out of sync with the firmware. This way, we ensure these vaults are always clear-signed.

**@tomasklim** · 2026-05-14

> Let's sync on/after standup. 
>
> In fw it is now hardcoded, in the future it will be dynamic. I am fine with this right now, the only issue I see now is to check if fw has `Vault` translatable. But that's extra edge case

---

### G49 — `packages/suite/src/components/earn/dashboard/staking/hooks/useStakingTableData.ts:52`

- **PR** [#29031 — Tron - Earn dashboard + Staking limits](https://github.com/trezor/trezor-suite/pull/29031) · author `@TomasBoda` · merged
- **My first comment** 2026-06-24
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/29031#discussion_r3467403327
- **Line of code** https://github.com/trezor/trezor-suite/blob/30b4edc6e5f92ac9b4ee75d6982d15bf59c66322/packages/suite/src/components/earn/dashboard/staking/hooks/useStakingTableData.ts#L52
- **Thread** 2 comment(s), 1 mine
- **Status** unresolved
- **Tags** `network-config-features`, `staking`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -44,7 +45,11 @@ export const useStakingTableData = (): UseStakingTableDataResult => {
     const accounts = useSelector(selectVisibleDeviceAccounts);
 
     const stakingAccounts = accounts.filter(
-        account => account.symbol === 'eth' || account.symbol === 'sol' || account.symbol === 'ada',
+        account =>
+            account.symbol === 'eth' ||
+            account.symbol === 'sol' ||
+            account.symbol === 'ada' ||
+            account.symbol === 'trx',
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-06-24

> I'm not sure why we haven't done up to this point but what about using network config `getNetwork(account.symbol).features.includes('staking')` so we move the source of truth there?

**@TomasBoda** · 2026-06-25

> I definitely agree, but there were some reasons it was designed like this at the beginning, I believe due to fiat rates fetching. I can look at it and create follow-up PRs

---
