/* eslint-disable no-console */
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { portfolioTrackerBtcAccountState } from '../fixtures/portfolioTrackerBtcAccountState';
import { onHome } from '../pageObjects/homeActions';
import { median, roundMetric } from '../performance/aggregate';
import { openApp, preparePreloadedReduxState } from '../support/setup';

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    portfolioTrackerBtcAccountState,
);

const SAMPLES = [1, 2, 3, 4, 5];
// Resolved from this file rather than the working directory, so it lands beside the run's report
// wherever the runner happens to be invoked from.
const RESULT_PATH = path.resolve(__dirname, '../../artifacts/performance/launch-benchmark.json');

const launchToHomeMs: number[] = [];

/**
 * Launch to Home, timed from outside the app.
 *
 * `useScreenPerformance('home')` starts its clock when the Home component mounts, so it reports
 * how long the screen takes to render and settle — not how long the app takes to get there. The
 * work this benchmark is aimed at happens before that mount, where the screen's own numbers cannot
 * see it, so the span is taken here instead: from the launch request to the portfolio graph being
 * on screen, which is what a person holding the phone would call "opening the app".
 *
 * The two instruments are kept side by side rather than one replacing the other. This one spans
 * everything including Detox's own launch overhead, so it is the noisier of the two and only worth
 * reading as a difference between two builds measured the same way.
 */
describe('Home screen performance [@noDevice]', () => {
    it.each(SAMPLES)('Launch to the Home screen (sample %i)', async () => {
        const startedAt = Date.now();

        await openApp({ args: { preloadedState } });
        await onHome.assertIsPortfolioGraphVisible();

        launchToHomeMs.push(Date.now() - startedAt);
    });

    afterAll(() => {
        if (launchToHomeMs.length === 0) {
            return;
        }

        const summary = {
            samples: launchToHomeMs,
            medianMs: median(launchToHomeMs),
            minMs: Math.min(...launchToHomeMs),
            maxMs: Math.max(...launchToHomeMs),
        };

        mkdirSync(path.dirname(RESULT_PATH), { recursive: true });
        writeFileSync(RESULT_PATH, `${JSON.stringify(summary, null, 2)}\n`);

        console.log(
            `[launch-benchmark] median ${roundMetric(summary.medianMs ?? 0)} ms ` +
                `over ${launchToHomeMs.length} launches (${summary.minMs}-${summary.maxMs} ms): ` +
                `${JSON.stringify(summary.samples)}`,
        );
    });
});
