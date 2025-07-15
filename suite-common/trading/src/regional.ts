import {
    EEACountryCodeType,
    EEACountryCodes,
    countries as countriesRecord,
} from '@suite-common/geolocation';
import { isArrayMember, typedObjectValues } from '@trezor/utils';

import { TradingCountryCode } from './types';

class Regional {
    readonly UNKNOWN_COUNTRY = 'unknown' as const;

    countries: [TradingCountryCode, string][] = [
        [this.UNKNOWN_COUNTRY, '🌍 Worldwide'],
        ...typedObjectValues(countriesRecord).map(
            ({ code, flag, name }) => [code, `${flag} ${name}`] as [TradingCountryCode, string],
        ),
    ];

    countriesMap = new Map<TradingCountryCode, string>(this.countries);

    countriesOptions = this.countries
        .map(([code, name]) => ({
            label: name,
            value: code,
        }))
        .sort((c1, c2) => {
            const l1 = c1.label.split(' ')[1];
            const l2 = c2.label.split(' ')[1];

            return l1.localeCompare(l2);
        });

    isInEEA(country: string): country is EEACountryCodeType {
        return isArrayMember(country, EEACountryCodes);
    }
}

export const regional = new Regional();
