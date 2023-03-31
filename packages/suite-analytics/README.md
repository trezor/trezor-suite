# Suite Analytics

This package is intended to be used only by Suite in web (or in desktop app renderer) environment.

Specific events can be found in [src/types/events.ts](./src/types/events.ts) and also in [company Notion](https://www.notion.so/satoshilabs/Data-analytics-938aeb2e289f4ca18f31b1c02ab782cb) where implemented events with expected attributes and other notes related to analytics can be found.

## Tracking

Data from **production** builds (codesign branch) should be sent to:

-   Desktop build: https://data.trezor.io/suite/log/desktop/stable.log
-   Web build: https://data.trezor.io/suite/log/web/stable.log

Data from **development** builds should be sent to:

-   Desktop build: https://data.trezor.io/suite/log/desktop/develop.log
-   Web build: https://data.trezor.io/suite/log/web/develop.log

## Add/Modify event

In case a new event has to be added or an old one has to be modified, please follow the following subsections.

### What to track

Navigation between pages is not required to be tracked as it is tracked automatically by `router/location-change` event. However, a case when it is good to track it is when a user can get to the same location using different methods (e.g. two different buttons on the same page). All other user actions without sensitive info can be tracked. If you are in doubt, please contact our analyst.

## Type declaration

All events and their properties should be declared in [src/types/events.ts](./src/types/events.ts).

## Reporting in code

To report an event, import `analytics` from this package and initialize analytics (as soon as app starts).

```
import { analytics } from '@trezor/suite-analytics';

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
import { analytics } from '@trezor/suite-analytics';

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
