import { toTorUrl } from './tor';

import { TOR } from '@suite-constants';

/**
 * returns tor url if tor url is request and tor url is available for given domain
 */
export const getUrl = (url: string, isTor: boolean) => {
    const { host } = new URL(url);
    const [a, b] = host.split('.').reverse();
    const domain = `${b}.${a}`;

    // @ts-ignore
    const torCounterpartDomain = TOR[domain];

    console.log(domain);

    if (isTor && torCounterpartDomain) {
        return toTorUrl(url);
    }

    return url;
};
