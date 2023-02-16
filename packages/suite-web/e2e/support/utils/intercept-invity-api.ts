import { fixtures, btcdirectSavingsFixtures, swanSavingsFixtures } from './fixtures';
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

const interceptInvityApiSavings = (
    fixtures: Record<string, (status: TestSavingsSetupStatus) => string>,
    status: TestSavingsSetupStatus,
) => {
    Object.entries(fixtures).forEach(fixtureEntry => {
        const [path, getFixture] = fixtureEntry;
        interceptInvityApiInternal(path, getFixture(status));
    });
};

export const interceptInvityApiSavingsBtcDirect = (status: TestSavingsSetupStatus) =>
    interceptInvityApiSavings(btcdirectSavingsFixtures, status);

export const interceptInvityApiSavingsSwan = (status: TestSavingsSetupStatus) =>
    interceptInvityApiSavings(swanSavingsFixtures, status);
