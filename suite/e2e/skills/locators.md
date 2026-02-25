# Locators Strategy - AI Instructions

> **When to use**: Every time you need to find an element on the page.

## Constraints

PRIORITY_1: MUST reuse already defined locators in our Page Objects and Custom Fixtures
PRIORITY_2: MUST use getByTestId() whenever TestID attribute exists
PRIORITY_3: MUST chain to parent if multiple instances exist
PRIORITY_4: MUST use parameterized methods for dynamic values

MUST_NOT: Use CSS classes, XPath indices, or hardcoded text selectors
MUST_NOT: Scatter locators in tests—only in Page Objects
MUST_NOT: Use implicit waits or hardcoded timeouts

## Decision Tree for Locator Selection

Does element have data-testid?
├─ YES → Use getByTestId() [PRIMARY]
├─ NO → HALT: Request TestID be added to component

## Strategy

### PRIMARY: TestID Locators

**FORMAT:** `@category/subcategory/element[/property]`

- `@` prefix required
- `category` ∈ {staking, trading, wallet, modal, account, send, fee-card}
- `subcategory` = context (form, rewards-item, input)
- `element` = target (date, crypto-amount, button)
- `/property` = variant (optional)

### SECONDARY: Chained Locators

When multiple elements share the same testid pattern, get the parent first and query the child within it.

**Do not use** if a unique testid exists without a parent—use PRIMARY directly.

### TERTIARY: Parameterized Locators

When the testid contains a dynamic segment (token, currency, code), declare a method returning `Locator` as a `readonly` property.

---

## Forbidden Patterns (MUST_NOT)

❌ CSS class selectors – breaks on CSS refactor: `this.page.locator('.button-primary')`
❌ XPath with indices – brittle, breaks on DOM changes: `this.page.locator('//button[3]')`
❌ Text-only selectors – fragile to copy/i18n: `this.page.getByText('Claim Rewards')`
❌ Hardcoded timeouts: `await page.waitForTimeout(2000)`

---

## Naming Rules (MUST_FOLLOW)

**Regex validation:** `^@[a-z-]+/[a-z-]+/[a-z-]+(/[a-z0-9-]+)?$`

✅ VALID: `@staking/rewards-item`, `@trading/form/crypto-input`, `@fee-card/economy-rate`
❌ INVALID: `rewards-item`, `@rewards-item`, `@trading/input`, `@staking/rewardsItem`
