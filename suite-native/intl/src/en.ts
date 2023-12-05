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
                faceId: 'Enable FaceID',
                fingerprint: 'Enable fingerprint',
                touchId: 'Enable TouchID',
                unknown: 'Enable biometrics',
            },
            description: 'Use biometricts verification \nto unlock the app.',
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
                description: 'This receive address should match the one on your Trezor device.',
            },
            showAddress: {
                button: 'Show address',
                learnMore: 'Learn more about verifying addresses',
            },
        },
        bottomSheets: {
            verificationWalkthrough: {
                title: {
                    step1: 'How to verify address',
                    step2: 'Why verify on your Trezor',
                },
                description: {
                    step1: 'Confirm that the address on your Trezor device matches the one on your mobile device.',
                    step2: 'Your Trezor never lies. Mobile devices are vulnerable to hacks and malicious apps.',
                },
                dontShowAgainButton: 'Don’t show again and continue',
            },
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
            noUsb: {
                title: 'Receive coins',
                subtitle: 'Generate addresses and QR codes to receive crypto on the go.',
            },
            usb: {
                title: 'Receive',
                subtitle:
                    'Generate and verify addresses directly on your Trezor to get paid and receive crypto on the go.',
            },
        },
        trackBalancesScreen: {
            noUsb: {
                title: 'Track balances',
                subtitle:
                    'Easily sync your coin addresses and keep up with the crypto on your hardware wallet.',
            },
            usb: {
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
            learnMore: '<securityLink>More</securityLink> about security',
        },
    },
    moduleAccounts: {
        accountDetail: {
            accountLabelBadge: 'Run on {accountLabel}',
        },
    },
    transactions: {
        phishing: {
            badge: 'Caution!',
            warning:
                "Caution! This transaction may be a scam. If you’re unsure, don't engage. <blogLink>Read more</blogLink>",
        },
    },
    deviceManager: {
        deviceButtons: {
            eject: 'Eject',
            deviceInfo: 'Device info',
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
    },
};

export type Translations = typeof en;
