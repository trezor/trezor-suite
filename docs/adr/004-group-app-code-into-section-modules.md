# Group application code into one module per app section

## Context

[ADR-001](./001-separate-app-and-lego-code.md) separates application composition from reusable
building blocks, but does not define how app code is divided into packages.

Native already groups app sections into packages such as `@suite-native-app/module-send` and
`@suite-native-app/module-trading`. Desktop and web keep their pages and much of the application
wiring together in `@suite-app/app`. ADR-001's illustrative sign-verify package,
`@suite-app/sign-verify-page`, also leaves open whether packages should follow individual pages or
broader app sections.

We need a consistent convention for grouping app code as the
[application code migration](https://github.com/trezor/trezor-suite/issues/34625) continues. This ADR
supplements ADR-001 with that convention.

## Decision

Group app code into one module package per **section of the app**:
`@suite-native-app/module-<section>` on native and `@suite-app/module-<section>` on desktop and web.

A module usually corresponds to one page, but can contain several related pages in the same
section. For example, `module-send` covers sending, `module-sign-verify` covers signing and verifying
messages, and `module-trading` can contain buy, sell and exchange pages.

- **A module contains the section's wiring:** its pages, screens and navigation, and the
  section-specific code that assembles them from lego.
- **Only app assembly imports a module:** `@suite-native-app/app`, or `@suite-app/app` and the
  application roots. Modules do not import each other; code two sections share belongs in lego.
- **The `module-*` prefix applies to app sections.** App-wide packages such as `app`, `state` and
  `suite-sync` keep names that describe their responsibilities.

Module packages are app code under ADR-001. Reusable features and business logic belong in lego
packages, including code shared between desktop and native. Network modules use lego and do not
import app modules.

Under this convention, the desktop/web sign-verify package illustrated as
`@suite-app/sign-verify-page` in ADR-001 is named `@suite-app/module-sign-verify`.

## Rejected alternatives

- **Keep desktop/web page wiring together in `@suite-app/app`.** This leaves section boundaries
  implicit and keeps unrelated sections coupled through a single application package.
- **Create one package per page regardless of section.** Related pages can share section-specific
  wiring. Splitting them into separate modules would fragment that wiring or encourage dependencies
  between modules.
- **Use `module-*` for every app package.** Packages such as `app`, `state` and `suite-sync` do not
  represent app sections. This is the broader alternative rejected in ADR-001; using the prefix for
  sections complements the separation between app and lego scopes.

## Consequences

- Native, desktop and web use the same convention for finding a section's application wiring.
  Package boundaries make dependencies between sections explicit.
- More package boundaries require additional manifests and dependency declarations. Existing
  dependencies between sections may require extracting reusable parts into lego.
- Apply the convention opportunistically as described in ADR-001, when development requires moving
  or splitting app code. Existing packages may need further separation to meet these boundaries.
- Revisit the grouping if related pages repeatedly need the same application wiring across module
  boundaries, or if a section grows to contain unrelated responsibilities.
