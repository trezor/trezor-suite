import { type DesktopApi } from '../src/api';

export const mockGetHttpReceiverAddress = (
    address = 'http://localhost:21325',
): jest.MockedFunction<DesktopApi['getHttpReceiverAddress']> =>
    jest
        .fn<ReturnType<DesktopApi['getHttpReceiverAddress']>, [route: string]>()
        .mockResolvedValue(address);
