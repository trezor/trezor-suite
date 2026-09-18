// logErrorsBeforeRetry also makes Jest keep the retry reasons, which the Detox runner reports to
// Currents as the failures of the individual attempts (see e2e/trezorDetoxRunner/junitReport.ts).
jest.retryTimes(process.env.GITHUB_ACTION ? 2 : 0, { logErrorsBeforeRetry: true });
