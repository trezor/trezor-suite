import { TrezorBlockchain } from '../../../../packages/blockchain-core/src/index';
import { getAccountInfoMockedResponses } from '../fixtures/connect/getAccountInfo';

const originalGetAccountInfo = TrezorBlockchain.getAccountInfo;

TrezorBlockchain.getAccountInfo = (params, options) => {
    const { coin, descriptor } = params;

    // If there is mocked response for this specific coin and descriptor skip the execution.
    const mockedResponse = getAccountInfoMockedResponses[coin]?.[descriptor];
    if (mockedResponse) return Promise.resolve(mockedResponse);

    return originalGetAccountInfo(params, options);
};

export * from '../../../../packages/blockchain-core/src/index';
