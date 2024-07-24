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
        });
    }
}

module.exports = CustomEnvironment;
