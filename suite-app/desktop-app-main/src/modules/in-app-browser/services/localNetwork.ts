import { type Session } from 'electron';
import { isIPv4, isIPv6 } from 'net';

import { safeParseUrl } from '@trezor/utils';

import { type ILogger } from '../../../libs/logger';
import { SERVICE_NAME } from '../constants';

type Ipv4Range = {
    prefix: [number, number, number, number];
    bits: number;
};

// The IPv4 blocks a page could use to reach this machine or the network it sits on: "this"
// network, loopback, the private blocks, the shared block carriers put customers behind, and
// link-local, which is also where cloud metadata services answer.
const LOCAL_IPV4_RANGES: Ipv4Range[] = [
    { prefix: [0, 0, 0, 0], bits: 8 },
    { prefix: [10, 0, 0, 0], bits: 8 },
    { prefix: [100, 64, 0, 0], bits: 10 },
    { prefix: [127, 0, 0, 0], bits: 8 },
    { prefix: [169, 254, 0, 0], bits: 16 },
    { prefix: [172, 16, 0, 0], bits: 12 },
    { prefix: [192, 168, 0, 0], bits: 16 },
];

// Names that never leave the machine or its network, whatever they resolve to: `.local` is mDNS,
// `.internal` and `home.arpa` are reserved for private use.
const LOCAL_HOSTNAME_SUFFIXES = ['.localhost', '.local', '.internal', '.home.arpa'];

const toIpv4Number = ([first, second, third, fourth]: Ipv4Range['prefix']) =>
    ((first << 24) | (second << 16) | (third << 8) | fourth) >>> 0;

// The URL parser folds every spelling of an IPv4 address (`2130706433`, `0x7f000001`, `127.1`)
// into the dotted quad, so this is the only form a hostname arrives in.
const parseIpv4 = (hostname: string): number | undefined => {
    if (!isIPv4(hostname)) {
        return undefined;
    }

    const [first, second, third, fourth] = hostname.split('.').map(Number);

    if (
        first === undefined ||
        second === undefined ||
        third === undefined ||
        fourth === undefined
    ) {
        return undefined;
    }

    return toIpv4Number([first, second, third, fourth]);
};

const isLocalIpv4 = (address: number) =>
    LOCAL_IPV4_RANGES.some(({ prefix, bits }) => {
        const shift = 32 - bits;

        return address >>> shift === toIpv4Number(prefix) >>> shift;
    });

// An IPv4 address embedded in the last group of an IPv6 one (`::ffff:127.0.0.1`), as its two
// hextets.
const toEmbeddedIpv4Hextets = (group: string): string[] | undefined => {
    const ipv4 = parseIpv4(group);

    return ipv4 === undefined
        ? undefined
        : [(ipv4 >>> 16).toString(16), (ipv4 & 0xffff).toString(16)];
};

// The eight hextets of an IPv6 host as the URL parser serializes it, which keeps the brackets
// around the address and may keep an IPv4 address embedded in its last group.
const parseIpv6Hextets = (hostname: string): number[] | undefined => {
    const address =
        hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;

    if (!isIPv6(address)) {
        return undefined;
    }

    const hasGap = address.includes('::');
    const [head = '', tail = ''] = address.split('::');
    const headGroups = head === '' ? [] : head.split(':');
    const tailGroups = tail === '' ? [] : tail.split(':');
    const lastGroup = tailGroups[tailGroups.length - 1] ?? headGroups[headGroups.length - 1];
    const groups = [...headGroups, ...tailGroups];

    if (lastGroup?.includes('.')) {
        const embedded = toEmbeddedIpv4Hextets(lastGroup);

        if (embedded === undefined) {
            return undefined;
        }

        groups.splice(-1, 1, ...embedded);
    }

    const missing = 8 - groups.length;

    if (missing < 0 || (!hasGap && missing !== 0)) {
        return undefined;
    }

    const gapIndex = headGroups.length;
    const gap = hasGap ? Array.from({ length: missing }, () => '0') : [];

    return [...groups.slice(0, gapIndex), ...gap, ...groups.slice(gapIndex)].map(hextet =>
        parseInt(hextet, 16),
    );
};

// Unspecified and loopback (`::`, `::1`), link-local, the deprecated site-local block and unique
// local addresses; an IPv4-mapped address is judged as the IPv4 address it carries.
const isLocalIpv6 = (hextets: number[]) => {
    const first = hextets[0] ?? 0;
    const seventh = hextets[6] ?? 0;
    const eighth = hextets[7] ?? 0;
    const isIpv4Mapped = hextets.slice(0, 5).every(hextet => hextet === 0) && hextets[5] === 0xffff;

    if (isIpv4Mapped) {
        return isLocalIpv4(((seventh << 16) | eighth) >>> 0);
    }

    const isUnspecifiedOrLoopback =
        hextets.slice(0, 7).every(hextet => hextet === 0) && eighth <= 1;
    const isLinkLocal = (first & 0xffc0) === 0xfe80;
    const isSiteLocal = (first & 0xffc0) === 0xfec0;
    const isUniqueLocal = (first & 0xfe00) === 0xfc00;

    return isUnspecifiedOrLoopback || isLinkLocal || isSiteLocal || isUniqueLocal;
};

const isLocalHostname = (hostname: string) => {
    const name = hostname.endsWith('.') ? hostname.slice(0, -1) : hostname;

    return name === 'localhost' || LOCAL_HOSTNAME_SUFFIXES.some(suffix => name.endsWith(suffix));
};

/**
 * Whether `url` points at this machine or the network it sits on, judged by the host as the URL
 * parser canonicalizes it: a loopback, private, shared or link-local address in either IP version,
 * or a name reserved for local use. A public name that resolves to a local address is not caught
 * here — only the resolver sees that, which is what Chromium's own local-network checks are for.
 */
export const isLocalNetworkUrl = (url: string): boolean => {
    const hostname = safeParseUrl(url)?.hostname;

    if (hostname === undefined) {
        return false;
    }

    const ipv4 = parseIpv4(hostname);

    if (ipv4 !== undefined) {
        return isLocalIpv4(ipv4);
    }

    const ipv6Hextets = parseIpv6Hextets(hostname);

    if (ipv6Hextets !== undefined) {
        return isLocalIpv6(ipv6Hextets);
    }

    return isLocalHostname(hostname);
};

/**
 * Cancels every request the session makes to the local network. The guards on the view decide
 * where its main frame and its popups may go, not what its subresources, frames, scripts and
 * sockets may reach — and this machine answers on loopback: Suite's own HTTP receiver and the
 * Trezor Bridge. Chromium sends loopback traffic past any proxy, so Tor does not close this
 * either. The page sees `ERR_BLOCKED_BY_CLIENT`, as it would for a blocked tracker.
 * - Electron keeps one `onBeforeRequest` listener per session and this module is the only one
 *   that touches its sessions, so it is installed where a session is created and this runs once.
 */
export function denyLocalNetworkRequests(inAppBrowserSession: Session, logger: ILogger): void {
    inAppBrowserSession.webRequest.onBeforeRequest((details, callback) => {
        if (!isLocalNetworkUrl(details.url)) {
            callback({});

            return;
        }

        logger.warn(SERVICE_NAME, `Blocked a request to the local network: ${details.url}`);
        callback({ cancel: true });
    });
}
