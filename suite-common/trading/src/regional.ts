import {
    ComprehensivelySanctionedCountries,
    EEACountryCodeType,
    EEACountryCodes,
    OfacSanctionedCountries,
    countries as countriesRecord,
} from '@suite-common/geolocation';
import { isArrayMember, typedObjectValues } from '@trezor/utils';

import { TradingCountryCode } from './types';

class Regional {
    readonly UNKNOWN_COUNTRY = 'unknown' as const;

    readonly countries: [TradingCountryCode, string][] = [
        [this.UNKNOWN_COUNTRY, '🌍 Worldwide'],
        ...typedObjectValues(countriesRecord).map(
            ({ code, flag, name }) => [code, `${flag} ${name}`] as [TradingCountryCode, string],
        ),
    ];

    readonly countriesMap = new Map<TradingCountryCode, string>(this.countries);

    readonly sanctionedCountries = new Set([
        ...ComprehensivelySanctionedCountries,
        ...OfacSanctionedCountries,
    ]);

    readonly countriesOptions = this.countries
        .map(([code, name]) => ({
            label: name,
            value: code,
        }))
        .sort((c1, c2) => {
            const l1 = c1.label.split(' ')[1];
            const l2 = c2.label.split(' ')[1];

            return l1.localeCompare(l2);
        });

    readonly nonSanctionedCountries: { label: string; value: TradingCountryCode }[];

    constructor() {
        this.nonSanctionedCountries = this.countriesOptions.filter(
            ({ value }) => !this.isSanctionedCountry(value),
        );
    }

    isInEEA(country: string): country is EEACountryCodeType {
        return isArrayMember(country, EEACountryCodes);
    }

    isSanctionedCountry(country: TradingCountryCode): boolean {
        return this.sanctionedCountries.has(country);
    }
}

export const regional = new Regional();
