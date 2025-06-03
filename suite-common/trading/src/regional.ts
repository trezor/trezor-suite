import {
    EEACountryCodeType,
    EEACountryCodes,
    countries as countriesRecord,
} from '@suite-common/geolocation';
import { isArrayMember } from '@trezor/utils';

class Regional {
    readonly UNKNOWN_COUNTRY = 'unknown' as const;

    countries: [string, string][] = [
        [this.UNKNOWN_COUNTRY, '🌍 Worldwide'],
        ...Object.values(countriesRecord).map(
            ({ code, flag, name }) => [code, `${flag} ${name}`] as [string, string],
        ),
    ];

    countriesMap = new Map<string, string>(this.countries);

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
