# AWS Analytics: Technical details

## Tracking process

Data about interactions are transferred in GET HTTPS requests encoded in URI.

Data from **production** builds (codesign branch) are sent to:

-   Desktop build: https://data.trezor.io/suite/log/desktop/stable.log
-   Web build: https://data.trezor.io/suite/log/web/stable.log

Data from **development** builds are sent to:

-   Desktop build: https://data.trezor.io/suite/log/desktop/develop.log
-   Web build: https://data.trezor.io/suite/log/web/develop.log

List of available configured endpoints:

    https://data.trezor.io/suite/log    /desktop   /staging     .log
    https://data.trezor.io/suite/log    /desktop   /beta        .log
    https://data.trezor.io/suite/log    /desktop   /develop     .log
    https://data.trezor.io/suite/log    /desktop   /stable      .log
    https://data.trezor.io/suite/log    /web       /staging     .log
    https://data.trezor.io/suite/log    /web       /beta        .log
    https://data.trezor.io/suite/log    /web       /develop     .log
    https://data.trezor.io/suite/log    /web       /stable      .log

Example URI:

`https://data.trezor.io/suite/log/web/stable.log?c_v=1.8&c_type=transport-type&c_commit=4d09d88476dab2e6b2fbfb833b749e9ac62251c2&c_instance_id=qlT0xL2XKV&c_session_id=FZjilOYQic&c_timestamp=1624893047903&type=bridge&version=2.0.30`

Which tracks:

```
{
  c_v: '1.11',
  c_type: 'transport-type',
  c_commit: '4d09d88476dab2e6b2fbfb833b749e9ac62251c2',
  c_instance_id: 'qlT0xL2XKV',
  c_session_id: 'FZjilOYQic',
  c_timestamp: 1624893047903,
  type: 'bridge',
  version: '2.0.30'
}
```

Attributes which are always tracked:

-   **c_v**: version of analytics
-   **c_type**: type of tracked event
-   **c_commit**: current revision of app
-   **c_instance_id**: until user does not wipe storage, the id is still same
-   **c_session_id**: id changed on every launch of app
-   **c_timestamp**: time in ms when event is created (added in 1.11)

Other attributes are connected to a specific type of events.

Specific events can be found in `analyticsActions.ts` file and also in [company docs](https://www.notion.so/satoshilabs/Data-analytics-938aeb2e289f4ca18f31b1c02ab782cb) where implemented events with expected attributes and other notes related to analytics can be found.

## Add/Modify event

In case a new event has to be added or an old one has to be modified, please follow the following subsections.

### What to track

Navigation between pages is not required to be tracked as it is tracked automatically by `router/location-change` event. However, a case when it is good to track it is when a user can get to the same location using different methods (e.g. two different buttons on the same page). All other user actions without sensitive info can be tracked. If you are in doubt, please contact our analyst.

### Type declaration

All events and their properties should be declared in `AnalyticsEvent` type in `analyticsActions.ts` file.

### Reporting in code

To report an event, use `useAnalytics` hook in your component and use its `report` method.

```
analytics.report({
    type: 'event',
    payload: {
        attribute: attributeValue,
    },
});
```

### Versioning

`version` variable in `analyticsActions.ts` file should be bumped (applies only if it has not yet been bumped in the current version of the app). Please follow simple semver versioning in format `<breaking-change>.<analytics-extended>`.
Breaking change should bump major version. Any other change bumps minor version.

### Changelog

Add a record of change to [Changelog](aws.md#Changelog) section. Please use a format of previous records.

### Company table

Add event to the analytics overview in the [company table](https://www.notion.so/satoshilabs/Data-analytics-938aeb2e289f4ca18f31b1c02ab782cb).

## How does analytics work?

1. User with enabled analytics interacts with the application
2. Events are sent to specific endpoints
3. Collected data are parsed and analysed (can be seen in Keboola)
4. Charts and metrics are created (in Tableau)
5. We know how to improve the application

## How to check that events are tracked?

1. **Option**: Open DevTools, navigate to **Network tab**, filter traffic by `.log` and check the **Query String Parameters** section
2. **Option**: Get access to Keboola
3. **Option**: Create a modified build of app with an analytics server URL pointing to your server
