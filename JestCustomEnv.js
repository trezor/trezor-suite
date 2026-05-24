// eslint-disable-next-line import/no-extraneous-dependencies
const NodeEnvironment = require('jest-environment-node').default;

// Heuristic: a frame is "ours" when it points at /packages/* outside node_modules.
// Used to keep DeprecationWarning trap from firing on warnings raised by third-party deps
// (which we can't fix anyway). Returns the offending own-code frame, or null.
const findOwnCodeFrame = stack => {
    if (typeof stack !== 'string') return null;
    for (const line of stack.split('\n')) {
        if (line.includes('/node_modules/')) continue;
        if (line.includes('/packages/') || line.includes('/suite-common/')) {
            return line.trim();
        }
    }

    return null;
};

class CustomEnvironment extends NodeEnvironment {
    async setup() {
        await super.setup();

        process.on('warning', warning => {
            if (warning.name === 'MaxListenersExceededWarning') {
                throw new Error(
                    'MaxListenersExceededWarning detected. If you need more, use events.setMaxListeners(desiredNumber)',
                );
            }

            if (warning.name === 'DeprecationWarning') {
                // Only fail on deprecations triggered by our own code — third-party deps
                // emit deprecations we cannot fix, and we don't want to gate tests on them.
                const ourFrame = findOwnCodeFrame(warning.stack);
                if (ourFrame) {
                    throw new Error(
                        `DeprecationWarning from own code: ${warning.message}\nAt: ${ourFrame}`,
                    );
                }
            }
        });
    }

    async teardown() {
        process.removeAllListeners('warning');
        await super.teardown();
    }
}

module.exports = CustomEnvironment;
