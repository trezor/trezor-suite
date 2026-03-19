import TrezorConnect from '@trezor/connect';
import { getAccountInfoMockedResponses } from '../fixtures/connect/getAccountInfo';

const originalGetAccountInfo = TrezorConnect.getAccountInfo;

TrezorConnect.getAccountInfo = params => {
    const { coin, descriptor } = params;

    // If there is mocked response for this specific coin and descriptor skip the execution.
    const mockedResponse = getAccountInfoMockedResponses[coin]?.[descriptor];
    if (mockedResponse) return mockedResponse;

    return originalGetAccountInfo(params);
};

// need to disable this rule to mimic export pattern of original index file.
// eslint-disable-next-line import/no-default-export
export default TrezorConnect;
export * from '@trezor/connect';
