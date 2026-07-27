# Page Objects: Structure and Patterns

> **When to use**: When building locators or actions for test scenarios. Page objects organize UI interactions into reusable, maintainable classes—avoid scattering `page.getByTestId()` calls throughout tests.
> **Prerequisites**: [./fixtures.md](fixtures.md) for fixture dependency injection patterns.

## Naming Suffixes (Critical)

Use clear suffixes to indicate page object type:

- **`Page`** — Entire page view (DashboardPage, WalletPage, SettingsPage, TradingPage)
- **`Section`** — Part of a page (AnalyticsSection, FeeSection, StakingSection)
- **`Modal`** — Dialog/overlay (ConnectPermissionsModal, TradingConfirmationModal)
- **`Panel`** — Side drawer (GuidePanel)
- **`Prompt`** — Device/system interaction (DevicePrompt)
- **`Input`** — Form component (TrezorInput)

**Wrong**: `UserActions`, `PageHelper`, `Utils` — these obscure intent and break discoverability.

---

## Anti-Patterns

❌ **Dynamic locators created inside methods** — declare as parameterized `readonly` property instead.
❌ **Passing `page` or page objects as method arguments** — they are constructor dependencies.
❌ **Methods that do multiple unrelated things.**
❌ **Public methods without `@step()`.**

---

Create a new page object when:

- [ ] 5+ related locators or methods exist
- [ ] Methods reference each other repeatedly
- [ ] Can be reused across multiple test files
- [ ] Has clear responsibility (single concern)
- [ ] Is semantically distinct (DashboardPage ≠ SettingsPage)

**Merge with existing object when**:

- Only 1-2 related actions
- Part of larger workflow (Settings → DebugTab)
- Utility functions with no locators

---
