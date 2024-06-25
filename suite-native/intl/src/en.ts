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
            cancel: 'Cancel',
        },
        unknownError: 'Something went wrong',
        default: 'Default',
        orSeparator: 'OR',
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
        emptyState: {
            device: {
                title: 'Your wallet is empty',
                subtitle: 'Start by receiving some assets.',
                button: 'Receive assets',
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
                    title: 'Connect & unlock my Trezor',
                    description: 'Manage your coins with your Trezor connected.',
                    connectButton: 'Connect & unlock',
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
            title: 'Enable biometrics protection',
            description: 'You can always change this later.',
            button: {
                later: 'I’ll do that later in Settings',
                enable: 'Enable',
            },
            resultMsg: {
                error: 'Unable to enable biometrics',
                success: 'Biometrics enabled',
            },
        },
        rememberModeModal: {
            title: 'Enable view-only to check balances after you disconnect your Trezor',
            description: 'To verify receive addresses, simply reconnect your device.',
            button: {
                skip: 'Skip',
                enable: 'Enable',
            },
        },
    },
    assets: {
        dashboard: {
            discoveryProgress: { loading: 'Loading...', stillWorking: 'Retrieving balances' },
        },
    },
    biometricsButton: 'Unlock with biometrics',
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
            title: 'Enter PIN\non your Trezor',
            form: {
                title: 'Enter PIN',
                entered: 'Entered',
                digits: 'digits',
                keypadInfo: 'Follow the keypad layout on your Trezor',
                enterPin: 'Unlock',
                submitting: 'Verifying your PIN',
            },
            wrongPinAlert: {
                title: 'Incorrect PIN',
                description:
                    'You have 16 PIN entry attemps.\nFailing all of them will result in your device being erased.',
                button: { tryAgain: 'Try again', help: 'Enter PIN help' },
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
        pinCanceledDuringDiscovery: {
            title: 'Some of your balances have not been loaded.',
            subtitle: 'You need to unlock your device in order to finish loading your balances',
            button: 'Enter PIN again',
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
        genericErrorModal: {
            title: 'Please reconnect your Trezor device.',
            description:
                'Unfortunately, we’ve encountered an unexpected error. If the problem persists, please reach out to our support.',
            buttons: {
                reconnect: 'Reconnect device',
                help: 'Contact support',
            },
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
        deviceCancelError: 'Address confirmation canceled.',
        receiveAddressCard: {
            alert: {
                success: 'Receive address has been confirmed on your Trezor.',
                longCardanoAddress:
                    'Cardano (ADA) address exceeds Trezor device’s screen. Scroll here and on the device to view it and confirm.',
                ethereumToken: 'Your receive address is your Ethereum address',
            },
            unverifiedWarning: {
                portfolioTracker: {
                    title: 'receive address',
                    subtitle:
                        'For an extra layer of security, use Trezor Suite with your Trezor hardware wallet to verify the receive address',
                },
                viewOnly: {
                    title: 'Address can’t be verified without connected Trezor',
                    subtitle:
                        'For an extra layer of security, connect your Trezor to verify the receiving address',
                },
            },
            viewOnlyWarning: {
                title: 'Receive address can’t be verified',
                description: 'To confirm address, connect your Trezor',
                primaryButton: 'Continue without verifying',
                secondaryButton: 'Back',
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
                        3: 'Enable connection for Trezor Suite Lite via phone system message',
                    },
                },
                4: {
                    question: 'What version of Trezor device Firmware Trezor Suite Lite supports?',
                    answer: {
                        0: 'Trezor One: from version 1.12.1',
                        1: 'Trezor T: from version 2.6.3',
                        2: 'Trezor Safe 3: from version 2.6.3',
                        3: 'Trezor Safe 5: from version 2.7.2',
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
                    question: 'What is View-only?',
                    answer: 'Even when your Trezor device is disconnected, you can still keep track of your balances with the View-Only. This feature provides peace of mind by allowing you to monitor your funds without compromising security. Plus no more waiting for retrieving all the assets and balances while connecting your Trezor device.',
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
        viewOnly: {
            title: 'View-only',
            emptyTitle: 'Connect your device to enable view-only',
            subtitle:
                'Check balances without connecting your Trezor. <about>See how it works</about>',
            button: { enable: 'Enable', disable: 'Disable' },
            about: {
                title: 'View-only',
                subtitle: 'Stay on top of your balances without connecting your Trezor.',
                contentTitle: 'How it works',
                content:
                    '<li>Enable view-only to keep balances visible when your Trezor device is disconnected.</li><li>Your funds remain secure.</li><li>Your data remains private.</li><li>Stay updated on all transactions.</li><li>Create a new receive address.</li><li>To verify your receive address, simply reconnect your device.</li><li>Save time when assets are loading.</li>',
                button: 'Got it',
            },
            toast: {
                disabled: 'View-only disabled',
                enabled: 'View-only enabled',
            },
            disableDialog: {
                title: 'Disable view-only access to {name}?',
                subtitle: 'You can always enable view-only again when you reconnect {device}. ',
                buttons: {
                    primary: 'Disable',
                    secondary: 'Back',
                },
            },
            connected: 'Connected',
            disconnected: 'Disconnected',
            wallet: {
                standard: 'Standard wallet',
                defaultPassphrase: 'Passphrase wallet #{index}',
            },
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
        viewOnlyAddAccountAlert: {
            title: 'To add new coin or account, reconnect your Trezor device.',
            description:
                'We’re unable to add any new coins or accounts to your device when it’s disconnected.',
            actionPrimary: 'Got it',
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
            deviceInfo: 'Device info',
            addHiddenWallet: 'Open passphrase',
            devices: 'Change',
        },
        connectButton: {
            another: 'Connect another device',
            first: 'Connect your device',
        },
        portfolioTracker: {
            explore: 'Explore Trezor',
            learnBasics: 'Learn the basics',
            exploreShop: 'Explore Trezor Shop',
        },
        status: {
            portfolioTracker: 'Track your coins without Trezor',
            connected: 'Connected',
            disconnected: 'Disconnected',
        },
        syncCoinsButton: {
            syncMyCoins: 'Sync my coins',
            syncAnother: 'Sync another coin',
        },
        defaultHeader: 'Hi there!',
        wallet: {
            standard: 'Standard wallet',
            portfolio: 'Portfolio tracker',
            defaultPassphrase: 'Passphrase wallet #{index}',
        },
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
        errorMessage: 'There are some troubles with loading graph: ',
        tryAgain: 'Try again',
        retrievengTakesLongerThanExpected:
            'Retrieving balances takes longer than usual. \n It may be caused by unstable internet connection.',
    },
    modulePassphrase: {
        title: 'Passphrase',
        subtitle:
            'Entering a <bold>passphrase opens a distinct wallet</bold> secured by that specific phrase.',
        alertCard: {
            paragraphWarning1:
                'It’s essential to understand how a passphrase works before using it.',
            paragraphWarning2:
                'Keep your passphrase elsewhere than your recovery seed & Trezor device.',
            paragraphWarning3: 'No one can recover it, not even Trezor support.',
            button: 'How passphrase works',
        },
        form: {
            enterWallet: 'Enter passphrase',
            createWalletInputLabel: 'Enter your passphrase',
            verifyPassphraseInputLabel: 'Re-enter your passphrase',
            separatorTitle: 'OR',
        },
        enterPassphraseOnTrezor: {
            button: 'Enter passphrase on Trezor',
            title: 'Continue on Trezor',
            subtitle: 'Enter your passphrase on your Trezor',
        },
        loading: {
            title: 'Checking passphrase wallet for balances & transactions',
            subtitle: 'This might take up to a minute.',
        },
        confirmOnDevice: {
            title: 'Confirm passphrase\non your Trezor.',
            description: 'Go to your device and confirm the passphrase you’ve entered.',
            warningSheet: {
                title: 'Are you sure you would like to cancel opening a passphrase wallet?',
                primaryButton: 'Cancel',
                secondaryButton: 'Continue opening',
            },
        },
        emptyPassphraseWallet: {
            title: 'This passphrase wallet is empty',
            confirmCard: {
                description:
                    "This wallet is empty and hasn't been used before. Do you want to open it?",
                button: 'Yes, open',
            },
            expectingPassphraseWallet: {
                title: 'Expecting a passphrase wallet with funds?',
                description: "It's possible there was a typo. Try again and enter your passphrase.",
                button: 'Try again',
            },
            confirmEmptyWalletSheet: {
                title: 'Passphrase best practices',
                list: {
                    backup: 'Write it down on paper & keep it away from anything digital (no cloud, USB, internet, phone).',
                    store: 'Store it in a secure location, separate from both your wallet backup and Trezor device.',
                    neverShare: 'Never share it with anyone, not even with Trezor Support.',
                },
                button: 'Got it',
                alertTitle: 'No one can recover your passphrase, not even Trezor support',
            },
            verifyEmptyWallet: {
                title: 'Confirm empty passphrase wallet',
                description: 'Re-enter your passphrase to open this wallet.',
                alertTitle:
                    '<bold>Write down your passphrase on paper, nothing digital. It’s impossible to recover</bold>— not even Trezor Support can help.',
                passphraseMismatchAlert: {
                    title: 'Passphrase mismatch',
                    description: 'Start over and enter your passphrase again.',
                    primaryButton: 'Start over',
                    secondaryButton: 'Cancel',
                },
            },
        },
        passphraseMismatch: {
            title: 'Passphrase duplicate',
            subtitle: 'You’re trying to enter a passphrase wallet that’s already been opened.',
            button: 'Proceed to passphrase wallet ',
        },
        enablePassphrase: {
            title: 'Enable passphrase on your Trezor.',
            subtitle: 'Go to your device and confirm you’d like to enable passphase.',
            cancelledError: 'Passphrase enabling cancelled.',
        },
    },
};

export type Translations = typeof en;
