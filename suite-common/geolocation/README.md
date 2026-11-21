# @suite-common/geolocation

Country catalogue, the IP country lookup and the presence estimator. The estimator tells whether the user is
**physically** in one of the given countries (presence, not residence).

## Presence estimator

`estimatePresence(countries, { ipCountry, timeZone, primaryRegion, secondaryRegions })` is pure and returns
`{ score, evidence }`: `score` is between 0 and 1 (not a probability), `evidence` is `'none' | 'weak' | 'strong'`. It
contains no policy: the caller passes the countries and applies thresholds.

Each signal resolves to a country code and counts as `match` (in `countries`), `mismatch` (another known country) or
missing (`null`, `T1`, `XX`, `UTC`, `Etc/*`, unknown code).

- `timeZone`: where the user is now, mapped by `getTimeZoneCountry`.
- `primaryRegion`: device region (desktop, mobile) or region of the first browser language (web), a hint about where
  the user is from.
- `secondaryRegions`: regions of later languages. Used only without a primary region, and they never raise evidence to
  `strong`.
- `ipCountry`: from `services.trezor.io/get-country/`.

Time zone and region come from the same OS setup, so they are combined in one table instead of multiplied (rows: time
zone, columns: region):

| Time zone \ region | match       | mismatch    | missing   |
| ------------------ | ----------- | ----------- | --------- |
| match              | 0.99 strong | 0.75 weak   | 0.95 weak |
| mismatch           | 0.45 weak   | 0.01 strong | 0.10 weak |
| missing            | 0.80 weak   | 0.15 weak   | 0.50 none |

The IP is independent and applied as a likelihood ratio: `score = s * LR / (s * LR + (1 - s))`, `LR` 99 on match, 0.01
on mismatch; a missing IP keeps the table value. With an IP, `evidence` is `weak` when the IP disagrees with the time
zone or the region, otherwise `strong`. `estimatePresence.test.ts` covers every combination.

**The table values and IP ratios are an approved decision.** Change them only with the same sign-off.

## Time zone table

`src/presence/timeZoneCountries.ts` is a static file, created on 2026-11-11 from
https://data.iana.org/time-zones/releases/tzdata2026f.tar.gz.

## IP country

`fetchCountryCodeThunk` fetches the country (10 s timeout, concurrent calls share one request) and records
`countryCodeFetch: { status, timestamp }`. A failed fetch keeps the last known `countryCode`, so presence detection
keeps using it until a refresh succeeds.

`refreshPresenceIpCountryThunk` (`@suite-common/regions`) runs for every user whatever the flag, because flag targeting
may need `countryCode`. It checks at app start and every 60 s, and refetches after 1 h, or 5 min after a failure. With
Suite Tor on, the endpoint returns `T1`, a missing IP.

The `geolocation` slice is not persisted, and its values must not reach logs, Sentry or analytics.
