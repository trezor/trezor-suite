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
            { value: this.UNKNOWN_COUNTRY, label: '🌍 Worldwide' },
            ...typedObjectValues(countriesRecord)
                .filter(countriesFilter)
                .map(({ code, flag, name }) => ({ value: code, label: `${flag} ${name}` })),
        ].sort((c1, c2) => {
            const l1 = c1.label.split(' ')[1];
            const l2 = c2.label.split(' ')[1];

            return l1.localeCompare(l2);
        });

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
}

export const regional = new Regional(() => true);
export const nonSanctionedRegional = new Regional(({ code }) => !SANCTIONED_COUNTRIES.has(code));
