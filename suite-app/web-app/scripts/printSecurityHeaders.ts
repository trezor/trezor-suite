import { getSecurityHeaders, getSecurityHeadersByPath } from '../constants/webSecurityHeaders';

const formatHeaders = (headers: Readonly<Record<string, string>>) =>
    Object.entries(headers)
        .map(([name, value]) => `${name}: ${value}`)
        .join('\n');

const headerSets = [
    `# Every path not listed below\n${formatHeaders(getSecurityHeaders())}`,
    ...Array.from(
        getSecurityHeadersByPath(),
        ([path, headers]) => `# ${path}\n${formatHeaders(headers)}`,
    ),
];

process.stdout.write(
    `# Paths are relative to the Suite web root, e.g. https://suite.trezor.io/web\n\n${headerSets.join('\n\n')}\n`,
);
