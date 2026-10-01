const loadCardanoRuntime = () =>
    Promise.reject(new Error('Cardano runtime is disabled for the Android E2E memory experiment'));

// eslint-disable-next-line import/no-default-export
export default loadCardanoRuntime;
