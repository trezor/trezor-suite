# Await & Retry Strategy

> **When to use**: Every time you wonder why a test is flaky due to timing.
> **Prerequisites**: [./locators.md](locators.md) for locator strategies used in examples.

## Core Patterns (3 Essentials)

### 1. Expect-Based Retry (Full Operation Retry)

Wrap the full flaky operation in `expect(async () => { ... }).toPass({ timeout })`. The entire block retries with exponential backoff. Use for UI operations that fail intermittently (dropdown selection, navigation).

### 2. Poll-Based Retry (Value Polling)

Use `expect.poll(() => fn, message).toBeGreaterThanOrEqual(n)` to poll a specific value until a condition is met. Use for analytics request counts, state change counters.

### 3. Redux State Waits

Use `page.expectReduxObjectNotToBeEmpty()`, `page.expectReduxObjectToEqual()`, or `page.expectReduxSubtreeToContain()` before actions that have race conditions in automation. To find the right property to wait on, use `page.runWithReduxDump()` — it writes before/after state snapshots to disk; diff the files to identify what changed.

---

## Device Interaction (Critical)

**Always** verify the device prompt is shown **before** triggering a device action (`device.pressYes()`, etc.). Use `devicePrompt.confirmOnDevicePromptIsShown()` or `devicePrompt.waitForFinalPromptAndConfirm()` for multi-step flows.
Verify display before action: use `device.expectToContainOnDisplay()` before `device.pressYes()`

---

## Network Waits (Race Condition Prevention)

**Golden Rule**: Create the `waitForRequest` promise **before** triggering the action that fires the request, not after.

---

## Anti-Patterns

### ❌ Arbitrary Delays

```typescript
await page.waitForTimeout(5000); // DON'T do this
```

**Exception LAST RESORT**: Only with explanation comment for animation sync.

```typescript
await page.waitForTimeout(500); // Wait for walletSwitcher animation
```
