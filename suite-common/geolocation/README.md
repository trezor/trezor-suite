# @suite-common/geolocation

Country catalogue, the IP country lookup and the presence estimator. The estimator tells whether the user is
**physically** in one of a list of countries. It is a different question from residence.

## Presence estimator

```ts
estimatePresence(countries, { ipCountry, timeZone, primaryRegion, secondaryRegions });
```

It is a pure function: no I/O, no logging. It returns `{ score, evidence }`:

- `score` is between 0 and 1. It is **not** a probability.
- `evidence` is `'none' | 'weak' | 'strong'`.

The estimator contains no policy. The caller passes the countries, and applies thresholds to the result. No country
is hardcoded.

### Signals

| Signal             | Meaning                                                                                                      | Missing when                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `ipCountry`        | Raw country from `services.trezor.io/get-country/`                                                           | `null`, `T1` (Tor), `XX`, unknown code           |
| `timeZone`         | IANA zone name, resolved by `getTimeZoneCountry`                                                             | `null`, `UTC`, `Etc/*`, `GMT`, zone not in table |
| `primaryRegion`    | Device region (desktop, mobile) or region of the first browser language (web)                                | `null` or not a known country code (`ZZ`, `419`) |
| `secondaryRegions` | Regions of later languages. Used only when there is no primary region, and they never make evidence `strong` | empty, or no known country code                  |

Each signal is converted to a country code (the time zone via `getTimeZoneCountry`) and compared with the `countries`
argument.

- `match`: the code is in `countries`.
- `mismatch`: a known country code that is not in `countries`.
- missing: no known country code.

### Primary and secondary regions

The time zone tells where the user is **now**. A region is a hint about where the user is **from**, taken from how the
device or browser is set up. A region on its own is never `strong` evidence of presence.

- `primaryRegion` is the main region setting of the device or browser.
- `secondaryRegions` are regions of its other languages. People often add a language for reasons other than where they
  are from, so these are weaker hints. They are used only when there is no primary region, and they never make the
  evidence `strong`: without an IP, a `strong` table value drops to `weak`; with an IP, they lower the evidence only when
  they disagree with it.
- `primaryRegion` resolves on its own. If it is missing or not a known country, the secondary regions decide: `match` if
  any of them is in `countries`, otherwise `mismatch` if any is a known country, otherwise missing.

### Model

Time zone and region are set together when the OS is installed, so they are not independent. They are combined in one
table, `ESTIMATE_BY_TIME_ZONE_AND_REGION`, instead of being multiplied (rows: time zone, columns: region):

| Time zone \ region | match       | mismatch    | missing   |
| ------------------ | ----------- | ----------- | --------- |
| match              | 0.99 strong | 0.75 weak   | 0.95 weak |
| mismatch           | 0.45 weak   | 0.01 strong | 0.10 weak |
| missing            | 0.80 weak   | 0.15 weak   | 0.50 none |

If the region came only from `secondaryRegions` and the table value is `strong`, it is downgraded to `weak`. Without an IP, this
is the result.

The IP comes from the network path, not from device setup, so `estimatePresence` adds it as one likelihood ratio:

```
odds  = deviceEstimate.score / (1 - deviceEstimate.score) * IP_LIKELIHOOD_RATIO
score = odds / (1 + odds)
      = s * IP_LIKELIHOOD_RATIO / (s * IP_LIKELIHOOD_RATIO + (1 - s)), where s = deviceEstimate.score
IP_LIKELIHOOD_RATIO = 99 (match), 0.01 (mismatch); a missing IP returns deviceEstimate unchanged
```

With an IP, `evidence` is `weak` when the IP disagrees with the time zone or the region (both present, different
outcomes). Otherwise it is `strong`. A region from `secondaryRegions` that agrees with the IP leaves the evidence as it
would be without it.

Resulting values (rounded; `estimatePresence.test.ts` covers every combination):

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

**The table values and IP likelihood ratios are an approved decision.** Do not change them in a code review or
to make a test pass. A change needs the same sign-off as the original values.

## Time zone table

`src/presence/timeZoneCountries.ts` maps IANA zone names to countries; read it through `getTimeZoneCountry`. It is a
static file, created on 2026-11-11 from https://data.iana.org/time-zones/releases/tzdata2026f.tar.gz.
