import {
    ComprehensivelySanctionedCountryCodes,
    EEACountryCodeType,
    EEACountryCodes,
    OfacSanctionedCountryCodes,
    countries as countriesRecord,
} from '@suite-common/geolocation';
import { isArrayMember, typedObjectValues } from '@trezor/utils';

import { TradingCountryCode, TradingCountryOption } from './types';

type CountryItem = (typeof countriesRecord)[keyof typeof countriesRecord];

const SANCTIONED_COUNTRIES = new Set([
    ...ComprehensivelySanctionedCountryCodes,
    ...OfacSanctionedCountryCodes,
]);

class Regional {
    readonly UNKNOWN_COUNTRY = 'unknown' as const;
    readonly countriesOptions: TradingCountryOption[];
    readonly countriesOptionsMap: Map<TradingCountryCode, TradingCountryOption>;

    constructor(countriesFilter: (country: CountryItem) => boolean) {
        this.countriesOptions = [
            {
                value: this.UNKNOWN_COUNTRY,
                label: '🌍 Worldwide',
                shortLabel: '🌍 Worldwide',
                codeAlpha3: this.UNKNOWN_COUNTRY,
                flag: '🌍',
                name: 'Worldwide',
            },
            ...typedObjectValues(countriesRecord)
                .filter(countriesFilter)
                .map(({ code, codeAlpha3, flag, name }) => ({
                    value: code,
                    label: `${flag} ${name}`,
                    shortLabel: `${flag} ${codeAlpha3}`,
                    codeAlpha3,
                    flag,
                    name,
                })),
        ].sort((c1, c2) => c1.name.localeCompare(c2.name));

        this.countriesOptionsMap = new Map(
            this.countriesOptions.map(option => [option.value, option]),
        );
    }

    isInEEA(country: string): country is EEACountryCodeType {
        return isArrayMember(country, EEACountryCodes);
    }

    isSanctioned(country: string): boolean {
        return SANCTIONED_COUNTRIES.has(country as TradingCountryCode);
    }

    getCountryOptionWithWorldwideFallback(country: string): TradingCountryOption {
        const option = this.countriesOptionsMap.get(country as TradingCountryCode);
        if (option) {
            return option;
        }

        return this.countriesOptionsMap.get(this.UNKNOWN_COUNTRY)!;
    }

    isWorldwideRegion(country: string): boolean {
        return [this.UNKNOWN_COUNTRY, 'XX', 'T1'].includes(country);
    }
}

export const regional = new Regional(() => true);
export const nonSanctionedRegional = new Regional(({ code }) => !SANCTIONED_COUNTRIES.has(code));
