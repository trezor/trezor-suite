// Few rules:
// 1. Never use dynamic keys IDs for example: translate(`module.graph.coin.${symbol}`) instead map it to static key: { btc: translate('module.graph.coin.btc') }
// 2. Don't split string because of formatting or nested components use Rich Text Formatting instead https://formatjs.io/docs/react-intl/components#rich-text-formatting
// 3. Always wrap keys per module/screen/feature for example: module.graph.legend

export const en = {
    generic: {
        header: '<green>Trezor Suite</green> <grey>Lite</grey>',
        buttons: {
            back: 'Back',
            close: 'Close',
            confirm: 'Confirm',
            continue: 'Continue',
            next: 'Next',
            dismiss: 'Dismiss',
            eject: 'Eject',
        },
        unknownError: 'Something went wrong',
        default: 'Default',
    },
    messageSystem: {
        killswitch: {
            title: 'Update required',
            content:
                'Update to continue using Trezor Suite Lite. Don’t worry, your funds are secure.',
            cta: 'Download latest version',
        },
    },
    moduleHome: {
        graph: {
            title: 'My portfolio balance',
        },
        emptyState: {
            device: {
                title: 'Your wallet is empty',
                subtitle:
                    'You need to get some coins first in Trezor Suite Desktop or Web version.',
            },
            portfolioTracker: {
                title: 'Get started',
                subtitle: 'Sync your coin addresses and view your portfolio balance.',
                primaryButton: 'Sync & Track',
                secondaryButton: 'Settings',
                alert: 'This requires access to Trezor Suite coin addresses.',
            },
            connectOrImportCrossroads: {
                gotMyTrezor: {
                    title: 'Connect my Trezor',
                    description: 'Manage your coins with your Trezor connected.',
                    connectButton: 'Connect Trezor',
                },
                syncCoins: {
                    title: 'Track my coins',
                    description:
                        'Sync your favorite coins and track balances with portfolio tracker.',
                    syncButton: 'Sync & Track',
                },
            },
        },
        buttons: {
            syncMyCoins: 'Sync my coins',
            receive: 'Receive',
        },
        biometricsModal: {
            title: {
                ios: {
                    faceId: 'Enable FaceID',
                    touchId: 'Enable TouchID',
                },
                android: {
                    fingerprint: 'Enable fingerprint',
                    facial: 'Enable facial recognition',
                    combined: 'Enable biometrics',
                },
                unknown: 'Enable biometrics',
            },
            description: {
                ios: {
                    faceId: 'Use FaceID to unlock the app.',
                    touchId: 'Use TouchID to unlock the app.',
                },
                android: {
                    fingerprint: 'Use your fingerprint to unlock the app.',
                    facial: 'Use facial recognition to unlock the app.',
                    combined: 'Use facial recognition or fingerprint to unlock the app.',
                },
                unknown: 'Use biometrics to unlock the app.',
            },
            button: {
                later: 'I’ll do that later in Settings',
                enable: 'Enable',
            },
            resultMsg: {
                error: 'Unable to enable biometrics',
                success: 'Biometrics enabled',
            },
        },
    },
    assets: {
        dashboard: {
            discoveryProgress: { loading: 'Loading...', stillWorking: 'Retrieving balances' },
        },
    },
    biometrics: {
        ios: {
            faceId: 'Use FaceID',
            touchId: 'Use TouchID',
        },
        android: {
            fingerprint: 'Use fingerprint',
            facial: 'Use facial recognition',
            combined: 'Use biometrics',
        },
        unknown: 'Use biometrics',
    },
    moduleAccountImport: {
        title: 'Sync my coins',
        error: { unsupportedNetworkType: 'Unsupported account network type.' },
        summaryScreen: {
            title: {
                confirmToAdd: 'Confirm to add coin',
                alreadySynced: 'Coin already synced',
            },
            subtitle: "Here's what you have in your account.",
        },
        xpubScanScreen: {
            alert: {
                address: {
                    title: 'This is your receive address',
                    description: 'To check the balance of your coin, scan your public key (XPUB).',
                    hintButton: 'Where to find it?',
                },
                xpub: {
                    title: 'Incompatible XPUB detected',
                    description: "Provided XPUB doesn't correspond with selected network.",
                },
            },
            input: {
                label: {
                    xpub: 'Enter public key (XPUB) manually',
                    address: 'Enter address manually',
                },
                error: {
                    address: 'Address is not valid',
                },
            },
            hintBottomSheet: {
                title: {
                    xpub: 'Where is my public key (XPUB)?',
                    address: 'Where is my receive address?',
                },
                text: {
                    xpub: ' To view the public key (XPUB) of your account, open the Trezor Suite app, plug in your Trezor device, then select <emphasized>Details</emphasized>, then choose <emphasized>Show public key</emphasized>.',
                    address:
                        'To view the receive address of your account, open the Trezor Suite desktop app, plugin your Trezor device, select <emphasized>Accounts</emphasized>, choose <emphasized>Receive</emphasized>, and click on <emphasized>Show full address</emphasized>.',
                },
            },
            confirmButton: 'Got it',
        },
    },
    moduleAddAccounts: {
        addCoinAccountScreen: {
            title: 'Add new',
        },
        alerts: {
            tooManyAccounts: {
                title: 'You have reached maximum number of accounts',
                description: 'You can create up to 10 accounts of a type for each coin.',
                actionPrimary: 'Close',
            },
            anotherEmptyAccount: {
                title: 'Can’t create another fresh account',
                description: 'The last account you created for this coin has no transactions yet.',
                actionPrimary: 'Close',
                actionSecondary: 'Learn more',
                actionSecondaryUrl: 'https://trezor.io/learn/a/multiple-accounts-in-trezor-suite',
            },
            generalError: {
                title: 'We couldn’t add your account.',
                description: 'There’s been an unknown technical issue on our end.',
                actionPrimary: 'Close',
            },
        },
        accountTypeDecisionBootomSheet: {
            title: 'Add <coin></coin> account',
            description:
                '<type></type> is the default address type. <moreLink>Learn more</moreLink>',
            buttons: {
                select: 'Change account type',
                confirm: 'Continue with <type></type>',
            },
        },
        selectAccountTypeScreen: {
            title: 'Select <symbol></symbol> account type',
            accountTypes: {
                normal: {
                    title: 'SegWit',
                    subtitle: 'BIP84, P2WPKH, Bech32',
                    desc: '<li>Reduces transaction size, boosts capacity, and enhances scalability</li><li>Enables lower transaction fees</li><li>May not work with some older services.</li>',
                },
                taproot: {
                    title: 'Taproot',
                    subtitle: 'BIP86, P2TR, Bech32m',
                    desc: '<li>Enhances privacy and network efficiency</li><li>Allows more complex spending conditions privately on the blockchain</li><li>May not be supported by all services</li>',
                },
                segwit: {
                    title: 'Legacy SegWit ',
                    subtitle: 'BIP49, P2SH-P2WPKH, Base58',
                    desc: '<li>Enhances privacy and network efficiency</li><li>Allows more complex spending conditions privately on the blockchain</li><li>May not be supported by all services</li>',
                },
                legacy: {
                    title: 'Legacy',
                    subtitle: 'BIP44, P2PKH, Base58',
                    desc: '<li>Uses simpler transaction formats</li><li>May result in higher transaction fees</li><li>Lacks the efficiency and features found in newer address types</li>',
                },
            },
            aboutTypesLabel: 'Curious about different address types?',
            buttons: {
                more: 'Learn more',
                confirm: 'Continue with <type></type>',
            },
        },
    },
    moduleConnectDevice: {
        connectAndUnlockScreen: {
            title: 'Connect & unlock\nyour Trezor',
        },
        pinScreen: {
            form: {
                title: 'Enter PIN',
                entered: 'Entered',
                digits: 'digits',
                keypadInfo: 'Follow the keypad layout on your Trezor',
                enterPin: 'Enter pin',
                submitting: 'Verifying your PIN',
            },
            wrongPinAlert: {
                title: 'Incorrect PIN',
                description: 'Enter up to 50 digits.',
                button: { tryAgain: 'Try again', help: 'Enter PIN Help' },
            },
        },
        connectingDeviceScreen: {
            title: 'Connecting',
            hodlOn: 'Hodl on tight',
        },
        helpModal: {
            connect: {
                title: 'Connect my Trezor',
                subtitle: "Don't see your Trezor?",
                stepsTitle: 'Try these steps',
                step1: '1. Reconnect your Trezor',
                step2: '2. Use a different USB data cable',
                step3: '3. Use a different mobile device',
                step4: '4. Enable connection for Trezor Suite Lite via phone system message',
            },
            pinMatrix: {
                title: 'Enter PIN',
                subtitle: 'on your mobile display',
                content:
                    'Follow the keypad layout on your Trezor device to enter your PIN on your mobile display. Your PIN will be hidden on your mobile display for your security. <link>Learn more here</link>.',
            },
        },
    },
    moduleDevice: {
        IncompatibleDeviceModalAppendix: {
            title: 'Follow these steps',
            lines: {
                1: '1. Connect Trezor to Desktop Suite',
                2: '2. Navigate to Settings menu',
                3: { update: '3. Install update', setUp: '3. Set up your Trezor' },
            },
        },
        noSeedModal: {
            title: 'The connected Trezor device needs to be set up',
            description:
                'To continue using your Trezor with this app, set it up with Trezor Suite for desktop or web.',
        },
        unacquiredDeviceModal: {
            title: 'Connected Trezor is used by another application.',
            description: "Trezor can't be used by multiple applications.",
            button: 'Use Trezor here',
            appendix: {
                bullet1: `Close the other running applications that might be using your Trezor.`,
                bullet2: `Reconnect your Trezor`,
            },
        },
        unsupportedFirmwareModal: {
            title: 'The connected Trezor device needs an update',
            description:
                'To continue using your Trezor with this app, update it with Trezor Suite for desktop or web.',
        },
        bootloaderModal: {
            title: 'The connected Trezor device is in bootloader mode',
            description: 'To continue using your Trezor with this app, exit bootloader mode.',
            appendix: {
                exit: {
                    title: 'Exit bootloader mode',
                    lines: {
                        1: '1. Disconnect your Trezor',
                        2: '2. Reconnect your Trezor to your mobile device',
                    },
                },
                continue: {
                    title: 'Continue in bootloader mode',
                    lines: {
                        1: '1. Disconnect your Trezor',
                        2: '2. Connect your Trezor to Trezor Suite for desktop or web',
                        3: '3. Enter bootloader mode',
                    },
                },
            },
        },
    },
    moduleReceive: {
        screenTitle: '{coinSymbol} Receive address',
        accountNotFound: 'Account {accountKey} not found.',
        receiveAddressCard: {
            alert: {
                success: 'Receive address has been confirmed on your Trezor.',
                longCardanoAddress:
                    'Cardano (ADA) address exceeds Trezor device’s screen. Scroll here and on the device to view it and confirm.',
                ethereumToken: 'Your receive address is your Ethereum address',
            },
            unverifiedWarning: {
                title: 'receive address',
                content:
                    'For an extra layer of security, use Trezor Suite with your Trezor hardware wallet to verify the receive address',
            },
            deviceHint: {
                description: 'This receive address should match the one\non your Trezor device.',
            },
            showAddress: {
                button: 'Show full address',
                buttonTracker: 'Show address',
                learnMore: 'Learn more about verifying addresses',
            },
        },
        bottomSheets: {
            confirmOnTrezor: {
                title: 'Confirm on Trezor',
                description:
                    'Go to your device and verify that the receive address on your Trezor matches the one displayed here.',
            },
            addressMismatch: {
                title: "Address doesn't match?",
                description:
                    'The receive address shown on the app should match the one on your Trezor device.',
                remember: 'Keep in mind:',
                trustDevice:
                    "Always trust your Trezor's screen, it never lies. Your mobile may be vulnerable to hacks and security breaches.",
                contactSupport:
                    'For any security concerns about your app or device, contact Trezor Support.',
                reportIssueButton: 'Report security issue',
            },
        },
    },
    moduleSettings: {
        faq: {
            title: 'Get help',
            supportCard: {
                title: 'Need more help?',
                contact: 'Contact support',
            },
            usbEnabled: {
                0: {
                    question: 'Can I connect my Trezor to Trezor Suite Lite?',
                    answer: 'Yes, you can connect your Trezor Hardware Wallet and use limited functionality. It is designed to work as a companion to the desktop/web version of Trezor Suite, but we will gradually add more features to make it a standalone application to manage your crypto funds with Trezor Hardware Wallet.',
                },
                1: {
                    question:
                        'What is the difference between Portfolio Tracker and Connected Trezor functionality?',
                    answer: 'Portfolio Tracker helps you stay in touch with your portfolio balances without having to connect your Trezor device. Simply sync your coin addresses and you can keep track of your balances on the go. You can also combine coin addresses from multiple wallets or Trezor devices to track your whole portfolio in one place. Connected Trezor allows you to manage your funds associated with your Trezor device. You can verify receive addresses and check your balances and transactions. However, if you disconnect the Trezor, you will no longer see the data from the Trezor device.',
                },
                2: {
                    question: 'What is public key? (XPUB) or a receive address?',
                    answer: 'An XPUB is a master public key for hierarchical deterministic wallets like bitcoin, generating multiple child keys and receive addresses for improved privacy. Ethereum uses a single, unchanging address for all transactions. For Ethereum, share only your address, while keeping your private key secure.',
                },
                3: {
                    question: 'My Trezor device can’t connect',
                    answer: {
                        0: 'Reconnect your Trezor',
                        1: 'Use a different USB data cable',
                        2: 'Use a different mobile device',
                        3: 'Confirm connection via mobile device system message',
                    },
                },
                4: {
                    question: 'What version of Trezor device Firmware Trezor Suite Lite supports?',
                    answer: {
                        0: 'Trezor One: from version 1.12.1',
                        1: 'Trezor T: from version 2.6.3',
                        2: 'Trezor Safe 3: from version 2.6.3',
                    },
                },
                5: {
                    question: 'Why don’t I see my coin listed?',
                    answer: 'Trezor Suite Lite currently supports a limited number of cryptocurrencies. If your coin is not listed, it may not be compatible with the app. However, Trezor regularly adds support for new coins, so check back periodically to see which coins have been added.',
                },
                6: {
                    question: 'What does the graph display?',
                    answer: 'The graph in Trezor Suite Lite displays the price history of your portfolio’s synced assets over specified time period. You can adjust the time period by selecting a different range on the bottom of the graph.',
                },
                7: {
                    question: 'Are my data safe?',
                    answer: 'Yes, the mobile app does not store any private keys or sensitive information on your mobile device. This means that even if your phone is lost or stolen, your cryptocurrency assets are still safe and protected.',
                },
            },
            usbDisabled: {
                0: {
                    question: 'What is public key? (XPUB) or a receive address?',
                    answer: 'An XPUB is a master public key for hierarchical deterministic wallets like bitcoin, generating multiple child keys and receive addresses for improved privacy. Ethereum uses a single, unchanging address for all transactions. For Ethereum, share only your address, while keeping your private key secure.',
                },
                1: {
                    question: 'Can I connect my Trezor to Trezor Suite Lite?',
                    answer: 'No, it is not possible. It is designed to work as a companion to the desktop/web version of Trezor Suite as a way to keep up with your Trezor portfolio on the go.',
                },
                2: {
                    question: 'How do I send crypto in Trezor Suite Lite?',
                    answer: 'Trezor Suite Lite is a watch-only portfolio tracker, which means it is designed to help you monitor your cryptocurrency holdings and transactions. Unfortunately, it is not currently possible to send crypto using Trezor Suite Lite. To send crypto, use the full version of Trezor Suite with your Trezor hardware wallet. This will provide you with the necessary security and functionality to manage and perform transactions with your cryptocurrencies.',
                },
                3: {
                    question: 'Why don’t I see my coin listed?',
                    answer: 'Trezor Suite Lite currently supports a limited number of cryptocurrencies. If your coin is not listed, it may not be compatible with the app. However, Trezor regularly adds support for new coins, so check back periodically to see which coins have been added.',
                },
                4: {
                    question: 'What does the graph display?',
                    answer: 'The graph in Trezor Suite Lite displays the price history of your portfolio’s synced assets over specified time period. You can adjust the time period by selecting a different range on the bottom of the graph.',
                },
                5: {
                    question:
                        'Why is the balance displayed in Trezor Suite different from the balance displayed in Trezor Suite Lite?',
                    answer: 'Balances may mismatch due to improper syncing of all assets and account types, or pending transactions. Ensure you have synced all your assets correctly and check for any pending transactions to resolve the discrepancy.',
                },
                6: {
                    question: 'Are my data safe?',
                    answer: 'Yes, the mobile app does not store any private keys or sensitive information on your mobile device. This means that even if your phone is lost or stolen, your cryptocurrency assets are still safe and protected.',
                },
            },
        },
        localizations: {
            title: 'Localization',
        },
        customization: {
            title: 'Customization',
        },
        aboutUs: {
            title: 'About Trezor Suite Lite',
        },
        privacyAndSecurity: {
            title: 'Privacy & Security',
        },
    },
    moduleOnboarding: {
        welcomeScreen: {
            welcome: 'Welcome to ',
            subtitle: 'Securely track, manage & receive crypto on the go ',
            trezorLink: 'Don’t have a Trezor? <trezorLink>Get one here.</trezorLink>',

            nextButton: 'Get started',
        },
        connectTrezorScreen: {
            title: 'Connect',
            subtitle:
                'Manage your portfolio with your Trezor hardware wallet connected directly to your mobile device.',
        },
        featureReceiveScreen: {
            portfolioTracker: {
                title: 'Receive coins',
                subtitle: 'Generate addresses and QR codes to receive crypto on the go.',
            },
            device: {
                title: 'Receive',
                subtitle:
                    'Generate and verify addresses directly on your Trezor to get paid and receive crypto on the go.',
            },
        },
        trackBalancesScreen: {
            portfolioTracker: {
                title: 'Track balances',
                subtitle:
                    'Easily sync your coin addresses and keep up with the crypto on your hardware wallet.',
            },
            device: {
                title: 'Track balances',
                subtitle:
                    'Keep up with your favorite coins even without your Trezor connected. Simply sync and track your crypto from anywhere.',
            },
        },
        analyticsConsentScreen: {
            title: 'Better with you',
            subtitle: 'Improve Trezor Suite Lite with your anonymous data.',
            bulletPoints: {
                privacy: {
                    title: 'Your data is private',
                    description:
                        "We don't gather sensitive personal data like balances, transactions, or profile details.",
                },
                dataCollection: {
                    title: 'What we collect',
                    description:
                        'We collect data on app performance, user interaction, and potential technical issues to enhance the user experience.',
                },
            },
            helpSwitchTitle: 'Help us anonymously',
            learnMore: '<securityLink>More</securityLink> about privacy',
        },
    },
    moduleAccountManagement: {
        accountSettingsScreen: {
            xpubBottomSheet: {
                xpub: {
                    title: 'Public key (XPUB)',
                    showButton: 'Show public key (XPUB)',
                    copyMessage: 'XPUB copied',
                },
                address: {
                    title: 'Receive address',
                    showButton: 'Show receive address',
                    copyMessage: 'Public address copied',
                },
                copyButton: 'Copy',
            },
        },
    },
    moduleAccounts: {
        accountDetail: {
            accountLabelBadge: 'Run on {accountLabel}',
        },
        emptyState: {
            title: 'No assets',
            subtitle: 'Connect your Trezor or sync coins to view and track assets.',
            receiveSubtitle: 'Connect your Trezor or sync coins to view and receive assets.',
            searchAgain: 'Search again',
        },
    },
    transactions: {
        title: 'Transactions',
        receive: 'Receive',
        phishing: {
            badge: 'Caution!',
            warning:
                "Caution! This transaction may be a scam. If you’re unsure, don't engage. <blogLink>Read more</blogLink>",
        },
        emptyState: {
            title: 'No transactions',
            subtitle: 'Get started by receiving coins',
            button: 'Receive',
        },
    },
    deviceManager: {
        deviceButtons: {
            eject: 'Eject',
            deviceInfo: 'Device info',
            addHiddenWallet: 'Add hidden wallet',
        },
        deviceList: {
            sectionTitle: 'Open',
        },
        connectDevice: {
            sectionTitle: 'Connect Trezor device',
            connectButton: 'Connect',
        },
        portfolioTracker: {
            explore: 'Explore Trezor',
            learnBasics: 'Learn the basics',
            exploreShop: 'Explore Trezor Shop',
        },
        status: {
            portfolioTracker: 'Sync & track coins',
            connected: 'Connected',
        },
        syncCoinsButton: {
            syncMyCoins: 'Sync my coins',
            syncAnother: 'Sync another coin',
        },
        defaultHeader: 'Hi there!',
    },
    deviceInfo: {
        installedFw: 'Installed firmware: {version}',
        upToDateFw: 'The firmware is up to date.',
        outdatedFw: 'The firmware is outdated.',
        goToAccessories: 'Get swag for your device @ Trezor Shop',
        updateHowTo: {
            title: 'How to update firmware',
            subtitle: 'Follow these steps:',
            lines: {
                1: '1. Connect Trezor to Desktop Suite',
                2: '2. Navigate to Settings menu',
                3: '3. Install new firmware',
            },
            button: 'Learn more @ Trezor.io',
        },
    },
    qrCode: {
        addressCopied: 'Address copied',
        copyButton: 'Copy',
        shareButton: 'Share',
    },
    graph: {
        retrievingData: 'Retrieving data...',
        retrievengTakesLongerThanExpected:
            'Retrieving balances takes longer than usual. \n It may be caused by unstable internet connection.',
    },
    passphrase: {
        modal: {
            enterWallet: 'Enter passphrase',
        },
    },
};

export type Translations = typeof en;
