import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { portfolioTrackerBtcAccountState } from '../fixtures/portfolioTrackerBtcAccountState';
import { onHome } from '../pageObjects/homeActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState } from '../support/setup';

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    portfolioTrackerBtcAccountState,
);

/**
 * Opening the Earn screen is the whole test: it asserts nothing about the screen beyond it being
 * reachable, because the numbers come from the instrumentation the screen carries rather than from
 * anything asserted here. `useScreenPerformance('earn')` reports TTFF/TTI/FID once the screen has
 * settled, the app writes that line to the device log, and the run's report picks it up.
 *
 * Three launches rather than one because the report takes a median per screen: the tab navigator
 * keeps a screen mounted once visited, so a second visit in the same session would not measure a
 * mount again, and a single measurement on a shared CI runner says very little on its own.
 */
describe('Earn screen performance [@noDevice]', () => {
    it.each([1, 2, 3])('Open the Earn screen (sample %i)', async () => {
        await openApp({ args: { preloadedState } });
        await onHome.assertIsPortfolioGraphVisible();

        await onTabBar.navigateToEarn();
    });
});
