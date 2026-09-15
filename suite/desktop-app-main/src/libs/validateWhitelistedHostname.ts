import { isIP } from 'net';

const HOSTNAME_LABEL_REGEXP = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

type ValidateWhitelistedHostnameParams = {
    hostname: string;
    warn?: (message: string) => void;
};

const getIPAddressCandidate = (hostname: string): string =>
    hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;

export const validateWhitelistedHostname = ({
    hostname,
    warn,
}: ValidateWhitelistedHostnameParams): string | undefined => {
    const normalizedHostname = hostname.trim().toLowerCase();

    if (normalizedHostname === '') {
        warn?.(`Ignoring empty hostname.`);

        return;
    }

    const ipAddressCandidate = getIPAddressCandidate(normalizedHostname);

    if (isIP(ipAddressCandidate) !== 0) return normalizedHostname;
    if (normalizedHostname === 'localhost') return normalizedHostname;

    if (normalizedHostname.startsWith('.') || normalizedHostname.endsWith('.')) {
        warn?.(`Ignoring hostname "${hostname}" because it starts or ends with a dot.`);

        return;
    }

    const hostnameLabels = normalizedHostname.split('.');

    if (hostnameLabels.length < 2) {
        warn?.(`Ignoring hostname "${hostname}" because it is single-label.`);

        return;
    }

    if (hostnameLabels.some(label => label === '' || !HOSTNAME_LABEL_REGEXP.test(label))) {
        warn?.(`Ignoring hostname "${hostname}" because it contains invalid characters.`);

        return;
    }

    return normalizedHostname;
};

type ValidateWhitelistedHostnamesParams = {
    hostnames: string[];
    warn?: (message: string) => void;
};

export const validateWhitelistedHostnames = ({
    hostnames,
    warn,
}: ValidateWhitelistedHostnamesParams): string[] =>
    hostnames
        .map(hostname => validateWhitelistedHostname({ hostname, warn }))
        .filter(item => item !== undefined);
