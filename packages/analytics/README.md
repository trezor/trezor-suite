# Analytics

This is a generic analytics package. To use analytics in a specific environment,
please use one of the following packages or create a new one inspired by existing ones.

-   [Suite Analytics](../suite-analytics)

Keep in mind, that global `fetch` and `URLSearchParams` methods has to be available.

## Tracking process

Data about interactions are transferred in GET HTTPS requests encoded in URI.

List of available configured endpoints:

    https://data.trezor.io    /suite    /log    /desktop   /develop     .log
    https://data.trezor.io    /suite    /log    /desktop   /stable      .log
    https://data.trezor.io    /suite    /log    /web       /develop     .log
    https://data.trezor.io    /suite    /log    /web       /stable      .log

Example URI:

`https://data.trezor.io/suite/log/web/stable.log?c_v=1.8&c_type=transport-type&c_commit=4d09d88476dab2e6b2fbfb833b749e9ac62251c2&c_instance_id=qlT0xL2XKV&c_session_id=FZjilOYQic&c_timestamp=1624893047903&type=bridge&version=2.0.30`

Which tracks:

```
{
  c_v: '1.18',
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
