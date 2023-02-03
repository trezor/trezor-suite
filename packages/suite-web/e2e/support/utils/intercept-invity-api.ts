import { fixtures, btcdirectSavingsFixtures, swanSavingsFixtures } from './fixtures';
import { SavingsSetupStatus } from 'invity-api';

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
    fixtures: Record<string, (status: SavingsSetupStatus) => string>,
    status: SavingsSetupStatus,
) => {
    Object.entries(fixtures).forEach(fixtureEntry => {
        const [path, getFixture] = fixtureEntry;
        interceptInvityApiInternal(path, getFixture(status));
    });
};

export const interceptInvityApiSavingsBtcDirect = (status: SavingsSetupStatus) =>
    interceptInvityApiSavings(btcdirectSavingsFixtures, status);

export const interceptInvityApiSavingsSwan = (status: SavingsSetupStatus) =>
    interceptInvityApiSavings(swanSavingsFixtures, status);
