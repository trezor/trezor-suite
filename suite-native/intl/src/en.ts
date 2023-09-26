// Few rules:
// 1. Never use dynamic keys IDs for example: translate(`module.graph.coin.${symbol}`) instead map it to static key: { btc: translate('module.graph.coin.btc') }
// 2. Don't split string because of formatting or nested components use Rich Text Formatting instead https://formatjs.io/docs/react-intl/components#rich-text-formatting
// 3. Always wrap keys per module/screen/feature for example: module.graph.legend

export const en = {
    moduleHome: {
        graph: {
            title: 'My portfolio balance',
        },
    },
    moduleConnectDevice: {
        connectCrossroads: {
            gotMyTrezor: {
                title: "I've got my Trezor",
                description: 'Connect to manage your assets',
                connectButton: 'Connect Trezor',
            },
            syncCoins: {
                title: 'Sync coins without your Trezor',
                description:
                    "Track your favorite coins anytime, anywhere, even when your Trezor isn't connected.",
                syncButton: 'Sync my coins',
            },
        },
        connectAndUnlock: {
            title: 'Connect & unlock your Trezor',
        },
        pinScreen: {
            title: 'Enter PIN',
            entered: 'Entered',
            digits: 'digits',
            keypadInfo: 'The keypad is displayed on your Trezor',
            enterPin: 'Enter pin',
        },
        connectingDevice: {
            title: 'Connecting',
            hodlOn: 'Hodl on tight',
        },
    },
};

export type Translations = typeof en;
