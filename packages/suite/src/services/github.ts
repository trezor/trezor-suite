import { getFwVersion, isBitcoinOnly, getDeviceModel } from '@suite-utils/device';
import { isDesktop, getUserAgent, getScreenWidth, getScreenHeight } from '@suite-utils/env';
import type { ReleaseInfo } from '@suite-types/github';
import type { TrezorDevice } from '@suite-types';
import { TransportInfo } from 'trezor-connect';

const REPO_INFO = {
    owner: 'trezor',
    repo: 'trezor-suite',
};

const RELEASE_URL = `https://github.com/${REPO_INFO.owner}/${REPO_INFO.repo}`;

type DebugInfo = {
    device?: TrezorDevice;
    transport?: Partial<TransportInfo>;
};

export const getReleaseNotes = async (version?: string) => {
    if (!version) {
        return;
    }

    const url = `https://api.github.com/repos/${REPO_INFO.owner}/${REPO_INFO.repo}/releases/tags/v${version}`;
    const response = await fetch(url);
    const release = await response.json();

    return release as ReleaseInfo;
};

const getDeviceInfo = (device?: TrezorDevice) => {
    if (!device?.features) {
        return '';
    }
    return `model ${getDeviceModel(device)} ${getFwVersion(device)} ${
        isBitcoinOnly(device) ? 'Bitcoin only' : 'regular'
    } (revision ${device.features.revision})`;
};

const getSuiteInfo = () =>
    `${isDesktop() ? 'desktop' : 'web'} ${process.env.VERSION} (${process.env.COMMITHASH})`;

const getTransportInfo = (transport?: Partial<TransportInfo>) => {
    if (!transport?.type) {
        return 'N/A';
    }
    return transport?.type === 'bridge' ? `${transport.type} ${transport.version}` : transport.type;
};

export const openGithubIssue = ({ device, transport }: DebugInfo) => {
    const url = new URL(`${RELEASE_URL}/issues/new`);

    const body = `
**Describe the bug**
A clear and concise description of what the bug is.

**Steps to reproduce:**
1. a
2. b
3. c

**Info:**
 - Suite version: ${getSuiteInfo()}
 - Browser: ${getUserAgent()}
 - OS: ${navigator.platform}
 - Screen: ${getScreenWidth()}x${getScreenHeight()}
 - Device: ${getDeviceInfo(device)}
 - Transport: ${getTransportInfo(transport)}

**Expected result:**
A clear and concise description of what you expected to happen.

**Actual result:**
A clear and concise description of what actually happens.

**Screenshots:**
Insert here.

**Note(s):**
Add any other context about the problem here.
`;

    url.searchParams.set('body', body);

    window.open(url.toString());
};

export const getReleaseUrl = (version: string) => `${RELEASE_URL}/releases/tag/v${version}`;
