/* eslint-disable import/no-default-export */

jest.mock('@fivebinaries/coin-selection', () => ({
    __esModule: true,
    default: () => {},
    coinSelection: () => {},
}));

export default {};
