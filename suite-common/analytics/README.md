# Suite Analytics

This is the shared analytics package for Trezor Suite, containing all event types used across the app. It is designed to work in both web and native (mobile) environments.

Depending on your environment, you can choose one of the following packages, each with its own set of events:

| Package                   | Environment     | Events Defined In                                        |
| ------------------------- | --------------- | -------------------------------------------------------- |
| `@suite-common/analytics` | `@suite-common` | [`./src/events/shared`](./src/events/shared/)            |
| `@trezor/suite-analytics` | `@trezor/suite` | [`./src/events/suite`](./src/events/suite)               |
| `@suite-native/analytics` | `@suite-native` | [`./src/events/suite-native`](./src/events/suite-native) |

More details can be found in the [company Notion](https://www.notion.so/satoshilabs/Data-analytics-938aeb2e289f4ca18f31b1c02ab782cb) where implemented events with expected attributes and other notes related to analytics can be found.

## Tracking

Data from **production** builds (codesign branch) should be sent to:

- Desktop build: https://data.trezor.io/suite/log/desktop/stable.log
- Web build: https://data.trezor.io/suite/log/web/stable.log
- Mobile build: https://data.trezor.io/suite/log/mobile/stable.log

Data from **development** builds should be sent to:

- Desktop build: https://data.trezor.io/suite/log/desktop/develop.log
- Web build: https://data.trezor.io/suite/log/web/develop.log
- Mobile build: https://data.trezor.io/suite/log/mobile/develop.log

## Add/Modify event

In case a new event has to be added or an old one has to be modified, please follow the following subsections.

### What to track

Navigation between pages is not required to be tracked as it is tracked automatically by `router/location-change` event. However, a case when it is good to track it is when a user can get to the same location using different methods (e.g. two different buttons on the same page). All other user actions without sensitive info can be tracked. If you are in doubt, please contact our analyst.

## Type declaration

All events and their properties should be declared in [src/events/suite/types.ts](./src/events/suite/types.ts) (or in the corresponding directory for other environments).
Event types should be declared in the `EventType` enum in [src/events/suite/constants.ts](./src/events/suite/constants.ts).
Supplementary types can be declared in [src/events/suite/definitions.ts](./src/events/suite/definitions.ts).

## Reporting in code

To report an event, import `analytics` from the package based on your environment and initialize analytics (as soon as app starts).

```
// Desktop/web
import { analytics } from '@trezor/suite-analytics';
// Suite Native
import { analytics } from '@suite-native/analytics';
// Suite Common
import { analytics } from '@suite-common/analytics';

analytics.init(enabled, {
    instanceId,
    sessionId,
    environment,
    commitId,
    isDev,
    callbacks: {
        onEnable: () => ...,
        onDisable: () => ...,
    },
});
```

After that, you can use `report` method anywhere in your project scope.

```
analytics.report({
    type: 'event',
    payload: {
        attribute: attributeValue,
    },
});
```

### Versioning

From Suite version 22.10.1, analytics uses Suite versioning. That means, that analytics version will change even if there are no changes in analytics changelog. However, there can be changes in Suite functionality, which can also change behavior of analytics.

## Changelog

Add a record of change to [Notion](https://www.notion.so/satoshilabs/Changelog-Suite-1551ab666b1943f080ff56ffc6896d12). Please use a format of previous records.

## Company table

Add event to the analytics overview in the [Company Notion](https://www.notion.so/satoshilabs/Data-analytics-938aeb2e289f4ca18f31b1c02ab782cb).

## How to check that events are tracked?

1. **Option**: Open DevTools, navigate to **Network tab**, filter traffic by `.log` and check the **Query String Parameters** section
1. **Option**: Get access to Keboola via access form (link in [company Notion](https://www.notion.so/satoshilabs/Engineering-6d5f34c46db041318ceeecb65f973980))
1. **Option**: Create a modified build of app with an analytics server URL pointing to your server

Suite Native:

1. **Option**: Set the environment variable `EXPO_PUBLIC_IS_ANALYTICS_LOGGER_ENABLED=true` and run the app. The logs will be printed to the console.
