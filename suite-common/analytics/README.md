# Suite Analytics

Shared analytics package for Trezor Suite. It defines event types and enables tracking of user behaviour on both desktop and mobile.

More details: [Data analytics (Notion)](https://www.notion.so/satoshilabs/Data-analytics-938aeb2e289f4ca18f31b1c02ab782cb).

---

## Contents

1. [Which package to use](#1-which-package-to-use)
2. [Where data is sent](#2-where-data-is-sent)
3. [Adding or modifying an event](#3-adding-or-modifying-an-event)
4. [Reporting events in code](#4-reporting-events-in-code)
5. [Verifying that events are tracked](#5-verifying-that-events-are-tracked)

---

## 1. Which package to use

Events are split by platform. **First choose the package based on where you are writing code:**

| Package                   | Platform             | Where events are defined                           |
| ------------------------- | -------------------- | -------------------------------------------------- |
| `@suite/analytics`        | **Desktop**          | `suite/analytics/src/events`                       |
| `@suite-native/analytics` | **Mobile**           | `suite-native/analytics/src/events`                |
| `@suite-common/analytics` | **Desktop & mobile** | `suite-common/analytics/src/events` (this package) |

Definitions in these packages are the single source of truth. When reporting in code, import from the package that matches your platform (see section 4).

**When to use `suite-common/analytics`:** Only when reporting an event that is defined in `suite-common/*` (i.e. in this package). For all other cases, use the platform-specific package (`@suite/analytics` or `@suite-native/analytics`). We prefer having separate events for mobile and desktop even when they represent the same user action—flows look and behave differently on phone vs desktop, and reusing the same event can be misleading for analysis.

---

## 2. Where data is sent

| Environment               | Desktop                                                | Web                                                | Mobile                                                |
| ------------------------- | ------------------------------------------------------ | -------------------------------------------------- | ----------------------------------------------------- |
| **Production** (codesign) | `https://data.trezor.io/suite/log/desktop/stable.log`  | `https://data.trezor.io/suite/log/web/stable.log`  | `https://data.trezor.io/suite/log/mobile/stable.log`  |
| **Development**           | `https://data.trezor.io/suite/log/desktop/develop.log` | `https://data.trezor.io/suite/log/web/develop.log` | `https://data.trezor.io/suite/log/mobile/develop.log` |

---

## 3. Adding or modifying an event

### What to track

- Page navigation is tracked automatically (`router/location-change`); do not send it manually.
- Manual tracking makes sense when the same screen can be reached in different ways (e.g. two different buttons on one page).
- You can track any user actions that do not contain sensitive data.
- When in doubt ask in `#data_suite` channel on Slack

### Where to define an event

- In the appropriate package (see table above), in the **`src/events`** directory.
- One event per file, with exports in **`src/events/index.ts`**.

### Event type (enum)

Add a new type to the **`EventType`** enum in the constants file of the relevant package:

- **suite-common:** [`src/constants.ts`](./src/constants.ts)
- **suite:** `suite/analytics/src/constants.ts`
- **suite-native:** `suite-native/analytics/src/constants.ts`

### Example event definition

```ts
import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'cta' | 'close'>;
    bannerType?: AttributeDef<string | null>;
};

export const promoDashboardBannerEvent: EventDef<Attributes, EventType.PromoDashboardBanner> = {
    name: EventType.PromoDashboardBanner,
    descriptionTrigger: 'A user clicks the dashboard promo banner',
    changelog: [{ version: '25.8.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '25.8.0', notes: 'added' }],
        },
        bannerType: {
            limitations: 'only selected strings allowed (e.g. `tex` and `ts7`)',
            changelog: [{ version: '25.8.0', notes: 'added' }],
        },
    },
};
```

### Changelog

Every change to an event or attribute must be recorded in the **`changelog`** array in its definition. Each entry has `version` (Suite version) and `notes` (description of the change).

---

## 4. Reporting events in code

### Step 1: Initialization (at app startup)

Import and initialization depend on the platform:

```ts
// Desktop
import { useAnalytics } from 'src/support/useAnalytics';

// Mobile
import { useAnalytics } from '@suite-native/services';

const analytics = useAnalytics();

analytics.init(enabled, {
    instanceId,
    sessionId,
    environment,
    commitId,
    isDev,
    callbacks: {
        onEnable: () => {
            /* ... */
        },
        onDisable: () => {
            /* ... */
        },
    },
});
```

### Step 2: Calling `report`

Anywhere in the project (after initialization):

```ts
// Desktop
import { useAnalytics } from 'src/support/useAnalytics';
import { events } from '@suite/analytics';

// Mobile
import { useAnalytics } from '@suite-native/services';
import { events } from '@suite-native/analytics';

const analytics = useAnalytics();

analytics.report({
    type: events.deviceConnectionHintModalEvent.name,
    payload: {
        option: 'notWorking',
    },
});
```

### In thunks

Analytics is available as `extra.services.analytics`:

```ts
export const sessionRequestThunk = createThunk<void, { event: WalletKitTypes.SessionRequest }>(
    `${WALLETCONNECT_MODULE}/sessionRequestThunk`,
    async ({ event }, { dispatch, extra }) => {
        extra.services.analytics.report({
            type: events.walletConnectSessionRequestEvent.name,
            payload: {
                origin: event.verifyContext.verified.origin,
                chainId: event.params.chainId,
                method: event.params.request.method,
            },
        });
    },
);
```

---

## 5. Verifying that events are tracked

**Desktop / Web:**

1. **DevTools** → **Network** tab → filter by `.log` → inspect **Query String Parameters** in the request.
2. **Keboola** — access via [access form](https://www.notion.so/satoshilabs/Engineering-6d5f34c46db041318ceeecb65f973980) in company Notion.
3. **Custom build** — build with the analytics server URL pointing to your own server.

**Suite Native (mobile):**

- Set the environment variable `EXPO_PUBLIC_IS_ANALYTICS_LOGGER_ENABLED=true` and run the app; events will be printed to the console.
