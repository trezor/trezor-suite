import { fixtures,
    btcdirectSavingsFixtures,
    swanSavingsFixtures,
    btcdirectSavingsFixturesDictionary,
    swanSavingsFixturesDictionary
} from './fixtures';
import { TestSavingsSetupStatus } from './types';

const InvityApiUrlToIntercept = 'https://exchange.trezor.io';

const interceptInvityApiInternal = (path: string, fixture: string) => {
    cy.intercept(`${InvityApiUrlToIntercept}${path}`, {
        fixture,
    });
};

export const interceptInvityApi = () => {
    Object.entries(fixtures).forEach(fixtureEntry => {
        const [path, fixture] = fixtureEntry;
        interceptInvityApiInternal(path, fixture);
    });
};

const interceptInvityApiSavings = (fixtures: any, status: TestSavingsSetupStatus) => {
    console.log("status", status)

    const fixture = fixtures[status]
    console.log("fixture", fixture)
    interceptInvityApiInternal('/api/savings/trezor/trade', fixture);
    // Object.entries(fixtures).forEach(fixtureEntry => {
    //     const [path, getFixture] = fixtureEntry;
    //     console.log('getFixture', getFixture(status));
    //     interceptInvityApiInternal(path, getFixture(status));
    // });
};

export const interceptInvityApiSavingsBtcDirect = (status: TestSavingsSetupStatus) =>
    interceptInvityApiSavings(btcdirectSavingsFixturesDictionary, status);

export const interceptInvityApiSavingsSwan = (status: TestSavingsSetupStatus) =>
    interceptInvityApiSavings(swanSavingsFixturesDictionary, status);
