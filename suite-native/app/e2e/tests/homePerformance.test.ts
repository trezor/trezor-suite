import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { portfolioTrackerBtcAccountState } from '../fixtures/portfolioTrackerBtcAccountState';
import { onHome } from '../pageObjects/homeActions';
import { openApp, preparePreloadedReduxState } from '../support/setup';

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    portfolioTrackerBtcAccountState,
);

/**
 * Launching to Home is the whole test: it asserts nothing beyond the portfolio graph appearing,
 * because the numbers come from the instrumentation the screen carries rather than from anything
 * asserted here. `useScreenPerformance('home')` reports TTFF/TTI/FID once discovery has settled,
 * the app writes that line to the device log, and the run's report picks it up.
 *
 * Five launches rather than one because the report takes a median per screen, and one measurement
 * on a shared CI runner says very little on its own. `openApp` defaults to a new instance, so each
 * sample is a cold mount rather than a screen the navigator kept alive.
 */
describe('Home screen performance [@noDevice]', () => {
    it.each([1, 2, 3, 4, 5])('Launch to the Home screen (sample %i)', async () => {
        await openApp({ args: { preloadedState } });

        await onHome.assertIsPortfolioGraphVisible();
    });
});
