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
    }

    async teardown() {
        process.removeAllListeners('warning');
        await super.teardown();
    }
}

module.exports = CustomEnvironment;
