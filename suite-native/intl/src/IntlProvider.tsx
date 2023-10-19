import { IntlProvider as ReactIntlProvider } from 'react-intl';

import { en } from './en';

// flatten object to single level deep like { a: { b: { c: 1 } } } => { 'a.b.c': 1 }
const flatten = (obj: Record<string, any>, prefix = '') => {
    const result: Record<string, any> = {};
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        const prefixedKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object') {
            Object.assign(result, flatten(value, prefixedKey));
        } else {
            result[prefixedKey] = value;
        }
    });

    return result;
};

const enFlat = flatten(en);

export const IntlProvider = ({ children }: { children: React.ReactNode }) => (
    <ReactIntlProvider locale="en" defaultLocale="en" messages={enFlat}>
        {children}
    </ReactIntlProvider>
);
