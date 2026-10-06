import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        // Existing device files are migrated incrementally to @suite-common/device.
        files: ['src/device/**/*.{ts,tsx}'],
        ignores: [
            'src/device/deviceAddressUtils.ts',
            'src/device/deviceSelectors.ts',
            'src/device/deviceThunks.test.ts',
            'src/device/deviceThunks.ts',
            'src/device/entropyCheckThunks.ts',
            'src/device/preparePushNotificationMiddleware.ts',
            'src/device/publicKeyActions.ts',
            'src/device/__fixtures__/forgetPersistentDataPreloadedState.ts',
            'src/device/__fixtures__/handleDeviceDisconnect.ts',
        ],
        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'Program',
                    message:
                        'Do not add files to @suite-common/wallet-core/src/device. Add device code to @suite-common/device instead.',
                },
            ],
        },
    },
];
