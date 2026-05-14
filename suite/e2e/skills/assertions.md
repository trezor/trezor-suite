# Assertions Strategy - AI Instructions

> **When to use**: Every time you write an `expect()` call, wait for a condition.
> **Prerequisites**: [./locators.md](locators.md) for locator strategies used in examples.

## Core Rules

MUST: Use `expect` from custom matchers (`testExtends/customMatchers.ts`)
MUST: Use Playwrights `Web-First Assertions` according to documentation
MUST_NOT: Compare against untranslated strings (use translation key validation)

---

## String Validation Hierarchy

Apply in this order:

1. **Translations** (references from translation definitions in `suite/intl/src/messages.ts`)

    ```typescript
    await expect(header).toHaveTranslation('TR_SEND_TITLE');
    ```

2. **toHaveText** (exact text match)

    ```typescript
    await expect(amount).toHaveText('1,234.56');
    ```

3. **Narrower locator or `toContainText`** (if element has other content)

    ```typescript
    // ✅ Request narrower testid from product
    await expect(card.getByTestId('@dashboard/asset/price')).toHaveText('$45,000');

    // ⚠️ Last resort if narrower locator unavailable, inform developer and discuss it
    await expect(card).toContainText('$45,000');
    ```

---

## Do Not Duplicate Playwright's Implicit Checks

Playwright performs actionability checks (visible, stable, receives events, enabled) and auto-retries assertions automatically. Never add manual waits or pre-action `expect` calls to verify these.

**Redundant code (❌ WRONG):**

```typescript
// ❌ WRONG: Manual wait before action, testing if enabled
await page.waitForTimeout(500);
await expect(button).toBeEnabled();
await button.click();
```

---

## Anti-Patterns

❌ Hardcoded strings without translation:

```typescript
await expect(header).toHaveText('Send Bitcoin');
```

❌ Hardcoded timeouts:

```typescript
await page.waitForTimeout(2000);
```

❌ Using `toContainText` when narrower locator exists:

```typescript
await expect(card).toContainText('0.5 BTC'); // might match other text
```

❌ one-liner that hides test intent

```typescript
async verifyAmount(value: string) {
    await expect(this.amount).toHaveText(value);
}
```
