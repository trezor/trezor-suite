import { type SuiteRouterHistory } from '../src';

export const mockSuiteRouterHistory = (): SuiteRouterHistory => ({
    getLocation: () => ({ pathname: '/mocked-path', hash: '', search: '' }),
    navigate: () => {},
    listen: () => () => {},
});
