# Comments & documentation

Code comments that do not explain the whole rule they document.

**1 review-thread-group(s)** · [← back to index](../README.md)

Tags: `incomplete-comment`

| # | PR | File | Tags |
| --- | --- | --- | --- |
| [G70](#g70--packagessuitesrcactionswalletwrapnativetokenthunksts93) | [#30797](https://github.com/trezor/trezor-suite/pull/30797) | `wrapNativeTokenThunks.ts:93` | incomplete-comment |

---

### G70 — `packages/suite/src/actions/wallet/wrapNativeTokenThunks.ts:93`

- **PR** [#30797 — feat(suite-desktop): ensure auto-tracked wrapped native assets](https://github.com/trezor/trezor-suite/pull/30797) · author `@53gur0` · merged
- **My first comment** 2026-08-04
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30797#discussion_r3712209811
- **Line of code** https://github.com/trezor/trezor-suite/blob/f0c0c9ae1224757da8738a3abbc08f5d343c0706/packages/suite/src/actions/wallet/wrapNativeTokenThunks.ts#L93 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved · outdated
- **Tags** `incomplete-comment`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -85,27 +87,36 @@ export const submitWrapNativeTokenThunk = createThunk(
                 return undefined;
             }
 
+            // Start tracking the wrapped native token so it shows up in the interface without the
+            // user having to manually paste its contract address. Once it's part of account.tokens
+            // it also survives account refreshes (see fetchAccountTokens). Dedupe so re-wrapping an
+            // already-tracked token doesn't create a duplicate entry.
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-04

> This comment misses some parts. Maybe adding one-line sentence comment could do it:
> ```
> // Make sure re-wrapping doesn't create a duplicate
> ```

---
