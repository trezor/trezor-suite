export const controllerManager = (controller: any) => ({
    /**
     * @version
     * version of firmware in emulator, only few are supported
     * @wipe
     * shall be emulator wiped before start? defaults to true
     */
    setupEmu: async (options: any) => {
        const defaults = {
            // some random empty seed. most of the test don't need any account history so it is better not to slow them down with all all seed
            mnemonic:
                'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
            pin: '',
            passphrase_protection: false,
            label: 'My Trevor',
            needs_backup: false,
        };

        // before setup, stop bridge and start it again after it. it has no performance hit
        // and avoids 'wrong previous session' errors from bridge. actual setup is done
        // through udp transport if bridge transport is not available
        await controller.send({ type: 'bridge-stop' });
        await controller.send({
            type: 'emulator-setup',
            ...defaults,
            ...options,
        });
        await controller.send({ type: 'bridge-start' });
        return null;
    },
    sendToAddressAndMineBlock: async (options: any) => {
        await controller.send({
            type: 'regtest-send-to-address',
            ...options,
        });
        return null;
    },
    mineBlocks: async (options: any) => {
        await controller.send({
            type: 'regtest-mine-blocks',
            ...options,
        });
        return null;
    },
    startBridge: async (version: number) => {
        await controller.send({ type: 'bridge-start', version });
        return null;
    },
    stopBridge: async () => {
        await controller.send({ type: 'bridge-stop' });
        return null;
    },
    startEmu: async (arg: any) => {
        const params = {
            type: 'emulator-start',
            version: process.env.FIRMWARE || '2-latest',
            ...arg,
        };
        await controller.send(params);
        return params;
    },
    stopEmu: async () => {
        await controller.send({ type: 'emulator-stop' });
        return null;
    },
    wipeEmu: async () => {
        await controller.send({ type: 'emulator-wipe' });
        return null;
    },
    pressYes: async () => {
        await controller.send({ type: 'emulator-press-yes' });
        return null;
    },
    pressNo: async () => {
        await controller.send({ type: 'emulator-press-no' });
        return null;
    },
    swipeEmu: async (direction: string) => {
        await controller.send({ type: 'emulator-swipe', direction });
        return null;
    },
    inputEmu: async (value: any) => {
        await controller.send({ type: 'emulator-input', value });
        return null;
    },
    clickEmu: async (options: any) => {
        await controller.send({ type: 'emulator-click', ...options });
        return null;
    },
    resetDevice: async (options: any) => {
        await controller.send({ type: 'emulator-reset-device', ...options });
        return null;
    },
    readAndConfirmMnemonicEmu: async () => {
        await controller.send({ type: 'emulator-read-and-confirm-mnemonic' });
        return null;
    },
    readAndConfirmShamirMnemonicEmu: async (options: any) => {
        await controller.send({
            type: 'emulator-read-and-confirm-shamir-mnemonic',
            ...options,
        });
        return null;
    },
    applySettings: async (options: any) => {
        await controller.send({
            type: 'emulator-apply-settings',
            ...options,
        });
        return null;
    },
    selectNumOfWordsEmu: async (num: number) => {
        await controller.send({ type: 'emulator-select-num-of-words', num });
        return null;
    },
    logTestDetails: async (text: string) => {
        await controller.send({ type: 'log', text });
        return null;
    },
    trezorUserEnvConnect: async () => {
        await controller.connect();

        return null;
    },
    trezorUserEnvDisconnect: async () => {
        await controller.disconnect();
        return null;
    },
});
