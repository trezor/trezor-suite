// eslint-disable-next-line import/no-extraneous-dependencies
const NodeEnvironment = require('jest-environment-node').default;

class CustomEnvironment extends NodeEnvironment {
    async setup() {
        await super.setup();

        process.on('warning', warning => {
            if (warning.name === 'MaxListenersExceededWarning') {
                throw new Error(
                    'MaxListenersExceededWarning detected. If you need more, use events.setMaxListeners(desiredNumber)',
                );
            }

            // TimeoutNegativeWarning / TimeoutOverflowWarning fire from setTimeout when ms is
            // negative or > 2^31-1. Almost always a date-arithmetic bug (e.g. `deadline - now`
            // where deadline is in the past). Near-zero false-positive surface.
            if (
                warning.name === 'TimeoutNegativeWarning' ||
                warning.name === 'TimeoutOverflowWarning'
            ) {
                throw warning;
            }
        });

        // console.error trap: a real console.error during a test is almost always either an
        // expected error path that the test forgot to assert on, or a missing mock that hides
        // a real production issue. Tests that legitimately want to silence the error must
        // jest.spyOn(console, 'error').mockImplementation(...) — the spy replaces this wrap.
        const originalError = this.global.console.error;
        this.global.console.error = (...args) => {
            originalError.apply(this.global.console, args);
            throw new Error(
                `Unexpected console.error during test. If this is expected, mock it with ` +
                    `jest.spyOn(console, 'error').mockImplementation(() => {}). Args: ${args
                        .map(a => (a instanceof Error ? a.message : String(a)))
                        .join(' ')}`,
            );
        };
    }

    async teardown() {
        process.removeAllListeners('warning');
        await super.teardown();
    }
}

module.exports = CustomEnvironment;
