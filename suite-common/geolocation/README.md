# @suite-common/geolocation

Country catalogue, the IP country lookup and the presence estimator. The estimator tells whether the user is
**physically** in one of a list of countries. It is a different question from residence.

## Presence estimator

```ts
estimatePresence(countries, { ipCountry, timeZone, primaryRegion, secondaryRegions });
estimatePresenceByDeviceSignals(countries, { timeZone, primaryRegion, secondaryRegions });
```

Both are pure functions: no I/O, no logging. They return `{ score, evidence }`:

- `score` is between 0 and 1. It is **not** a probability.
- `evidence` is `'none' | 'weak' | 'strong'`.

The estimator contains no policy. The caller passes the countries, and applies thresholds to the result (see
`selectIsRegionRestrictedBySignals` in `@suite-common/regions`). No country is hardcoded.

### Signals

| Signal             | Meaning                                                                                                | Missing when                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `ipCountry`        | Raw country from `services.trezor.io/get-country/`                                                     | `null`, `T1` (Tor), `XX`, unknown code           |
| `timeZone`         | IANA zone name, looked up in `timezoneCountries`                                                       | `null`, `UTC`, `Etc/*`, `GMT`, zone not in table |
| `primaryRegion`    | Device region (desktop, mobile) or region of the first browser language (web)                          | `null` or not a known country code (`ZZ`, `419`) |
| `secondaryRegions` | Regions of later languages. Used only when there is no primary region, and they cap evidence at `weak` | empty, or no known country code                  |

Each signal is converted to a country code (the time zone via `timezoneCountries`) and compared with the `countries`
argument. In the app, `countries` comes from the `regions.presenceRestriction` feature payload.

- `match`: the code is in `countries`.
- `mismatch`: a known country code that is not in `countries`.
- missing: no known country code.

### Model

Time zone and region are set together when the OS is installed, so they are not independent. They are combined in one
table instead of being multiplied (rows: time zone, columns: region):

| Time zone \ region | match       | mismatch    | missing   |
| ------------------ | ----------- | ----------- | --------- |
| match              | 0.99 strong | 0.75 weak   | 0.95 weak |
| mismatch           | 0.45 weak   | 0.01 strong | 0.10 weak |
| missing            | 0.80 weak   | 0.15 weak   | 0.50 none |

If the region came only from `secondaryRegions` and the cell is `strong`, it is downgraded to `weak`. This table alone
is `estimatePresenceByDeviceSignals`.

The IP comes from the network path, not from device setup, so `estimatePresence` adds it as one likelihood ratio:

```
odds  = cell.score / (1 - cell.score) * IP_LR
score = odds / (1 + odds)
IP_LR = 99 (match), 0.01 (mismatch); a missing IP returns the cell unchanged
```

With an IP, `evidence` is `weak` when the IP disagrees with the time zone or the region (both present, different
outcomes), or when the region came only from `secondaryRegions`. Otherwise it is `strong`.

Resulting values (rounded; `estimatePresence.test.ts` covers every cell):

| Time zone, region  | IP match    | IP mismatch | IP missing  |
| ------------------ | ----------- | ----------- | ----------- |
| match, match       | 1.00 strong | 0.50 weak   | 0.99 strong |
| match, mismatch    | 1.00 weak   | 0.03 weak   | 0.75 weak   |
| match, missing     | 1.00 strong | 0.16 weak   | 0.95 weak   |
| mismatch, match    | 0.99 weak   | 0.01 weak   | 0.45 weak   |
| mismatch, mismatch | 0.50 weak   | 0.00 strong | 0.01 strong |
| mismatch, missing  | 0.92 weak   | 0.00 strong | 0.10 weak   |
| missing, match     | 1.00 strong | 0.04 weak   | 0.80 weak   |
| missing, mismatch  | 0.95 weak   | 0.00 strong | 0.15 weak   |
| missing, missing   | 0.99 strong | 0.01 strong | 0.50 none   |

**The cell values and IP weights are an approved product and legal decision.** Do not change them in a code review or
to make a test pass. A change needs the same sign-off as the original values.

## Time zone table

`src/presence/timezoneCountries.ts` maps IANA zone names to countries. It is a static file taken from IANA tzdata (the
version is in its header), not generated at build time and not downloaded at runtime.

How it is built:

1. Every `zone.tab` entry: `TZ → country code`. Codes unknown to `countries.ts` are skipped.
2. Every `Link <target> <name>` line of `backward` (not `#Link`) adds `name` with the target's country, unless `name`
   is already present. Direct `zone.tab` entries always win.
3. No non-geographic zone (`Etc/*`, `GMT*`, `UTC`, `UCT`, `Zulu`, `Universal`, `Greenwich`) may be in the table.
4. Keys are sorted. Keys that are valid identifiers are written without quotes (prettier style).

`zone1970.tab` is not used: it merges zones of different countries that have had the same clocks since 1970.

### Updating to a new tzdata release

1. Download `tzdataYYYYx.tar.gz` and `tzdataYYYYx.tar.gz.asc` from `https://data.iana.org/time-zones/releases/`.
2. Verify the signature: `gpg --verify tzdataYYYYx.tar.gz.asc tzdataYYYYx.tar.gz`. The signing key is Paul Eggert's,
   fingerprint `7E37 92A9 D8AC F7D6 33BC 1588 ED97 E90E 62AA 7E34`. Do not use unsigned sources, such as raw files from
   a git host.
3. Compare `zone.tab` and `backward` with the previous release (`NEWS` lists the changes), and apply the rules above to
   the table by hand.
4. Update the version in the file header, and extend `timezoneCountries.test.ts` if a relevant zone changed.
