# CI, tooling & guardrails

GitHub Actions workflow configuration and lint rules that prevent whole classes of regressions.

**3 review-thread-group(s)** · [← back to index](../README.md)

Tags: `aws-session-duration` ×2, `github-actions` ×2, `eslint-rule`, `follow-up-issue`, `hotfix`, `proxy-regression`, `root-cause`

| # | PR | File | Tags |
| --- | --- | --- | --- |
| [G43](#g43--suite-commonearn-stablecoin-apisrchooksmerkl-rewardsusegetmerklrewardsts73) | [#29054](https://github.com/trezor/trezor-suite/pull/29054) | `useGetMerklRewards.ts:73` | eslint-rule, proxy-regression, follow-up-issue |
| [G52](#g52--githubworkflowsrelease-suite-coin-iconsyml46) | [#30091](https://github.com/trezor/trezor-suite/pull/30091) | `release-suite-coin-icons.yml:46` | github-actions, aws-session-duration, hotfix |
| [G53](#g53--githubworkflowsrelease-suite-coin-iconsyml46) | [#30091](https://github.com/trezor/trezor-suite/pull/30091) | `release-suite-coin-icons.yml:46` | github-actions, aws-session-duration, root-cause |

---

### G43 — `suite-common/earn-stablecoin-api/src/hooks/merkl-rewards/useGetMerklRewards.ts:73`

- **PR** [#29054 — perf(suite-desktop): tanstack query improvements](https://github.com/trezor/trezor-suite/pull/29054) · author `@53gur0` · merged
- **My first comment** 2026-06-24
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/29054#discussion_r3466747822
- **Line of code** https://github.com/trezor/trezor-suite/blob/2f97fd998cb3ebe9281946bf7288815092649074/suite-common/earn-stablecoin-api/src/hooks/merkl-rewards/useGetMerklRewards.ts#L73
- **Thread** 2 comment(s), 1 mine
- **Status** resolved
- **Tags** `eslint-rule`, `proxy-regression`, `follow-up-issue`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -70,7 +70,12 @@ export function useGetMerklRewards<Address extends string>(
     }, [queryClient, queryEntriesRef, chainsRewardsRef]);
 
     return {
-        ...queryResult,
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-06-24

> We should (in another PR) try to introduce some Eslint rule to warn us about that. ✍️ 🤔 
> I didn't realize it's gonna break the proxy, even though it's now very much obvious.

**@53gur0** · 2026-06-25

> https://github.com/trezor/trezor-suite/issues/29097

---

### G52 — `.github/workflows/release-suite-coin-icons.yml:46`

- **PR** [#30091 — fix(workflows): adjust aws session duration for icon workflow](https://github.com/trezor/trezor-suite/pull/30091) · author `@MiroslavProchazka` · open
- **My first comment** 2026-07-20
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30091#discussion_r3613679568
- **Line of code** https://github.com/trezor/trezor-suite/blob/d63a7b82cbe07139744abc9d4c2f52b01fe13906/.github/workflows/release-suite-coin-icons.yml#L46
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved
- **Tags** `github-actions`, `aws-session-duration`, `hotfix`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -43,6 +43,7 @@ jobs:
         with:
           role-to-assume: arn:aws:iam::538326561891:role/gh_actions_suite_production_icons
           aws-region: ${{ env.AWS_REGION }}
+          role-duration-seconds: 14400 # 4 hours
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-07-20

> It seems like a good hotfix. I'd just increase it to 5h as some successful runs took more than 4h.
>
> https://github.com/trezor/trezor-suite/actions/workflows/release-suite-coin-icons.yml?query=is%3Asuccess

---

### G53 — `.github/workflows/release-suite-coin-icons.yml:46`

- **PR** [#30091 — fix(workflows): adjust aws session duration for icon workflow](https://github.com/trezor/trezor-suite/pull/30091) · author `@MiroslavProchazka` · open
- **My first comment** 2026-07-20
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30091#discussion_r3613713586
- **Line of code** https://github.com/trezor/trezor-suite/blob/d63a7b82cbe07139744abc9d4c2f52b01fe13906/.github/workflows/release-suite-coin-icons.yml#L46
- **Thread** 4 comment(s), 2 mine
- **Status** unresolved
- **Tags** `github-actions`, `aws-session-duration`, `root-cause`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -43,6 +43,7 @@ jobs:
         with:
           role-to-assume: arn:aws:iam::538326561891:role/gh_actions_suite_production_icons
           aws-region: ${{ env.AWS_REGION }}
+          role-duration-seconds: 14400 # 4 hours
```

</details>

**Conversation**

**@vdovhanych** · 2026-07-20

> This is very long, and I don't want to have secrets available for this long.

**🟦 @cermakjiri (me)** · 2026-07-20

> The default is 1h, so is 4x longer really too long? The script might run over 4h (which itself the core issue) https://github.com/trezor/trezor-suite/actions/workflows/release-suite-coin-icons.yml?query=is%3Asuccess.

**@vdovhanych** · 2026-07-20

> Yes even 1 hour which is default is too long in my opinion. It should be asy to rework it so it runs stores the images and then in actions it authenticates and syncs those stored images

**🟦 @cermakjiri (me)** · 2026-07-21

> This should become hopefully irrelevant once this is going to be merged. 🙏   https://github.com/trezor/trezor-suite/pull/30108

---
