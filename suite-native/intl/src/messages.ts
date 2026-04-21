// Few rules:
// 1. Never use dynamic keys IDs for example: translate(`module.graph.coin.${symbol}`) instead map it to static key: { btc: translate('module.graph.coin.btc') }
// 2. Don't split string because of formatting or nested components use Rich Text Formatting instead https://formatjs.io/docs/react-intl/components#rich-text-formatting
// 3. Always wrap keys per module/screen/feature for example: module.graph.legend

export const messages = {
    generic: {
        trezorSuite: 'Trezor Suite',
        buttons: {
            back: 'Back',
            cancel: 'Cancel',
            close: 'Close',
            confirm: 'Confirm',
            confirmSelection: 'Confirm selection',
            continue: 'Continue',
            done: 'Done',
            disable: 'Disable',
            dismiss: 'Dismiss',
            eject: 'Eject',
            enable: 'Enable',
            gotIt: 'Got it',
            next: 'Next',
            tryAgain: 'Try again',
            edit: 'Edit',
            yes: 'Yes',
            learnMore: 'Learn more',
            copy: 'Copy',
            understand: 'I understand',
            goBack: 'Go back',
        },
        validateForm: 'Validate form',
        savedToClipboard: 'Saved to clipboard',
        unknown: 'Unknown',
        unknownError: 'Something went wrong',
        default: 'Default',
        orSeparator: 'or',
        banners: {
            offline: {
                title: "You're offline.",
                fwRevisionCheckOfflineError:
                    "Firmware authenticity check couldn't be performed.\nGo online to verify your firmware version.",
            },
            deviceDanger: {
                compromised: {
                    title: 'Unofficial firmware detected',
                    subtitle:
                        'Your Trezor may be counterfeit. To ensure your safety, receiving funds has been disabled. Contact Trezor Support immediately.',
                    cta: 'Contact Trezor Support',
                },
                revisionNotChecked: {
                    title: "Couldn't perform firmware authenticity check.",
                },
                backupFailed: {
                    title: 'Wallet backup failed',
                    subtitle: 'Wipe your Trezor, then create a wallet backup.',
                    cta: 'Wipe device & create backup',
                },
                backupNeeded: {
                    title: 'You need a wallet backup',
                    subtitle:
                        'A wallet backup is essential for recovering your assets. Don’t send or receive funds with this device until you’ve created a backup.',
                    cta: 'Create wallet backup',
                },
            },
            outOfSuiteSyncQuota: {
                title: 'Suite Sync storage is full',
                subtitle:
                    'New labels will be saved locally on this phone, but not synced to your other devices.',
                cta: 'Contact support',
                dismiss: 'Dismiss',
            },
        },
        tokens: '+ Tokens',
        warning: 'Warning',
    },
    icons: {
        networkIconHint: 'Network Icon',
        cryptoIconHint: 'Crypto Icon',
    },
    messageSystem: {
        killswitch: {
            title: 'Update required',
            content: 'Update to continue using Trezor Suite. Your funds are secure.',
            cta: 'Download latest version',
        },
    },
    suiteSync: {
        label: 'Label',
        addLabel: 'Add label',
        disableAlert: {
            title: 'Turn off Suite Sync?',
            description:
                'Turning off Suite Sync disables labeling. Your labels will stay safely encrypted, but they won’t be visible until you turn Suite Sync back on.',
            cta: 'Turn off',
        },
        enableAlert: {
            title: 'Turn on Suite Sync to use labels',
            description:
                'Suite Sync keeps your data up to date on all your devices. Your data stays local and syncs only with devices you approve.',
            cta: 'Turn on',
        },
        firmwareUpdateAlert: {
            title: 'Firmware update required',
            description: 'Update firmware on the device to use Suite Sync.',
            primaryButtonTitle: 'Update',
            secondaryButtonTitle: 'Not now',
        },
        errors: {
            deviceCancelled: 'Activation was canceled on the device.',
            deviceError: 'Device communication failed.',
            suiteSyncUpdateError: 'Failed to update data.',
            suiteSyncUnavailable: 'Suite Sync unavailable on this device.',
        },
    },
    moduleHome: {
        graphIgnoredNetworks:
            "{networksString} and all related tokens are included in your portfolio balance, but aren't currently supported in the graph.",
        emptyState: {
            emptyDevice: {
                title: 'Your wallet is empty',
                subtitle: 'Start by receiving some assets.',
                button: 'Receive assets',
            },
            uninitializedDevice: {
                title: 'Your Trezor is ready to set up',
                subtitle: 'You can do this anytime.',
                button: 'Start setup',
            },
            portfolioTracker: {
                title: 'Get started',
                subtitle: 'Sync your coin addresses and view your portfolio balance.',
                primaryButton: 'Sync & Track',
                secondaryButton: 'Settings',
                alert: 'This requires access to Trezor Suite coin addresses.',
            },
            connectTrezor: {
                title: {
                    ios: 'Connect your Trezor Safe 7',
                    android: 'Connect your Trezor',
                },
                description: 'Manage your assets with your Trezor connected.',
                connectButton: 'Connect',
            },
            syncCoins: {
                title: 'Track your coins',
                description: 'Sync your favorite assets and track balances with portfolio tracker.',
                syncButton: 'Sync & Track',
            },
            demoAccountQuestionnaire: {
                title: "Don't have a Trezor yet?",
                description: 'Help us shape a better experience for you.',
                button: "I don't have a Trezor",
            },
        },
        buttons: {
            receive: 'Receive',
            send: 'Send',
            referral: 'Earn $20 per referral',
        },
        rememberModeModal: {
            title: 'Enable view-only to check balances after you disconnect your Trezor',
            description:
                'To verify receive addresses or sign transactions, simply reconnect your device.',
            button: {
                skip: 'Skip',
                enable: 'Enable',
            },
        },
        firmwareUpdateAlert: {
            title: 'New firmware is available.',
            version: 'Version {version}',
            button: {
                close: 'Close',
                update: 'Update',
            },
        },
        suiteSyncAlert: {
            title: 'Allow Suite Sync',
            description:
                'Allow Suite Sync to view and edit your labels, wallet names, and account names.',
            button: 'Allow',
            connectDescription:
                'Connect Trezor and allow Suite Sync to view and edit your labels, wallet names, and account names.',
            connectButton: 'Connect & allow',
        },
        suiteSyncFirmwareUpdateAlert: {
            title: 'Firmware update required',
            description: 'Update firmware on the device to use Suite Sync.',
            button: 'Update',
        },
    },
    accounts: {
        accountLabelFieldHint: {
            letterCount: '{current} / {max} letters',
        },
        searchForm: {
            placeholder: 'Search assets',
        },
    },
    accountList: {
        numberOfTokens: '+{numberOfTokens, plural, one{1 Token} other{# Tokens}}',
        tokens: 'Tokens',
        staking: 'Staking',
        rewardsReduced: 'Rewards reduced',
        stakingDisabled: "Staking isn't available in this context.",
    },
    assets: {
        dashboard: {
            discoveryProgress: {
                loading: 'Loading...',
                stillWorking: 'Retrieving balances',
            },
        },
        rediscoveryNeeded: 'Reconnect your Trezor to load all assets.',
    },
    biometricsButton: 'Unlock with biometrics',
    bluetooth: {
        alerts: {
            permissionDenied: {
                title: 'Bluetooth permission needed',
                description:
                    'Trezor Suite needs permission to find and connect to nearby Trezor devices via Bluetooth.',
                primaryButton: 'Request permission',
            },
            permissionBlocked: {
                title: 'Bluetooth permission blocked',
                description:
                    'Trezor Suite needs permission to find and connect to nearby Trezor devices via Bluetooth.',
                primaryButton: 'Open system settings',
            },
            adapterDisabled: {
                title: 'Turn on Bluetooth',
                description: {
                    android:
                        'Bluetooth is currently turned off on this phone. Go to phone settings and turn on Bluetooth.',
                    ios: 'Bluetooth is currently turned off on this phone. Go to Control Center and turn on Bluetooth.',
                },
                primaryButton: 'Open system settings',
            },
            locationServicesDisabled: {
                title: 'Enable Location Services',
                description:
                    'Location Services are currently disabled on this phone. Go to phone settings and enable them.',
                primaryButton: 'Open system settings',
            },
            pairingFailed: {
                title: 'Bluetooth pairing failed',
                description:
                    'The Trezor you’re trying to connect may still be remembered in your phone’s Bluetooth settings. Remove it and try again.',
                primaryButton: 'Open system settings',
                secondaryButton: 'Device removed',
            },
            systemUnpairing: {
                title: {
                    android: 'Remove Trezor from system settings',
                    ios: 'Remove Trezor from Bluetooth settings',
                },
                description: {
                    android:
                        'To unpair fully, make sure you remove your Trezor from your phone’s Bluetooth settings. If not, you might have trouble pairing it again in the future.',
                    ios: 'If not, you might have trouble pairing it again in the future.',
                },
                primaryButton: 'Open system settings',
                secondaryButton: 'Device removed',
            },
            unpairingInstructions: {
                step1: 'Go to Settings > Bluetooth',
                step2: 'Find Trezor and tap on ⓘ',
                step3: 'Tap “Forget this device”',
            },
            pairingInstructions: {
                step1: 'Go to Settings > Bluetooth',
                step2: 'Find your Trezor and tap on ⓘ',
                step3: 'Tap “Forget device”',
            },
        },
        toasts: {
            pairingCanceled: 'Bluetooth pairing canceled.',
        },
        deviceList: {
            connect: {
                title: 'Connect your Trezor',
                subtitle: 'Choose the Trezor that you want to connect.',
            },
            remove: {
                title: 'Pair your Trezor again',
                subtitle:
                    "If your Trezor isn't visible in your phone’s Bluetooth settings, try pairing it again.",
            },
        },
        deviceCard: {
            connect: {
                actionButton: 'Connect',
                pairingHint: 'Confirm the Bluetooth pairing request on your Trezor as well.',
            },
            remove: {
                actionButton: 'Pair again',
            },
            unknownColor: 'Unknown',
        },
    },
    moduleAccountImport: {
        title: 'Sync my coins',
        error: {
            unsupportedNetworkType: 'Unsupported account network type.',
        },
        summaryScreen: {
            title: {
                confirmToAdd: 'Confirm to add coin',
                alreadySynced: 'Coin already synced',
            },
            subtitle: "Here's what you have in your account.",
            tokens: 'Tokens:',
            syncAnotherCoinButton: 'Sync another coin',
            coinLabel: 'Coin label',
        },
        coinList: {
            mainnets: 'Select a coin to sync',
            testnets: 'Testnet coins (have no value – for testing purposes only)',
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
                    address: "Address isn't valid",
                },
            },
            scanButton: {
                xpub: 'Scan public key (XPUB)',
                address: 'Scan receive address',
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
        },
        accountImportLoaderScreen: {
            loaderState: {
                balances: 'Retrieving Balances',
                assets: 'Confirming assets',
                transactions: 'Checking transactions',
            },
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
            },
            generalError: {
                title: 'We couldn’t add your account.',
                description: 'There’s been an unknown technical issue on our end.',
                actionPrimary: 'Close',
            },
        },
        accountTypeDecisionBottomSheet: {
            title: 'Add <coin></coin> account',
            description:
                '<type></type> is the default address type. <moreLink>Learn more</moreLink>',
            buttons: {
                select: 'Change address type',
                confirm: 'Continue with <type></type>',
            },
        },
        coinDiscoveryRunningScreen: {
            title: 'Checking {coin} for balances & transactions.',
            subtitle: 'This should take just a moment.',
        },
        coinDiscoveryFinishedScreen: {
            title: {
                singular: 'We’ve found {count} {coin} account',
                plural: 'We’ve found {count} {coin} accounts',
            },
            orSeparator: 'OR',
            addButton: 'Add new',
            addNewButton: 'Add new',
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
    thp: {
        pairingInfo: {
            title: 'Create secure connection',
            subtitle: 'Trezor Suite will create a secure connection to your Trezor',
            help: {
                title: 'What is a secure connection?',
                description:
                    'A secure connection is a protected link that ensures safe communication between Trezor Suite and your device, using a one-time security code to prevent unauthorized access.',
            },
        },
        codeEntry: {
            title: 'Enter one-time security code',
            subtitle: 'Check your Trezor for the code.',
            invalidCode: {
                title: 'Incorrect security code',
                description: 'Try again with a new code.',
                getNewCodeButton: 'Get a new code',
            },
        },
        autoconnect: {
            title: 'Connect to your Trezor faster with auto-connect',
            description:
                'Use this phone regularly with your Trezor? Let Trezor Suite connect automatically—no need to approve it each time.',
            turnOnButton: 'Turn on auto-connect',
            noThanksButton: 'Not now',
        },
        pairingSuccess: {
            title: 'Secure connection created',
        },
    },
    moduleCheckBackup: {
        checkBackupTutorialScreen: {
            step1: {
                callout: 'Let’s check your backup',
                title: 'This check will ensure your backup is valid',
                description:
                    'A valid backup is necessary to recover a lost, stolen, or damaged Trezor.',
            },
            step2: {
                callout: 'To get started',
                title: 'Get your wallet backup',
                description:
                    'Wallet backup is a list of words you wrote down when you first set up your hardware wallet.',
                checkButton: 'Check my backup',
                noBackupButton: "I can't find my backup",
            },
        },
        checkBackupScreen: {
            title: 'Enter your wallet backup on your Trezor',
        },
        checkBackupSuccessScreen: {
            title: 'Your backup is valid',
        },
        checkBackupRecapScreen: {
            callout: 'Store your wallet backup safely',
            title: 'Make sure to return your wallet backup to a secure, private place',
            description: 'No one can recover your backup if you lose it—not even Trezor Support.',
        },
        checkBackupUnsupportedModelScreen: {
            title: 'To check your backup, use the web application.',
            subtitle:
                'Check backup for {deviceModel} is unfortunately not supported in the mobile app.',
            redirectButton: 'Continue to Trezor Suite Web',
            laterButton: 'I’ll do it later',
            step1: 'Go to Trezor Suite for Web using the button below.',
            step2: 'Complete check backup in your browser.',
            step3: 'Start using your Trezor with\nTrezor Suite.',
        },
        checkBackupSupportScreen: {
            title: 'Don’t worry—we’ll figure this out',
            description: 'Contact customer support to resolve this issue.',
            button: 'Contact support',
        },
        checkBackupFailScreen: {
            title: 'Your backup is invalid',
            description:
                'There’s a chance you made a typo.\nTry again or secure access to your assets.',
            supportButton: 'Secure my assets',
        },
        cancelAlert: {
            title: 'Cancel check backup?',
            description: 'Start again at anytime.',
            primaryButton: 'Yes, cancel',
            secondaryButton: 'Continue checking',
        },
    },
    moduleConnectDevice: {
        crossroads: {
            bluetooth: {
                title: 'Connect <bold>Trezor Safe 7</bold>',
                subtitle: 'via Bluetooth',
            },
            cable: {
                title: 'Connect <bold>any Trezor</bold>',
                subtitle: 'via cable',
            },
        },
        connectAndUnlockScreen: {
            title: 'Connect & unlock\nyour Trezor',
            status: 'Checking for connected Trezors',
            connectViaBluetoothButton: 'Connect via Bluetooth',
        },
        turnOnAndUnlockScreen: {
            title: 'Turn on & unlock\nyour Trezor Safe 7',
            status: {
                adapterDisabled: 'Bluetooth is turned off',
                scanning: 'Scanning for nearby Trezors',
            },
        },
        pinScreen: {
            title: 'Enter PIN\non your Trezor',
            form: {
                title: {
                    current: 'Enter current PIN',
                    new: 'Enter new PIN',
                    confirm: 'Confirm new PIN',
                },
                entered: 'Entered',
                digits: 'digits',
                keypadInfo: 'Follow the keypad layout on your Trezor',
                submitButton: 'Confirm',
                submitting: 'Verifying PIN',
                processing: 'Processing',
            },
            wrongPinAlert: {
                title: 'Incorrect PIN',
                description:
                    'You have 16 PIN attempts remaining. \nIf all attempts fail, your Trezor will be erased.',
                button: {
                    tryAgain: 'Try again',
                    help: 'Get PIN help',
                },
            },
        },
        connectingDeviceScreen: {
            title: 'Connecting',
            hodlOn: 'Hodl on tight',
        },
        helpModal: {
            connect: {
                title: 'Don’t see your Trezor?',
                hint1: 'Make sure your Trezor is unlocked',
                hint2: 'Try using a different USB cable',
                hint3: 'Connect your Trezor to a different phone or computer',
                contactSupportButton: 'Contact support',
                subtitle: 'Don’t see your Trezor?',
                stepsTitle: 'Try these steps',
                step1: '1. Reconnect your Trezor',
                step2: '2. Use a different USB data cable',
                step3: '3. Use a different mobile device',
                step4: '4. Enable connection for Trezor Suite via phone system message',
            },
            pairing: {
                hints: {
                    title: 'Your Trezor needs to be in pairing mode',
                    description: 'This window will close as soon as we detect your Trezor.',
                    stillNotWorkingButton: 'It’s still not working',
                },
                settings: {
                    title: 'Confirm that your Trezor is visible in your phone’s settings',
                    description: 'If not, pair your Trezor again.',
                    goToSettingsButton: 'Go to Bluetooth settings',
                    pairAgainButton: 'Pair again',
                },
                title: 'Unable to pair your Trezor?',
                altTitle: 'We couldn’t find your Trezor',
                hint1: 'Make sure your Trezor is turned on and unlocked.',
                hint2: 'Try manually pairing your Trezor:\nGo to your Trezor’s Menu > Pair & Connect > Pair new device',
                scanAgainButton: 'Scan again',
                stillNotWorkingButton: 'It’s still not working',
            },
            pinMatrix: {
                title: 'Enter PIN',
                subtitle: 'on your mobile display',
                content:
                    'Follow the keypad layout on your Trezor device to enter your PIN on your mobile display. Your PIN will be hidden on your mobile display for your security. <link>Learn more here</link>.',
            },
        },
        pinCanceledDuringDiscovery: {
            title: "Some balances haven't been loaded.",
            subtitle: 'Unlock your Trezor to finish loading your balances.',
            button: 'Enter PIN',
        },
    },
    moduleConnectPopup: {
        callback: 'Callback',
        confirm: 'Confirm',
        cancel: 'Cancel',
        areYouSureMessage: 'Are you sure you want to continue?\nMake sure you trust the source.',
        noConnectedApps: 'No connected apps',
        noConnectedAppsDescription:
            'Use your Trezor with third-party apps and wallets to manage your assets.',
        grantPermission: {
            title: 'Grant permissions',
            message:
                'This app wants to connect with Trezor Suite and needs the following permissions.',
        },
        permissions: {
            title: 'Permissions',
            read: 'Access public keys from your Trezor device',
            write: 'Permit transaction and data signing on Trezor',
            management: 'Modify device settings',
            push_tx: 'Broadcast transactions to the blockchain',
        },
        simulation: {
            reviewTransaction: 'Review transaction',
            simulation: 'Simulation',
            simulationPoweredBy: 'Simulation powered by {provider}',
            simulationStatusError: 'Unable to simulate transaction. Proceed at your own risk.',
            simulationStatusWarning:
                'This transaction is potentially risky! Please make sure you trust the source.',
            simulationStatusMalicious:
                'This transaction is likely malicious! We recommend not to engage with this app.',
            disclaimerOverride: 'I want to ignore the warning and proceed anyways',
            contractInfo: 'Contract info',
            feeInfo: 'Fee info',
            protocol: 'Protocol',
            address: 'Address',
            contractFunction: 'Contract function',
        },
        optional: 'Optional',
        alwaysAllow: 'Always allow for this app',
        confirmAddress: {
            title: 'Confirm address',
            message: 'Please compare the address on your Trezor with the third-party app.',
        },
        exportAccounts: {
            title: 'Export accounts',
            message:
                'The following accounts from {passphraseWalletLabel} on {deviceLabel} will be shared with {thirdParty}. Your private keys stay secure and are never exposed.',
        },
        connectionStatus: {
            loading: 'Loading...',
            discoveryRunning: 'Discovery running, please wait...',
        },
        errors: {
            requestFailed: 'Request failed',
            deviceNotConnected: 'Device not connected.',
            invalidCallback: 'Invalid callback URL',
            invalidParams: 'Invalid parameters from calling app',
            versionUnsupported: 'Unsupported version. Please update your Trezor Suite app.',
            methodNotAllowed: 'Method not allowed for security reasons.',
            methodCanceled: 'Call canceled by user.',
            unknownError: 'Unknown error occurred ({code}).',
        },
        bottomSheets: {
            confirmOnDeviceMessage: 'Go to your device and verify the details of the operation.',
        },
        trezorConnect: {
            title: 'Trezor Connect',
            forget: 'Forget',
            retry: 'Retry',
        },
        walletConnect: {
            title: 'WalletConnect',
            message:
                'An external app is trying to connect to your Trezor Suite. Make sure you trust the source!',
            connect: 'Connect',
            pasteFromClipboard: 'Paste from clipboard',
            scanQR: 'Scan WalletConnect QR',
            addConnection: 'Add connection',
            activeConnections: 'Active connections',
            disconnect: 'Disconnect',
            switchAccount: 'Switch account',
            app: 'App',
            requestedNetworks: 'Requested networks',
            selectedAccount: 'Selected account',
            serviceStatus: {
                verified: 'Verified',
                unknown: 'Unknown',
                dangerous: 'Dangerous',
            },
            pairingSuccess: 'Paired. You can now use your Trezor with this app.',
            errors: {
                requestExpired:
                    'Request has expired. Please go back to the application and try again.',
                isScam: 'The request was detected as a scam and was blocked automatically.',
                unableToVerify:
                    'We were unable to verify the request authenticity. Please make sure you trust the source.',
                requiredNetworksNotActivated:
                    'Some required networks are inactive. Activate them for full app compatibility.',
                noNetworksActivated:
                    'To connect to the app, activate at least one supported network in settings.',
            },
        },
    },
    moduleDevice: {
        incompatibleFirmwareModalAppendix: {
            title: 'Follow these steps',
            lines: {
                '1': '1. Connect Trezor to Desktop Suite',
                '2': '2. Navigate to Settings menu',
                '3': '3. Install update',
            },
        },
        noSeedModal: {
            title: 'Your Trezor needs to be set up.',
            description:
                'Unfortunately, we currently don’t support device setup in the mobile app.',
            primaryButton: 'Continue to Trezor Suite Web',
            appendix: {
                title: 'What to do now?',
                lines: {
                    '1': 'Go to Trezor Suite for Web using the button below.',
                    '2': 'Complete the device setup in your browser.',
                    '3': 'Start using your Trezor with Trezor Suite.',
                },
            },
        },
        noSeedWithFWModal: {
            title: 'Firmware installed.\nContinue in your browser to finish device setup.',
            description:
                'Follow the instructions in your browser and come back once setup is complete.',
            primaryButton: 'Finish setup',
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
                bullet1: 'Close the other running applications that might be using your Trezor.',
                bullet2: 'Reconnect your Trezor',
            },
        },
        unsupportedFirmwareModal: {
            title: 'The connected Trezor device needs an update',
            description:
                'To continue using your Trezor with this app, update it with Trezor Suite for desktop or web.',
        },
        bootloaderScreen: {
            factoryResetCard: {
                title: 'Forgot your PIN or just want to reset your Trezor?',
                description:
                    'This will reset all stored data on your Trezor. Proceed with caution.',
                buttonTitle: 'Factory reset',
            },
            reconnectCard: {
                title: 'Want to see your dashboard?',
                description:
                    'If you want to see your dashboard, simply reconnect & unlock your Trezor.',
            },
        },
        noBackupModal: {
            title: "Your Trezor wallet isn't backed up",
            subtitle: 'If your Trezor is lost or damaged, your funds may be irreversibly lost.',
            cta: 'Create wallet backup',
            continue: 'Continue anyway',
        },
        confirmOnDeviceSheetTitle: 'Confirm on Trezor',
        toasts: {
            firmwareRevisionCheckOtherError: "Couldn't perform firmware authenticity check.",
        },
        alerts: {
            lowBattery: {
                title: 'Charge your Trezor before continuing',
                description:
                    'Charge your Trezor to at least {percentage}% to prevent interruptions.',
            },
        },
    },
    moduleDeviceBootloaderMode: {
        bootloaderScreen: {
            factoryResetCard: {
                title: 'Forgot your PIN or just want to reset your Trezor?',
                description:
                    'This will reset all stored data on your Trezor. Proceed with caution.',
                buttonTitle: 'Factory reset',
            },
            reconnectCard: {
                title: 'Want to see your dashboard?',
                description:
                    'If you want to see your dashboard, simply reconnect & unlock your Trezor.',
            },
        },
    },
    moduleDeviceSettings: {
        sectionTitles: {
            general: 'General',
            security: 'Security',
            dangerZone: 'Danger Zone',
        },
        changeDeviceName: {
            title: 'Rename your Trezor',
            validations: {
                noSpecialCharacters: 'Your Trezor’s name can’t contain special characters',
                maxLengthInfo: 'The name can be 16 characters long at most',
                englishLettersOnly: 'Your Trezor’s name can only contain english letters',
            },
            submitButton: 'Confirm',
            loadingSuccessScreen: {
                title: 'Name changed!',
            },
        },
        connection: {
            title: 'Device connection',
            description: 'Manage device connection settings',
        },
        autoConnect: {
            title: 'Auto-connect',
            description:
                'Trezor will connect automatically without having to confirm every connection.',
            successToast: 'Auto-connect turned on.',
            errorToast: 'Auto-connect failed to turn on.',
        },
        forgetDevice: {
            title: 'Forget device',
            description:
                'Permanently delete all data related to your Trezor from this phone, including Bluetooth pairing and connection settings.',
            info: {
                title: 'Forget this Trezor?',
                list: {
                    item1: 'Trezor Suite will forget any existence of this device.',
                    item2: 'Bluetooth pairing will be removed and Trezor will be disconnected.',
                    item3: 'Your wallet backup and funds stay intact—they won’t be erased.',
                },
                submitButton: 'Forget device',
            },
            guide: {
                title: 'Remove from Bluetooth settings',
                step1: {
                    header: 'On your phone',
                    description:
                        'Remove your Trezor from your <link>Bluetooth settings</link>. If you don’t, you might have trouble pairing it again in the future.',
                },
                step2: {
                    header: 'On your Trezor',
                    description:
                        'Go to Pair & Connect and remove your phone. This will prevent connection errors later.',
                },
                continueButton: 'I’ve removed it',
            },
            finish: {
                title: 'Finish removing this Trezor',
                subtitle: 'Disconnect your Trezor device from the phone.',
            },
            successToast: 'Device forgotten',
            disconnect: 'Disconnect\nyour Trezor',
        },
        pinProtection: {
            title: 'PIN protection',
            content: 'PIN protects your device against physical attack.',
            changeButton: 'Change',
            alertBoxTitle: 'Pin not set',
            cardSubtitle: {
                enable: 'Set a PIN for your Trezor',
                changeOrRemove: 'Change or remove PIN',
            },
            pictograms: {
                enable: {
                    title: "Your PIN isn't set",
                    subtitle: 'Set your PIN to protect against unauthorized access to your Trezor.',
                },
                change: {
                    title: 'Your PIN is set',
                },
            },
            actions: {
                enable: {
                    success: 'Device PIN has been enabled.',
                    canceled: 'Enable PIN has been canceled.',
                },
                change: {
                    success: 'Device PIN has been changed.',
                    canceled: 'Change PIN has been canceled.',
                },
                disable: {
                    success: 'Device PIN has been disabled.',
                    canceled: 'Disable PIN has been canceled.',
                },
            },
            errors: {
                pinInvalid: 'The PIN you’ve entered is incorrect.',
                pinMismatch: "The PINs you’ve entered don't match.",
            },
            buttons: {
                setPin: 'Set PIN',
                changePin: 'Change PIN',
                removePin: 'Remove PIN',
            },
        },
        backupAndPassphrase: {
            title: 'Wallet backup & passphrase',
            description: 'Check wallet backup, passphrase',
        },
        passphrase: {
            title: 'Passphrase wallets',
            description:
                'Add a passphrase to create a separate, extra-secure wallet. Each Passphrase wallet is unique and only accessible with its own passphrase.',
        },
        checkBackup: {
            title: 'Check wallet backup',
            subtitle: 'Check the validity of your wallet backup.',
        },
        authenticity: {
            title: 'Device authenticity',
            subtitle: 'This check is essential to ensure your device’s reliability and security.',
            content: 'Check the integrity of the device',
            checkButton: 'Check authenticity',
            info: {
                title: 'Check device authenticity',
                item1: 'This confirms that the secure hardware inside your device is genuine.',
                item2: 'Once your Trezor has passed this check and been verified, you’re all set.',
                letsDoItButton: 'Let’s do it',
            },
            success: {
                title: 'Device authenticity check passed',
                subtitle: 'You can now be sure that your device is genuine & safe to use.',
            },
            toast: {
                canceled: 'Device authenticity check canceled',
                error: 'Unable to validate device: {error}',
                failed: 'Device authenticity check failed: {error}',
            },
        },
        wipeDevice: {
            title: 'Wipe device',
            subtitle: 'This will reset all stored data',
            confirmationCards: {
                eraseAllData: {
                    title: 'Erase all data',
                    description:
                        "All data on your Trezor will be erased. This action can't be undone.",
                },
                walletBackup: {
                    title: 'Wallet backup',
                    description:
                        'Make sure you have your wallet backup. You won’t be able to recover access to your assets without it.',
                },
            },
            loadingSuccessScreen: {
                wipedTitle: 'Trezor wiped successfully',
                factoryResetTitle: 'Trezor reset',
            },
            factoryResetScreen: {
                title: 'Factory reset',
                description: 'This will erase all data on your Trezor. Proceed with caution.',
            },
        },
        firmware: {
            title: 'Firmware',
            subtitle: 'Firmware is your Trezor’s operating system.',
            updateFirmwareButton: 'Update firmware',
            noBackupAlert: {
                title: 'Do you really want to proceed without backup?',
                description:
                    'Although unlikely, you may need to restore your wallet in case of firmware update issue.',
                primaryButton: 'No, create wallet backup',
                secondaryButton: 'Yes, update firmware',
            },
        },
        bluetooth: {
            title: 'Unpair Bluetooth connection',
            content: 'Unpair your Trezor from this device',
            unpairTrezorButton: 'Unpair',
            description:
                'This removes your Trezor from the list of paired devices in Trezor Suite.',
            successMessage: 'Trezor has been unpaired.',
        },
        autoconnect: {
            settingsCard: {
                title: 'Auto-connect',
                description: 'Toggle auto-connect settings',
            },
            screen: {
                subtitle:
                    'Trezor will connect automatically, so you don’t need to approve each connection.',
            },
            enable: {
                pictogramTitle: 'Auto-connect turned on',
                description:
                    'Trezor will no longer connect automatically to Trezor Suite. You’ll confirm each connection on your device.',
                turnOffButton: 'Turn off',
                error: 'Auto-connect failed to turn on.',
                successToast: 'Auto-connect turned on',
            },
            disable: {
                pictogramTitle: 'Auto-connect turned off',
                description:
                    'Trezor will connect automatically to Trezor Suite. No need to confirm each time.',
                turnOnButton: 'Turn on',
            },
        },
    },
    moduleReceive: {
        receiveTitle: 'Receive',
        screenTitle: '{coinSymbol} Receive address',
        deviceCancelError: 'Address confirmation canceled.',
        destinationTag:
            'When sending {coinSymbol} to Trezor, your online exchange may require a memo/destination tag, but Trezor doesn’t. Enter any random number to proceed. <link>Learn more.</link>',
        receiveAddressCard: {
            alert: {
                success: 'The receive address has been confirmed on your Trezor.',
                longCardanoAddress:
                    'Cardano (ADA) address exceeds Trezor device’s screen. Scroll here and on the device to view it and confirm.',
                token: 'Your receive address is your {networkName} address',
            },
            unverifiedWarning: {
                portfolioTracker: {
                    title: 'receive address',
                    subtitle:
                        'For an extra layer of security, use Trezor Suite with your Trezor hardware wallet to verify the receive address',
                },
                viewOnly: {
                    title: 'Verify the receive address on your Trezor',
                    subtitle:
                        'To prevent phishing attacks, verify the receive address on your Trezor.',
                },
            },
            viewOnlyWarning: {
                title: 'Receive address can’t be verified',
                description: 'To confirm the receive address, connect your Trezor.',
                primaryButton: 'Continue without verifying',
                secondaryButton: 'Back',
            },
            deviceHint: {
                description: 'This receive address should match the one  on your Trezor.',
            },
            showAddress: {
                button: 'Show full address',
                buttonTracker: 'Show address',
                learnMore: 'Learn more about verifying addresses',
            },
        },
        bottomSheets: {
            confirmOnDeviceMessage:
                'Go to your device and verify that the receive address on your Trezor matches the one displayed here.',
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
        deviceCompromisedScreen: {
            title: 'Receiving is disabled',
        },
    },
    moduleSettings: {
        items: {
            general: {
                title: 'General',
                preferences: {
                    title: 'Preferences',
                    subtitle: 'Currency, theme',
                },
                privacy: {
                    title: 'Privacy',
                    subtitle: 'Biometrics, data preferences',
                },
                support: {
                    title: 'Support',
                    subtitle: 'Troubleshooting, help',
                },
                trading: {
                    titleInactive: 'Enable trading',
                    subtitleInactive: 'Confirm your country of residence',
                    title: 'Trading',
                    subtitle: 'Country of residence',
                },
            },
            features: {
                title: 'Features',
                devUtils: {
                    title: 'DEV utils',
                    subtitle: 'Only for devs and internal testers.',
                },
                privacyAndSecurity: {
                    title: 'Privacy & Security',
                    subtitle: 'Analytics, Discreet mode, Biometrics',
                },
                ejectWallets: {
                    title: 'Eject wallets',
                    subtitle: 'Hide wallet without connected Trezor',
                },
                coinEnabling: {
                    title: 'Coins',
                    subtitle: 'Manage assets that you want to use',
                },
                suiteSync: {
                    title: 'Suite Sync',
                    subtitle: 'Sync data across your devices',
                    screenSubtitle:
                        'Name your wallets, personalize accounts, and label transactions to stay organized on all your approved devices.',
                    toggleDescription:
                        'Keeps your data up to date on all your devices. Your data stays local and syncs only with devices you approve.',
                    relayUrl: {
                        card: {
                            title: 'Server',
                            subtitle: 'Default or custom server',
                        },
                        screen: {
                            title: 'Server',
                            subtitle:
                                'Choose between the default Trezor server or set up a custom one.',
                        },
                        serverType: {
                            label: 'Server type',
                            default: 'Trezor (default)',
                            custom: 'Custom',
                        },
                        customUrlInput: {
                            label: 'Custom server URL',
                            required: 'This field is required.',
                            invalidUrl: 'Please enter a valid URL.',
                        },
                        saved: 'Server settings saved.',
                    },
                },
                advanced: {
                    title: 'Advanced',
                    subtitle: 'Expert features for power users ',
                },
                experimental: {
                    title: 'Experimental',
                    subtitle: 'Get early access to new features',
                },
                labeling: {
                    title: 'Labeling',
                    subtitle: 'Name your wallets, accounts and more',
                },
                phishing: {
                    title: 'Phishing',
                    subtitle: 'Manage phishing detection settings',
                },
            },
            connections: {
                title: 'Connections',
                trezorConnect: {
                    title: 'Trezor Connect',
                },
                walletConnect: {
                    title: 'WalletConnect',
                    add: 'Add WalletConnect',
                },
            },
        },
        faq: {
            legal: {
                label: 'Legal',
                termsAndConditions: 'Terms & conditions',
                privacyPolicy: 'Privacy policy',
            },
            needHelp: {
                label: 'Need more help?',
                support: 'Trezor Support',
                appLog: 'Application log',
                contactSupportAlert: {
                    title: 'Get faster support',
                    toggleLabel: 'Temporarily share system info',
                    description:
                        'Securely share your firmware version, Trezor Suite version, and hardware wallet model with Trezor Support so we can resolve your issue faster. Your balances and account details are never shared.',
                    primaryButton: 'Contact Trezor Support',
                },
            },
            bluetoothEnabled: {
                android: {
                    '3': {
                        answer: {
                            subtitle:
                                'If you’re having trouble connecting your Trezor and your mobile device, try the following:',
                            cabled: {
                                title: 'For cabled connections:',
                            },
                            wireless: {
                                '0': 'Check the devices are in close proximity',
                                '1': 'Make sure bluetooth is enabled on both devices',
                                '2': 'Remove old Trezor device Bluetooth connections',
                                '3': 'Restart your device(s)',
                                '4': 'Turn Bluetooth on/off again on your mobile device',
                                '5': 'Forget and re-pair the devices',
                                '6': 'Update Trezor firmware and your mobile device OS',
                                title: 'For wireless connections:',
                            },
                            footer: 'If you’re still having issues, contact <link>Trezor Support</link>.',
                        },
                    },
                    '4': {
                        answer: {
                            '4': 'Trezor Safe 7: all versions',
                        },
                    },
                },
                ios: {
                    '0': {
                        question: 'Can I connect my Trezor to Trezor Suite on Mobile?',
                        answer: 'Yes, you can connect your Trezor Safe 7 and use the app to manage your crypto with ease and confidence. For all Trezor devices the app is designed to work as a companion to the desktop/web version of Trezor Suite. As we add more features, it’ll become a standalone mobile application to manage your crypto funds on the go.',
                    },
                    '1': {
                        question:
                            'What is the difference between Portfolio Tracker and Connected Trezor functionality?',
                        answer: 'Portfolio Tracker helps you monitor your account balances without having to physically connect your Trezor device. Simply sync your coin addresses and keep track of your crypto on the go. You can also combine coin addresses from multiple wallets or Trezor devices to track your whole portfolio in one place. Connected Trezor allows you to manage your funds protected by your Trezor device. You can verify receive addresses and check your balances and transactions. However, if you disconnect the Trezor, you’ll no longer see the data from the Trezor device.',
                    },
                    '2': {
                        question: 'What are public keys (XPUB) and receive addresses?',
                        answer: 'An XPUB is a master public key for hierarchical deterministic wallets like bitcoin, generating multiple child keys and receive addresses for improved privacy. Ethereum uses a single, unchanging address for all transactions. For Ethereum, share only your address, while keeping your private key secure.',
                    },
                    '3': {
                        question: 'My Trezor device can’t connect',
                        answer: {
                            '0': 'Check the devices are in close proximity',
                            '1': 'Make sure Bluetooth is enabled on both devices',
                            '2': 'Remove old Trezor device Bluetooth connections',
                            '3': 'Restart your device(s)',
                            '4': 'Turn Bluetooth on/off again on your mobile device',
                            '5': 'Forget and re-pair the devices',
                            '6': 'Update Trezor firmware and your mobile device OS',
                            subtitle:
                                'If you’re having trouble connecting your Trezor and your mobile device, try the following:',
                            footer: 'If you’re still having issues, contact <link>Trezor Support</link>.',
                        },
                    },
                    '4': {
                        question:
                            'Which firmware versions are supported by Trezor Suite on Mobile?',
                        answer: 'Trezor Safe 7: all versions',
                    },
                    '5': {
                        question: 'Why don’t I see my coin listed?',
                        answer: 'Trezor Suite on Mobile currently supports a limited number of cryptocurrencies. If your coin isn’t listed, it may not be compatible with the app. However, Trezor regularly adds support for new coins and tokens, so check back periodically to see which coins have been added.',
                    },
                    '6': {
                        question: 'What does the graph display?',
                        answer: 'The graph displays the price history of your portfolio’s synced assets over a specified period. You can adjust the time period by selecting a different range on the bottom of the graph.',
                    },
                    '7': {
                        question: 'What is the “Eject wallets” feature?',
                        answer: 'Turn on this feature if you want to eject all wallets automatically after disconnecting your Trezor hardware wallet. With the auto-eject feature disabled, you can see your account balances even after disconnecting your Trezor. This lets you track your funds without compromising security. Remember if you want to move funds, you’ll always need to connect your Trezor.',
                    },
                },
            },
            usbEnabled: {
                '0': {
                    question: 'Can I connect my Trezor to Trezor Suite?',
                    answer: 'Yes, you can connect your Trezor Hardware Wallet and use limited functionality. It is designed to work as a companion to the desktop/web version of Trezor Suite, but we will gradually add more features to make it a standalone application to manage your {coinLabel} funds with Trezor Hardware Wallet.',
                },
                '1': {
                    question:
                        'What is the difference between Portfolio Tracker and Connected Trezor functionality?',
                    answer: 'Portfolio Tracker helps you stay in touch with your portfolio balances without having to connect your Trezor device. Simply sync your coin addresses and you can keep track of your balances on the go. You can also combine coin addresses from multiple wallets or Trezor devices to track your whole portfolio in one place. Connected Trezor allows you to manage your funds associated with your Trezor device. You can verify receive addresses and check your balances and transactions. However, if you disconnect the Trezor, you will no longer see the data from the Trezor device.',
                },
                '2': {
                    question: 'What is public key? (XPUB) or a receive address?',
                    answer: 'An XPUB is a master public key for hierarchical deterministic wallets like bitcoin, generating multiple child keys and receive addresses for improved privacy. Ethereum uses a single, unchanging address for all transactions. For Ethereum, share only your address, while keeping your private key secure.',
                },
                '3': {
                    question: 'My Trezor device can’t connect',
                    answer: {
                        '0': 'Reconnect your Trezor',
                        '1': 'Use a different USB data cable',
                        '2': 'Use a different mobile device',
                        '3': 'Enable connection for Trezor Suite via phone system message',
                    },
                },
                '4': {
                    question: 'Which firmware versions are supported by Trezor Suite on mobile?',
                    answer: {
                        '0': 'Trezor One: from version 1.12.1',
                        '1': 'Trezor T: from version 2.6.3',
                        '2': 'Trezor Safe 3: from version 2.6.3',
                        '3': 'Trezor Safe 5: from version 2.7.2',
                    },
                },
                '5': {
                    question: 'Why don’t I see my coin listed?',
                    answer: 'Trezor Suite currently supports a limited number of cryptocurrencies. If your coin is not listed, it may not be compatible with the app. However, Trezor regularly adds support for new coins, so check back periodically to see which coins have been added.',
                },
                '6': {
                    question: 'What does the graph display?',
                    answer: 'The graph in Trezor Suite displays the price history of your portfolio’s synced assets over specified time period. You can adjust the time period by selecting a different range on the bottom of the graph.',
                },
                '7': {
                    question: 'What is the “Eject wallets” feature?',
                    answer: 'Turn on this feature if you want to eject all wallets automatically after disconnecting your Trezor hardware wallet. With the auto-eject feature disabled, you can see your account balances even after disconnecting your Trezor. This lets you track your funds without compromising security. Remember if you want to move funds, you’ll always need to connect your Trezor.',
                },
            },
            usbDisabled: {
                '0': {
                    question: 'What is public key? (XPUB) or a receive address?',
                    answer: 'An XPUB is a master public key for hierarchical deterministic wallets like bitcoin, generating multiple child keys and receive addresses for improved privacy. Ethereum uses a single, unchanging address for all transactions. For Ethereum, share only your address, while keeping your private key secure.',
                },
                '1': {
                    question: 'Can I connect my Trezor to Trezor Suite?',
                    answer: "No, it's not possible. It's designed to work as a companion to the desktop/web version of Trezor Suite as a way to keep up with your Trezor portfolio on the go.",
                },
                '2': {
                    question: 'How do I send {coinLabel} in Trezor Suite?',
                    answer: 'Trezor Suite is a watch-only portfolio tracker, which means it is designed to help you monitor your cryptocurrency holdings and transactions. Unfortunately, it is not currently possible to send {coinLabel} using Trezor Suite. To send {coinLabel}, use the full version of Trezor Suite with your Trezor hardware wallet. This will provide you with the necessary security and functionality to manage and perform transactions with your cryptocurrencies.',
                },
                '3': {
                    question: 'Why don’t I see my coin listed?',
                    answer: 'Trezor Suite currently supports a limited number of cryptocurrencies. If your coin is not listed, it may not be compatible with the app. However, Trezor regularly adds support for new coins, so check back periodically to see which coins have been added.',
                },
                '4': {
                    question: 'What does the graph display?',
                    answer: 'The graph in Trezor Suite displays the price history of your portfolio’s synced assets over specified time period. You can adjust the time period by selecting a different range on the bottom of the graph.',
                },
                '5': {
                    question:
                        'Why does the balance in Trezor Suite on desktop differ from the balance in the mobile app?',
                    answer: 'Balances may mismatch due to improper syncing of all assets and account types, or pending transactions. Ensure you have synced all your assets correctly and check for any pending transactions to resolve the discrepancy.',
                },
            },
            trading: {
                question: 'What trading features are available?',
                answer: 'With a connected Trezor you’re able to carry out key trade features in Trezor Suite on mobile. Learn more about trading crypto on the <link>Trezor knowledge base</link>.',
            },
        },
        preferences: {
            title: 'Preferences',
            fiatCurrencyLabel: 'Currency',
            bitcoinUnitsLabel: 'Bitcoin units',
            languageLabel: 'Language',
            theme: {
                label: 'Theme',
                standard: 'Standard',
                dark: 'Dark',
                system: 'System',
            },
        },
        aboutUs: {
            title: 'About Trezor Suite',
            followUs: 'Follow us',
            lastCommitHash: 'Last commit hash: {lastCommitHash}',
            body: 'Trezor Suite is a safe and secure way to stay connected to the {coinLabel} on your hardware wallet. Track coin balances on the go without exposing your private data. Easily create and send payment addresses to anyone.',
        },
        privacyAndSecurity: {
            title: 'Privacy & Security',
            analyticsSwitch: {
                title: 'Usage data',
                subtitle:
                    'All collected data is anonymous and is only used to improve the Trezor ecosystem.',
            },
            biometrics: {
                title: 'Biometrics',
                subtitle: 'Use facial or fingerprint verification to unlock the app.',
            },
            discreetMode: 'Discreet mode',
        },
        coinEnabling: {
            initialSetup: {
                title: 'Choose coins you want to use with your Trezor.',
                subtitle:
                    'The more coins are enabled, the longer it takes to load the app. You can always add more later.',
            },
            settings: {
                title: 'Active assets',
                subtitle:
                    'Only choosing coins that you use will shorten loading times when connecting your Trezor.',
            },
            bottomNote:
                'Didn’t find what you’re looking for? Check if it’s not a token running one of the listed coin’s network.',
            toasts: {
                coinEnabled: '{coin} will load once you connect Trezor.',
            },
            btcOnly: {
                title: 'Your Trezor is BTC only.',
                subtitle: 'So what exactly are you looking for?',
            },
            oneNetworkSymbolAlert: {
                title: 'You need to keep at least 1 coin enabled at all times.',
                description: 'Otherwise the app won’t show you anything.',
            },
        },
        viewOnly: {
            wallet: {
                standard: 'Standard wallet',
                defaultPassphrase: 'Passphrase wallet #{index}',
            },
            connected: 'Connected',
            disconnected: 'Disconnected',
            autoEject: {
                title: 'Eject wallets',
                subtitle:
                    'Without connected Trezor, your balances remain visible. You always need to connect Trezor to move funds.',
                switch: {
                    title: 'Auto eject',
                    description: 'Eject all wallets automatically after unplugging Trezor',
                    alert: {
                        titleNoConnectedTrezor: 'Enabling auto-eject will eject all wallets',
                        titleConnectedTrezor: ' after disconnecting Trezor',
                        description:
                            "You'll need to reconnect your Trezor to see your balances again.",
                        primaryButtonTitle: 'Enable auto-eject',
                    },
                },
                toast: {
                    walletsEjected: 'Wallets ejected',
                    walletEjected: 'Wallet ejected',
                    walletsWillBeEjected: 'Will be ejected after disconnecting Trezor',
                },
                alert: {
                    title: 'Your balances are still visible even when your Trezor is disconnected.',
                    subtitle:
                        'You can always eject your wallets at any time. Funds can’t be moved without a connected device.',
                    primaryButtonTitle: 'Got it',
                    secondaryButtonTitle: 'Auto eject wallets',
                    successToast: 'Wallets now eject after disconnecting Trezor',
                },
            },
        },
        advanced: {
            title: 'Advanced',
            buttonLearnMore: 'Learn more',
            authenticityChecks: {
                buttonTurnOff: 'Turn off',
                buttonTurnOn: 'Turn on',
                buttonLearnMore: 'Learn more',
                toastOn: 'Check turned on',
                toastOff: 'Check turned off',
                turnOff: {
                    content: 'This feature is designed to protect your security.',
                    item1: 'Only continue if your Trezor has successfully passed this check before.',
                    item1Explanation:
                        'Using an unverified device could result in the loss of your funds.',
                    item2: 'Only use for testing and development',
                    item2Explanation:
                        'This security check should only be disabled for testing and development purposes.',
                    acknowledgement: 'I’ve read and understood the above.',
                    acknowledgementNote: 'Trezor Support will never ask you to turn this off.',
                    buttonTurnOff: 'Turn off',
                },
                firmware: {
                    title: 'Firmware authenticity check',
                    subtitle:
                        'Ensure that your firmware is legitimate. Compromised firmware won’t be able to communicate with Trezor Suite.',
                    turnOffTitle: 'Turn off firmware authenticity check',
                },
                device: {
                    title: 'Device authenticity check',
                    subtitle:
                        'Verify that your Trezor device is genuine. This helps ensure you never use a compromised or fake device. ',
                    turnOffTitle: 'Turn off device authenticity check',
                },
            },
            networkReserve: {
                title: 'Network reserve',
                subtitle:
                    'Reserve a small amount of the native token on {supportedNetworks} to cover any extra network fees when you send, swap, or sell your assets.',
            },
            mevProtection: {
                title: 'MEV protection',
                subtitle:
                    'Stay safe and secure fair prices by preventing others from interfering with your transactions. Available on {supportedNetworks}.',
            },
            dustPhishing: {
                title: 'Dust phishing protection',
                subtitle:
                    'Hide suspicious micro transactions used in scams from your transaction history.',
                enableProtection: 'Enable protection',
                dustThresholdTitle: 'Dust phishing threshold',
                dustThresholdDescription:
                    'Transactions below this amount are marked as suspicious and hidden.',
                save: 'Save',
                placeholder: 'Enter dust threshold in USD',
                errors: {
                    empty: 'Dust threshold is required',
                    number: 'Please enter a valid number',
                    positive: 'Dust threshold must be a positive number',
                },
            },
            bitcoinBackends: {
                title: 'Bitcoin backends',
                subtitle: 'Manage backend connections',
                description: 'Connect to a custom backend server for enhanced privacy.',
                servers: {
                    title: 'Backend server',
                    status: {
                        connected: 'Connected',
                        disconnected: 'Disconnected',
                    },
                    serverType: 'Server type',
                    serverTypeDefault: 'Trezor (default)',
                    serverAddress: 'Server address',
                    connectButton: 'Connect',
                    invalidFormat:
                        'Invalid format. Enter the server address in this format: host:port:[t|s].',
                    unableToConnect: {
                        clearnet:
                            'Unable to connect to server. Check for typos and server disruptions.',
                        tor: "Tor isn't supported. Use a clearnet address instead",
                    },
                },
                closeAction: {
                    title: 'Discard changes?',
                    description: 'Any unsaved changes will be lost.',
                    discardButton: 'Discard',
                    continueEditingButton: 'Keep editing',
                },
                connectionInfo: {
                    title: 'Connection info',
                    connectedTo: 'Currently connected to',
                    blockHash: 'Block hash',
                    blockHeight: 'Block height',
                    backendVersion: 'Backend version',
                    disconnected:
                        'Unable to connect to the backend server. Reconnect your device and check your internet connection or custom backend address. Also, make sure BTC is activated in Settings.',
                },
            },
            experimentalFeatures: {
                title: 'Experimental features',
                subtitle:
                    'These features are in testing, may be unstable, and might not have long-term support.',
                warning: 'For experienced users only.\nUse at your own risk.',
                suiteSync: {
                    title: 'Suite Sync',
                    description:
                        'Keep your wallet, account, and transaction labels updated in Trezor Suite on all your devices. Your data stays safe—only your Trezor can decrypt it.',
                },
                feedback: {
                    title: 'Rate your {featureName} experience',
                    description: "Tell us what's working and what's not—we read every reply.",
                    rateButton: 'Share feedback',
                    dismissButton: 'Dismiss',
                    ratingLabel: 'Show us your {featureName} vibe!',
                    descriptionLabel: "Tell us what's working and what's not—we read every reply.",
                    submitButton: 'Submit',
                },
            },
            featureFeedback: {
                title: 'Rate your {featureName} experience',
                description:
                    'It takes just a few seconds. Your feedback helps us improve the feature for everyone.',
                rateButton: 'Share feedback',
                dismissButton: 'Dismiss',
                ratingLabel: "How's {featureName} making you feel?",
                descriptionLabel: "Tell us what's working and what's not—we read every reply.",
                submitButton: 'Submit',
            },
        },
        experimental: {
            title: 'Experimental features',
            subtitle: 'For experienced users only. Use at your own risk.',
            tronViewOnly: {
                title: 'Tron View-Only (Beta)',
                description:
                    'Enable the Tron network. The latest firmware is required. You can receive funds, check your balance, view tokens, charts, and transaction history (may contain bugs). Full support coming soon (or available via third-party wallets).',
            },
            testnets: {
                title: 'Testnet coins & features',
                description: 'Test networks carry no real value and are used only for testing.',
            },
        },
        appLog: {
            sensitiveDataToggle: {
                title: 'Include sensitive data',
                subtitle:
                    'Enabling this option includes sensitive data including balance, transaction IDs, device labels, device ID, and public addresses in the app log. If your issue is unrelated, keep it disabled.',
            },
            exportButton: 'Export to file',
        },
        phishing: {
            settings: {
                title: 'Phishing',
                subtitle: 'Manage your phishing detection settings',
                save: 'Save',
                turnOff: 'Turn off',
                placeholder: 'Enter dust threshold in USD',
            },
            dustThreshold: {
                title: 'Dust phishing threshold',
                subtitle:
                    'Adjust the dust threshold for phishing detection. Currently, the dust threshold can only be defined in USD currency. Leaving this field empty will turn off dust amount detection.',
                errors: {
                    number: 'Please enter a valid number',
                    positive: 'Dust threshold must be a positive number',
                },
            },
        },
    },
    moduleOnboarding: {
        welcomeScreen: {
            subtitle: 'Take control.',
            button: "Let's get started",
        },
        analyticsConsentScreen: {
            title: 'Better—with you.',
            subtitle:
                'Help us shape a better experience for you by allowing anonymous data collection.',
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
            learnMoreButton: 'More about privacy',
        },
        biometricsScreen: {
            title: 'Biometrics',
            description: 'Enable biometrics to prevent unauthorized access to this app.',
            button: {
                notNow: 'Not now',
            },
        },
    },
    moduleDeviceOnboarding: {
        recovery: {
            title: 'For recovery, continue to web application.',
            subtitle:
                'We’re currently working on allowing recovery in mobile app as soon as possible',
            redirectButton: 'Continue to Trezor Suite Web',
            laterButton: 'I’ll do it later',
            step1: 'Go to Trezor Suite for Web using the button below.',
            step2: 'Complete recovery in your browser.',
            step3: 'Start using your Trezor with\nTrezor Suite.',
        },
        createPinScreen: {
            title: 'Set your Trezor’s PIN',
            subtitle:
                'Use your PIN to unlock your Trezor when\nconnecting it to a phone or computer.',
            cancelAlert: {
                title: 'Cancel PIN setup?',
                description:
                    'We strongly recommend setting a PIN for your Trezor to prevent unauthorized access.',
                cancelButton: 'Yes, cancel',
                retryButton: 'No, set PIN',
            },
        },
        walletBackupSheet: {
            title: 'Wallet backup type',
            timeLabel: 'Time',
            formatLabel: 'Format',
            storageLabel: 'Storage',
            legacyOptionsLabel: 'Legacy options',
            options: {
                'shamir-single': {
                    title: 'Single-share Backup',
                    description: 'Recommended for your Trezor',
                    time: '~10 minutes <bold>total</bold>',
                    format: '1 share (20 words)',
                    storage:
                        'Store your wallet backup in a secure, private place. Never share it with anyone or store it anywhere digital.',
                    callout: 'Upgradable to Multi-share Backup',
                    submitButton: 'Continue with Single-share Backup',
                },
                'shamir-advanced': {
                    title: 'Multi-share Backup',
                    description: 'Designed for experienced users',
                    time: '~10 minutes <bold>per share</bold>',
                    format: '2-16 shares (20 words per share). Select the minimum number of shares required to recover your assets.',
                    storage:
                        'Store your shares separately in secure, private locations, or distribute them to trusted individuals. Never keep all shares together or store them digitally.',
                    callout: 'Requires increased attention',
                    submitButton: 'Continue with Multi-share Backup',
                    alertButtonLabel: 'Learn more',
                },
                '12-words': {
                    title: '12-word backup',
                    description: 'Legacy backup type',
                    format: 'Generates a <bold>single set of 12 words</bold> to recover access to your funds.',
                    storage:
                        'Store your wallet backup in a secure, private place. Never share it with anyone or store it anywhere digital.',
                    callout: 'This can’t be upgraded to a Multi-share Backup.',
                    submitButton: 'Continue with 12-word backup',
                },
                '24-words': {
                    title: '24-word backup',
                    description: 'Legacy backup type',
                    format: 'Generates a <bold>single set of 24 words</bold> to recover access to your funds.',
                    storage:
                        'Store your wallet backup in a secure, private place. Never share it with anyone or store it anywhere digital.',
                    callout: 'This can’t be upgraded to a Multi-share Backup.',
                    submitButton: 'Continue with 24-word backup',
                },
            },
        },
        uninitializedDeviceLandingScreen: {
            noFirmware: {
                title: 'Now it’s just you\nand your {coinLabel}',
                button: "Let's get started",
            },
            firmware: {
                title: 'Have you used this Trezor before?',
                subtitle:
                    'Firmware is already installed on this Trezor. Continue only if you have used this Trezor before.',
                confirmButton: 'Yes, set up my Trezor',
                button: 'Yes, I have',
                noButton: "No, I haven't",
            },
            lookDifferentLabel: 'My device looks different',
        },
        suspiciousDeviceScreen: {
            title: 'Let’s play it safe',
            subtitle:
                'We want to be sure your device is in the best shape before you start using it.',
            bullet1: 'Disconnect your device from your phone.',
            bullet2: 'Avoid using this device or sending any funds to it.',
            bullet3: 'Go to the support page linked below and use the Chat option on the website.',
            contactSupportButton: 'Contact Trezor Support',
        },
        securityCheckScreen: {
            title: 'Security check',
            subtitle: 'We need to make sure your device is safe to work with.',
            step1: {
                header: 'Trusted source',
                description:
                    'My device was bought from the official Trezor Shop or a <link>trusted reseller</link>.',
            },
            step2: {
                header: 'Holographic seal',
                description:
                    'The <link>holographic seal</link> was complete and undamaged when I unboxed my device.',
                modal: {
                    alertBox:
                        'We sold this Trezor model with two different holographic seals. Both of them are valid.',
                    title: 'Verify the holographic seal',
                    paragraph1:
                        'Ensure the holographic seal on your device was intact when unboxed, with no peeling, scratches, or damage.',
                    paragraph2: 'Proceed only if the seal was intact and undamaged.',
                },
            },
            step3: {
                header: 'Packaging',
                description:
                    'The package was factory sealed and intact, with no signs of tampering before unboxing.',
            },
            declineButton: 'I’m not sure',
        },
        deviceAuthenticitySuccessScreen: {
            title: 'Your Trezor is genuine',
            subtitle: 'You’re good to go.',
        },
        deviceTutorialScreen: {
            title: 'Continue with short tutorial on Trezor',
            actionLabel: 'Skip tutorial',
        },
        createOrRecoverCrossroadsScreen: {
            create: {
                title: 'Create a new wallet',
                subtitle: 'Open a new wallet and secure your assets with a unique wallet backup.',
                button: 'Get started',
            },
            recover: {
                title: 'Recover access to assets',
                subtitle:
                    'Use a new Trezor to recover access to your assets if your previous hardware wallet was lost, stolen, or damaged.',
                button: 'Recover',
            },
        },
        createWalletLoadingScreen: {
            title: 'Let’s protect your assets with a wallet backup',
        },
        walletBackupTutorialScreen: {
            step1: {
                callout: 'What’s a wallet backup?',
                title: 'A wallet backup is a list of words that recovers access to your assets',
                description: "You'll be prompted to write it down shortly.",
            },
            step2: {
                callout: 'When do you need your wallet backup?',
                title: 'You’ll need it if your Trezor gets...',
                risks: {
                    stolen: 'Stolen',
                    lost: 'Lost',
                    damaged: 'Damaged',
                },
            },
            step3: {
                callout: 'How do your wallet backup and Trezor differ?',
                title: 'Each has their own role',
                section1: {
                    title: 'Trezor',
                    description: 'Confirms transactions',
                    bullet1: 'Manage assets with the Trezor Suite app.',
                    bullet2: 'Stores & protects access to your assets.',
                },
                section2: {
                    title: 'Wallet backup',
                    description: 'Recovers access to assets',
                    bullet1:
                        'The only way to recover access to your assets if something happens to your Trezor.',
                },
            },
            step4: {
                callout: 'Your wallet backup is absolutely essential',
                title: 'Always protect your wallet backup',
                description: 'No one can restore it—not even Trezor Support.',
            },
            step5: {
                callout: 'Select how to recover access to your assets',
                title: 'Wallet backup type',
                moreOptionsButton: 'More options',
                backupOptions: {
                    'shamir-single': {
                        title: 'Single-share Backup',
                        description:
                            'Creates a single share of 20 words used to recover access to your assets.',
                        callout: 'Recommended for your Trezor',
                    },
                    'shamir-advanced': {
                        title: 'Multi-share Backup',
                        description:
                            'Creates multiple shares of 20 words used to recover access to your assets.',
                        callout: 'For experienced users',
                        calloutActionLabel: 'Learn',
                    },
                    '12-words': {
                        title: '12-word backup',
                        description:
                            'Creates a single set of 12 words used to recover access to your assets.',
                    },
                    '24-words': {
                        title: '24-word backup',
                        description:
                            'Creates a single set of 24 words used to recover access to your assets.',
                    },
                },
            },
            step6: {
                callout: 'Let’s start off right',
                title: 'Get set before creating your wallet backup',
                instruction1: 'Have a pen & your wallet backup card',
                instruction2: {
                    single: 'Give yourself about 10 minutes to complete',
                    multiple: 'Give yourself about 10 minutes per share',
                },
                instruction3: 'Make sure you’re in a safe & private space',
                holdToConfirmButton: 'Hold to start',
            },
        },
        walletCreatedSuccessScreen: {
            successLabel: 'All good!',
        },
        walletBackupRecapScreen: {
            step1: {
                callout: 'Using your wallet backup',
                title: 'Regain access anytime',
                step1: 'If your Trezor is lost, stolen, damaged, or you upgrade to a new one',
                step2: 'Get a new Trezor',
                step3: 'Enter your wallet backup',
                step4: 'Regain access to your assets',
            },
            step2: {
                callout: 'Securing your wallet backup',
                title: 'Never store your wallet\nbackup anywhere digital',
                titleRegular: 'backup anywhere digital',
                titleUnderlined: 'Never store your wallet',
            },
            step3: {
                callout: 'Storing your wallet backup',
                title: 'Store your wallet backup in a secure, private place',
            },
            step4: {
                callout: 'Protecting your wallet backup',
                title: 'No one can recover your wallet backup—not even Trezor Support',
                holdToConfirmButton: 'Hold to continue',
            },
        },
        recoveryInstructionsScreen: {
            callout: 'Recover assets',
            title: 'Get your wallet backup',
            description:
                'Your wallet backup is one or more lists of words you wrote down when you first set up your previous hardware wallet.',
            secondaryButton: 'I don’t have a wallet backup',
            bottomSheet: {
                title: 'I don’t have a wallet backup',
                card1: {
                    title: 'Can’t find your wallet backup?',
                    paragraph1:
                        'Check every place where you might have stored it—drawers, safes, books.',
                    cta: 'Learn more',
                },
                card2: {
                    title: 'Want to access your exchange account?',
                    paragraph1:
                        "You can't directly recover your exchange account on Trezor, but you can always transfer your assets to it.",
                    paragraph2: 'To transfer:',
                    bullets: {
                        '1': 'Set up your Trezor',
                        '2': 'Generate a receive address',
                        '3': 'Use the receive address to transfer funds from the exchange account to your Trezor',
                    },
                    cta: 'Set up my new Trezor',
                },
            },
        },
        walletRecoveryRecapScreen: {
            step1: {
                callout: 'Keep your wallet backup safe',
                title: 'Make sure to return your wallet backup to a secure, private place',
            },
            step2: {
                callout: 'Protecting your wallet backup',
                title: 'No one can recover your wallet backup—not even Trezor Support',
            },
        },
        backupFailedModalScreen: {
            title: 'Your wallet backup failed.',
            subtitle: 'You need to wipe your device and create a wallet backup.',
            steps: {
                wipe: 'Wipe your device to continue. This will erase all of its existing data.',
                contact:
                    'If you have assets associated with this device, contact Trezor support now.',
            },
            primaryButton: 'Wipe device',
            secondaryButton: 'Contact Trezor Support',
            alert: {
                title: 'Erase all data?',
                description:
                    'You should not have any funds associated with this device. Wiping it will erase its data. This action can’t be undone.',
                primaryButton: 'Wipe device',
                secondaryButton: 'Contact Trezor Support',
            },
        },
        deviceDisconnectedAlert: {
            title: 'Your Trezor has been disconnected',
            description: 'Connect your Trezor to start again.',
            reconnectButton: 'Connect Trezor',
        },
        cancelOnboardingAlert: {
            title: 'Cancel Trezor setup?',
            description: 'Start again at anytime.',
            cancelButton: 'Yes, cancel',
            continueButton: 'Continue setup',
        },
    },
    moduleAccountManagement: {
        accountsScreen: {
            title: 'My assets',
        },
        accountSettingsScreen: {
            coin: 'Coin',
            accountType: 'Account type',
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
            renameForm: {
                title: 'Rename coin',
                coinLabel: 'Coin label',
            },
            removeAccountAlert: {
                title: 'Do you really want to remove this coin from {trezorSuiteHeader}?',
                description:
                    'Your assets remain intact and safe. Import this asset again using your public key (XPUB) or receive address at any time.',
                primaryButton: 'Remove coin',
            },
        },
        accountDetailContentScreen: {
            coinPriceCard: {
                changeIn24h: '24h change',
                coinPrice: '{coinName} price',
            },
        },
    },
    moduleAccounts: {
        accountNotFound: 'Account {accountKey} not found.',
        tokens: {
            runOn: 'Run on {accountLabel}',
            errorMessage: 'Token not found.',
        },
        accountDetail: {
            accountLabelBadge: 'Run on {accountLabel}',
            stablecoinYield: {
                infoText: 'This token represents your deposit and all rewards in stablecoin yield.',
                vault: 'Vault',
                apy: 'Annual percentage yield',
                supplied: 'Supplied',
                supplyMore: 'Supply more',
                withdraw: 'Withdraw',
                apyBreakdown: {
                    apyLabel: '{apy} APY',
                    autoCompounded: 'Automatically added and compounded.',
                    manualCompound: 'Manually claim and deposit to compound.',
                    footer: 'APY may change over time.',
                },
            },
        },
        emptyState: {
            title: 'No assets',
            subtitle: 'Connect your Trezor or sync coins to view and track assets.',
            receiveSubtitle: 'Connect your Trezor or sync coins to view and receive assets.',
            searchAgain: 'Search again',
        },
        viewOnlyAddAccountAlert: {
            title: 'Connect & unlock your Trezor to add new assets',
            description:
                'We’re unable to add any new coins or accounts to your device when it’s disconnected.',
        },
        tronResources: {
            bandwidth: {
                label: 'Bandwidth',
                description:
                    'Used for all transactions like sending TRX. If you lack enough bandwidth, TRX is burned as a fee. Refills automatically over time (up to 24 hours).',
            },
            energy: {
                label: 'Energy',
                description:
                    'Used for smart contract actions like sending tokens. If depleted, TRX is burned as a fee. Refills automatically over time (up to 24 hours).',
            },
        },
    },
    transactions: {
        title: 'Transactions',
        receive: 'Receive',
        send: 'Send',
        more: 'Load more',
        status: {
            pending: 'Pending',
            confirmed: 'Confirmed',
        },
        phishing: {
            badge: 'Caution!',
            warning:
                'This transaction appears to be suspicious and may be a scam.  <blogLink>Learn more</blogLink>',
            warningFakeToken: 'This transaction may include hidden or unrecognized tokens.',
            warningUnknownTx: "This transaction couldn't be fully verified.",
            warningDustAmount:
                'This transaction contains dust amounts, which can be used in scams.',
            warningZeroAmount: 'This transaction has a zero amount and may be suspicious.',
            warningTrc10Transfer: 'This transaction is a TRC10 transfer and may be suspicious.',
            markedAsRecognized: 'You’ve confirmed this transaction is safe.',
            hideTransaction: 'Mark as suspicious',
            unhideTransaction: 'Mark as safe',
        },
        emptyState: {
            title: 'No transactions',
            subtitle: 'Get started by receiving coins',
            button: 'Receive',
        },
        detail: {
            header: '<transactionType></transactionType> transaction',
            exploreButton: 'Explore in blockchain',
            feeLabel: 'Fee',
            dateLabel: 'Date',
            transactionOverviewTitle: 'Transaction overview',
            showMoreButton: 'and {amount} more',
            stellarTrustlineAdded: 'Established trustline to {assetCode}',
            stellarTrustlineRemoved: 'Removed trustline to {assetCode}',
            sheet: {
                parameters: 'Parameters',
                values: 'Compare values',
                inputs: 'Inputs & Outputs',
            },
            showDetails: 'Show details',
        },
        tokens: {
            toggleTokens: 'Include tokens',
            title: 'Note, your {networkName} balance doesn’t include tokens.',
        },
        name: {
            received: 'Received',
            receiving: 'Receiving',
            sent: 'Sent',
            sending: 'Sending',
            pending: 'Pending',
            contract: 'Contract',
            self: 'Self',
            joint: 'Joined',
            failed: 'Failed',
            unknown: 'Unknown',
            withdrawal: 'Rewards withdrawal',
            stakeDelegation: 'Stake delegation',
            stakeRegistration: 'Registration of a stake address',
            stakeDeregistration: 'Deregistration of a stake address',
            stellarTrustlineAdded: 'Established trustline',
            stellarTrustlineRemoved: 'Removed trustline',
            stake: 'Stake',
            staking: 'Staking',
            unstake: 'Unstake',
            unstaking: 'Unstaking',
            claim: 'Claim',
            claiming: 'Claiming',
            changeDelegate: 'Change delegate',
            changingDelegate: 'Changing delegate',
            tron: {
                createAccount: 'Create Account',
                updateAccount: 'Update Account',
                deploySmartContract: 'Deploy Smart Contract',
                voteWitness: 'Vote Witness',
                freezeBalance: 'Freeze Balance',
                unfreezeBalance: 'Unfreeze Balance',
                withdrawBalance: 'Withdraw Balance',
                claimRewards: 'Claim Rewards',
                delegateResource: 'Delegate Resource',
                undelegateResource: 'Undelegate Resource',
            },
        },
        TransactionDetailScreen: {
            sheetSubtitle: 'Transaction #{transactionId}',
            inputsSheet: {
                inputs: 'Inputs {inputsCount}',
                outputs: 'Outputs {outputsCount}',
                internalTransfers: 'Internal transfers',
                tokenTransfers: 'Token transfers',
            },
            valuesSheet: {
                today: 'Today {percentageDifference}',
                transaction: 'Transaction',
                input: 'Input',
                fee: 'Output',
                total: 'Total',
            },
            parametersSheet: {
                confirmations: 'Confirmations',
                feeRate: 'Fee rate',
                rbf: 'RBF',
                lockTime: 'Lock time',
                broadcast: 'Broadcast',
                transactionId: 'Transaction ID',
                transactionIdCopied: 'Transaction ID copied',
                ethereum: {
                    gasLimit: 'Gas limit',
                    gasUsed: 'Gas used',
                    gasPrice: 'Gas price',
                    nonce: 'Nonce',
                },
                values: {
                    enabled: 'Enabled',
                    disabled: 'Disabled',
                },
            },
            addressesSheet: {
                from: 'From {count}',
                to: 'To {count}',
                changeAddresses: 'Change {count,plural, one {Address} other {Addresses}}',
                copied: 'Address copied to clipboard',
            },
            unknownTarget: 'Target or Origin of transaction is unknown.',
        },
        transactionOverviewScreen: {
            title: 'Received transaction',
            fromCard: {
                title: 'From',
            },
            toCard: {
                title: 'To',
                meTitle: 'Me',
                otherRecipients: 'Other recipients',
            },
        },
    },
    device: {
        title: {
            continueOnTrezor: 'Continue\non your Trezor',
        },
        continueOnTrezor: {
            headerTitle: 'Continue on your Trezor',
            title: 'Confirm the action on Trezor.',
            subtitle: 'Follow the instructions there on its screen.',
        },
    },
    deviceManager: {
        deviceButtons: {
            deviceSettings: 'Device settings',
            addHiddenWallet: 'Open passphrase',
            devices: 'Change',
        },
        connectButton: 'Connect Trezor',
        status: {
            portfolioTracker: 'Track your assets without Trezor',
            connected: 'Connected',
            disconnected: 'Disconnected',
            bootloader: 'Bootloader mode',
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
    },
    qrCode: {
        scanner: 'QR code scanner',
        addressCopied: 'Address copied',
        copyButton: 'Copy',
        shareButton: 'Share',
        qrCodeHint: 'Scan the QR code with your camera.',
        pickImageButton: 'Upload from gallery',
        pickImageError: 'QR code not found in the image.',
        cautionWarning: {
            title: 'Handle your public key (XPUB) with caution',
            subtitle:
                'Sharing your public key (XPUB) with a third party gives them the ability to view your transaction history.',
        },
        deniedWarning: {
            title: 'Camera access denied.',
            description: 'Allow camera access in your device settings.',
            grantPermissionButton: 'Grant permission',
        },
    },
    graph: {
        retrievingData: 'Retrieving data...',
        errorMessage: 'There are some troubles with loading graph: ',
        tryAgain: 'Try again',
        retrievengTakesLongerThanExpected:
            'Retrieving balances takes longer than usual. \n It may be caused by unstable internet connection.',
        timeSwitch: {
            day: '1d',
            week: '1w',
            month: '1m',
            sixMonths: '6m',
            year: '1y',
            all: 'all',
        },
    },
    modulePassphrase: {
        title: 'Passphrase',
        subtitle:
            'Entering a <bold>passphrase opens a distinct wallet</bold> secured by that specific phrase.',
        featureAuthorizationError: 'The passphrase you’ve entered is incorrect.',
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
        noPassphrase: {
            button: 'No passphrase',
        },
        loading: {
            title: 'Checking passphrase wallet for balances & transactions',
            subtitle: 'This might take up to a minute.',
        },
        confirmOnDevice: {
            title: 'Confirm passphrase\non your Trezor',
            description: 'Go to your device and confirm the passphrase you’ve entered.',
            warningSheet: {
                title: 'Cancel opening this passphrase wallet?',
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
                alertTitle: 'No one can recover your passphrase, not even Trezor support',
            },
            verifyEmptyWallet: {
                title: 'Confirm empty passphrase wallet',
                description: 'Re-enter your passphrase to open this wallet.',
                alertTitle:
                    '<bold>Create an offline backup of your passphrase. It is irrecoverable</bold>, even by Trezor support.',
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
            button: 'Proceed to passphrase wallet',
        },
        enablePassphrase: {
            title: 'Enable passphrase on your Trezor.',
            subtitle: 'Go to your device and confirm you’d like to enable passphrase.',
            cancelledError: 'Passphrase enabling canceled.',
        },
        passphraseFeatureUnlock: {
            title: 'Enter passphrase to continue',
        },
    },
    moduleSend: {
        accountsList: {
            title: 'Send',
        },
        outputs: {
            title: '{assetName} Send',
            correctNetworkMessage:
                'Make sure that you’re sending to an address\non {networkName} network. <link>Learn more</link>',
            tokenOfNetworkSheet: {
                title: 'You’re about to Send {tokenSymbol} that runs on {networkName} network.',
                body: {
                    self: {
                        subtitle: 'Sending to yourself?',
                        text: 'Make sure your exchange or wallet supports this token on {networkName} network.',
                    },
                    outside: {
                        subtitle: 'Sending to someone else?',
                        text: 'Check with them if they’re alright with receiving this token on {networkName} network.',
                    },
                },
                warning: 'Sending to a wrong network might result in loss of funds.',
            },
            recipients: {
                title: 'Recipient & amount',
                addressLabel: 'Recipient address',
                checksum: {
                    label: 'We’ve adjusted the casing of your address to match checksum format. <link>Learn more</link>',
                    alert: {
                        title: 'This address needs to be converted to checksum format.',
                        body: 'This will adjust the casing of your address to match checksum format and allow us to properly validate your address. <link>Learn more</link>',
                        primaryButton: 'Convert',
                    },
                },
                solAssociatedAccountAddress: {
                    label: "You're sending funds to an associated account, such as a token or staking account. <link>Learn more</link>",
                    alert: {
                        title: 'Unable to verify address history. Check that the address is correct.',
                    },
                },
                addressQrLabel: 'Scan recipient address',
                amountLabel: 'Amount to be sent',
                maxButton: 'Send max',
                destinationTag: {
                    label: 'Memo/Destination tag',
                    warning:
                        'Online exchanges require this to identify your account. Get your memo/destination tag from your {network} account. Make sure you really don’t need it.',
                    info: 'Online exchanges require this to identify your account. Get your memo/destination tag from your exchange.',
                    linkText: '<link>What’s this?</link>',
                },
                smartContract: {
                    alert: {
                        title: 'This is a smart contract address.',
                        description:
                            'Accidentally sending to smart contract address may result in loss of funds.',
                        primaryButton: 'I understand',
                    },
                },
            },
        },
        tron: {
            accountActivationFee: 'Activation Fee',
            accountActivationFeeTitle: 'Activation fee',
            accountActivationFeeDescription:
                'New TRON accounts require a one-time 1 TRX network fee to activate.',
        },
        fees: {
            recipient: {
                singular: 'Recipient',
            },
            tron: {
                energyCount: '{count} energy',
                bandwidthCount: '{count} bandwidth',
            },
            custom: {
                addButton: 'Add custom fee',
                bottomSheet: {
                    title: 'Custom fee',
                    minimumLabel: 'The minimum fee rate is {feePerUnit}',
                    label: {
                        feeRate: 'Fee rate',
                        gasLimit: 'Gas limit',
                        gasPrice: 'Gas price',
                        maxFeePerGas: 'Max fee per gas',
                        maxPriorityFeePerGas: 'Max priority fee per gas',
                    },
                    total: 'Total fee',
                    confirmButton: 'Confirm custom fee',
                },
                card: {
                    label: 'Custom',
                    ethereumValues: 'Limit: {gasLimit} • Price: {gasPrice}',
                },
            },
            error: 'You don’t have enough balance to use this fee.',
            amount: 'Amount',
            totalAmount: 'Total amount',
            submitButton: 'Review and sign',
        },
        coinControl: {
            cta: 'Coin control',
            title: 'Coin control',
            search: {
                placeholder: 'Search for address or transaction ID',
                noCoins: 'No coins',
                message: 'Check the spelling or try again',
            },
            notEnoughCoins: 'Select additional coins to match amount or turn off coin control',
            utxos: {
                selected: 'Selected',
                remaining: 'Remaining to select',
                showDetails: 'Show details',
            },
            disable: {
                title: 'Turn off Coin Control?',
                description:
                    'Trezor Suite will automatically select coins that match the amount you want to send.',
                primaryButton: 'Turn off',
                secondaryButton: 'Cancel',
            },
        },
        review: {
            confirmOnDeviceMessage: 'Go to your Trezor and confirm the amounts & recipients.',
            deviceDisconnectedAlert: {
                title: 'Your Trezor has been disconnected',
                description: 'Reconnect your Trezor to continue.',
                primaryButton: 'Reconnect Trezor',
            },
            destinationTagTitle: 'Check & confirm XRP destination tag on your Trezor.',
            toasts: {
                sendTxnFailed: 'Failed to send transaction',
            },
            address: {
                title: 'Before you confirm on your Trezor',
                step1: 'Go to the app or place where you originally got the address.',
                step2: 'Compare the original address with what’s on your Trezor.',
                step3: 'If they match exactly, confirm on your Trezor.',
                originBottomSheet: {
                    title: 'What’s the place of origin?',
                    subtitle: 'Think of how you’ve initially retrieved the address.',
                    exchange: {
                        header: 'Online exchange',
                        body: 'The original address can be found in the “receive” or “deposit” section of your online exchange.',
                    },
                    person: {
                        header: 'Person or a friend',
                        body: 'If you got it from a friend or a person, they’ve likely sent it to you through some messaging platform.',
                    },
                },
                compareBottomSheet: {
                    why: {
                        header: 'Why compare?',
                        body: 'Checking your Trezor against the original address is the only truly secure way of checking for any mistake or breach.',
                    },
                    how: {
                        header: 'How to compare?',
                        body: 'Always check both addresses against each other. Character for character, end to end.',
                    },
                },
            },
            outputs: {
                title: 'Review with Trezor',
                submitButton: 'Send transaction',
                errorAlert: {
                    secondaryButtonTitle: 'I’ll do it later',
                    generic: {
                        title: 'Transaction failed',
                        description:
                            'There has been an unexpected error, please try sending your transaction again.',
                    },
                    solana: {
                        title: 'Transaction failed due to timeout',
                        description:
                            'Make sure you send the transaction within 1 minute from signing.',
                    },
                },
            },
        },
    },
    moduleAuthenticityChecks: {
        deviceCompromised: {
            title: 'Your device may have been compromised',
            subtitle: {
                fwRevision: "Your Trezor's firmware authenticity check failed.",
                deviceAuthenticity: 'Your device authentication check failed.',
                deviceId: 'The security check (ID validity check) failed.',
                invariability: 'Your Trezor’s model or color appears to have been manipulated.',
                entropy: 'Security check (entropy verification) failed.',
            },
            steps: {
                disconnectDevice: 'Disconnect your device from your phone.',
                avoidUsingDevice: 'Avoid using this device or sending any funds to it.',
                contactSupport: 'Continue to Trezor support and use the Chat option.',
            },
            buttonContactSupport: 'Contact Trezor Support',
        },
    },
    earn: {
        staking: 'Staking',
        stablecoinYield: 'Stablecoin yield',
        vaultName: '{vaultName} Vault',
        portfolioTracker: {
            alert: {
                title: 'Staking is disabled in the portfolio tracker',
                description:
                    'Connect your device to enable full functionality or use our desktop app.',
                copyLabel: 'Tap to copy',
            },
        },
        instantStakeBanner: {
            stakedTitle: '{amount} {displaySymbol} staked instantly',
            unstakedTitle: '{amount} {displaySymbol} unstaked instantly',
            claimedTitle: '{amount} {displaySymbol} claimed',
            stakedDescription:
                "You've instantly staked {amount} {symbol}. {days, plural, =0 {} one {The remaining {symbol} will be staked within # day.} other {The remaining {symbol} will be staked within # days.}}",
            unstakedDescription:
                "You've received {amount} {symbol} instantly. {days, plural, =0 {} one {The remaining is paid out within # day.} other {The remaining is paid out within # days.}}",
            claimedDescription: "You've successfully claimed {amount} {symbol} from your stake.",
        },
        stakingDetailScreen: {
            title: 'Staking',
        },
        stakingManagementScreen: {
            yourStake: 'Your stake',
            stakedLabel: 'Staked',
            totalRewardsLabel: 'Total rewards',
            autoRestakedBadge: 'Auto-restaked',
            nextRewardLabel: 'Next reward in {value, plural, one {# day} other {# days}}',
            unstakeButton: 'Unstake',
            stakeButton: 'Stake',
            stakeMoreButton: 'Stake more',
            stakingHistory: 'Staking history',
            pendingActions: 'Pending actions',
            instantUnstakeBanner: {
                title: '{amount} {symbol} unstaked instantly',
                descriptionWithDays:
                    "You've received {amount} {symbol} instantly. The remaining is paid out within {days, plural, one {# day} other {# days}}.",
                descriptionWithoutDays: "You've received {amount} {symbol} instantly.",
            },
            claim: {
                readyToClaim: '{amount} unstaked, ready to be claimed',
                claimButton: 'Claim',
            },
            unstakingItem: {
                label: 'Unstaking (~{days, plural, one {# day} other {# days}})',
                modalTitle: 'Unstaking',
            },
            pendingStakesItem: {
                label: 'Pending stake',
                modalTitle: 'Pending stake',
            },
            pendingItemModal: {
                gotIt: 'Got it',
                stepTransactionConfirmed: 'Transaction confirmed',
                stepEntryPeriod: 'Entry period (~{days, plural, one {# day} other {# days}})',
                stepStakedReceivingRewards: 'Staked & receiving rewards',
                stepWithdrawalPeriod:
                    'Withdrawal period (~{days, plural, one {# day} other {# days}})',
                stepReadyToClaim: 'Ready to claim',
            },
        },
        stakingInsufficientBalance: {
            title: "You don't have enough {displaySymbol} balance",
            subtitle: 'The minimum amount for staking is {minAmount} {displaySymbol}',
            getButton: 'Get {displaySymbol}',
        },
        stakingAccountSelection: {
            title: 'Choose account',
        },
        earnConsentsScreen: {
            title: 'Before you continue',
            entryPeriodCard: {
                title: 'Entry period',
                firstItem: 'The entry period can currently take up to 72 days.',
                secondItem: 'You can not cancel your stake during this period.',
            },
            delegatingCard: {
                title: 'Delegating to Everstake',
                firstItem:
                    "Staking transfers the direct control of your {displaySymbol} from your Trezor device to Everstake's smart contract environment.",
                secondItem: 'Everstake maintains and secures your funds.',
            },
        },
        earnTransactionDataReviewScreen: {
            title: 'Review with Trezor',
            successMessage: 'You’re all set.',
            viewTransactionButton: 'Stake now',
            pushTransactionFailedAlert: {
                title: 'Transaction failed',
                description: 'Failed to submit your stake transaction. Please try again.',
                primaryButton: 'Go to home',
            },
            pendingTransactionConflictAlert: {
                title: 'Pending transaction detected',
                description:
                    'A stake transaction is already pending for this account. Please wait for it to be confirmed before staking again.',
                primaryButton: 'Go to home',
            },
        },
        unstakeTransactionDataReviewScreen: {
            title: 'Review with Trezor',
            successMessage: "You're all set.",
            viewTransactionButton: 'Unstake now',
            pushTransactionFailedAlert: {
                title: 'Transaction failed',
                description: 'Failed to submit your unstake transaction. Please try again.',
                primaryButton: 'Go to home',
            },
            pendingTransactionConflictAlert: {
                title: 'Pending transaction detected',
                description:
                    'An unstake transaction is already pending for this account. Please wait for it to be confirmed before unstaking again.',
                primaryButton: 'Go to home',
            },
        },
        earnUnstakeOutputItem: {
            title: 'Unstake',
            description: 'Unstake {displaySymbol} from stake account?',
        },
        earnStakeOutputItem: {
            title: 'Stake',
            description: 'Stake {displaySymbol} on Everstake?',
        },
        earnSummaryOutputItem: {
            title: 'Total including fee',
        },
        claimOutputItem: {
            title: 'Claim',
            description: 'Claim {displaySymbol} from account?',
        },
        claimSummaryOutputItem: {
            title: 'Total including fee',
        },
        earnFormScreen: {
            title: '{assetName} staking',
            unstakeTitle: 'Unstake {displaySymbol}',
            availableBalance: 'Available balance',
            unstakingTimeline: 'Unstaking timeline',
            unstakingPeriodInfo:
                'The unstaking period is currently {days, plural, one {~# day} other {~# days}}',
            networkFeeWarning:
                'Network fees may exceed this amount. Your balance may decrease. Enter higher amount.',
            reviewAndSign: 'Review & Sign',
            amountLabel: 'Amount',
            stakeMaxButton: 'Stake max',
            unstakeMaxButton: 'Unstake max',
            withdrawalFeesBanner:
                "We've left {amount} {displaySymbol} in your account so you can pay for withdrawal fees.",
            estimatedRewardsLabel: 'Estimated yearly rewards',
            estimatedRewardsPlaceholder: 'To be calculated',
            validation: {
                amountIsZero: 'Amount must be greater than 0.',
                amountBelowMinimum: 'Amount must be at least {amount} {symbol}.',
                amountExceedsMax: 'The amount exceeds the maximum allowed value of {maxAmount}.',
                insufficientBalance: "You don't have enough balance to stake this amount.",
                feeBufferReserve: 'Not enough funds left after we reserve for withdrawal fees.',
                tooManyDecimals: 'Too many decimals.',
            },
        },
        unstakeFormScreen: {
            validation: {
                amountIsZero: 'Amount must be greater than 0.',
                amountExceedsMax: 'The amount exceeds the maximum allowed value of {maxAmount}.',
                insufficientBalance: "You don't have enough staked balance to unstake this amount.",
                tooManyDecimals: 'Too many decimals.',
            },
        },
        unstakeFlowScreen: {
            instantlyAvailable: {
                label: 'Instantly available (est.)',
                infoTitle: 'Instantly available (estimate)',
                infoDescription:
                    'The liquidity of the staking pool can allow for instant unstake of some funds. The remaining funds will follow the unstaking period.',
            },
        },
        earnScreen: {
            title: 'Earn',
            otherOpportunities: 'Other opportunities',
            depositsCard: {
                title: 'Your deposits',
                stablecoin: 'Stablecoin',
                networkStaking: '{networkName} staking',
            },
            activeSheet: {
                stakingTitle: 'Your stakes',
                stablecoinYieldTitle: 'Your yields',
            },
            chooseAccountSheet: {
                title: 'Choose account',
            },
            earnItem: {
                rewards: 'Rewards',
                pending: 'Activation pending',
            },
            infoModal: {
                title: 'Manage {earnType} in Trezor Suite for desktop',
                subtitle: 'Go to the link below on your computer and download the desktop app.',
                copyLabel: 'Hold to copy',
            },
            enableNetworkModal: {
                title: 'Enable {networkName} to start staking',
                subtitle:
                    'Support the {networkName} network. Lock in your funds and earn staking rewards.',
                cta: 'Enable {networkName}',
            },
            adaInfo: 'Your ADA stays fully accessible while earning rewards.',
            unstakeButton: 'Unstake',
            subtitle: 'Staking can be currently managed only in Trezor Suite for desktop.',
        },
        howStakeWorksScreen: {
            title: 'How {displaySymbol} staking works?',
            subtitle:
                'Support the {networkName} network. Lock in your funds and earn staking rewards.',
            infoBannerTitle: '<b>{totalStakedAmount}</b> currently staked with Trezor',
            benefits: {
                first: {
                    title: 'Earn up to ~{potentialRewards} {displaySymbol} annually',
                    description: 'When staking your total {displaySymbol} balance',
                },
                second: {
                    title: 'Compounds automatically',
                    description: 'Rewards are re-staked for you',
                },
                third: {
                    title: 'Put your {displaySymbol} to work',
                    description: 'Enjoy weekly growth while you hold',
                },
            },
            timelineCardTitle: 'Staking timeline',
            timelineBottomSheetTitle: 'Staking timeline & fees',
            stakingTimelineTitle: 'Staking',
            stakingTimeline: {
                first: {
                    title: 'Sign staking transaction',
                    description: 'Network fee',
                },
                second: {
                    title: 'Entry period',
                    description: '~{entryPeriod} days',
                },
                third: {
                    title: 'Receive weekly rewards',
                    description: '~{apy}% yearly',
                },
            },
            unstakeTimelineTitle: 'Unstake',
            unstakeTimeline: {
                first: {
                    title: 'Sign unstaking transaction',
                    description: 'Network fee',
                },
                second: {
                    title: 'Leave staking pool',
                    description: '~{unstakingPeriod} days',
                },
                third: {
                    title: 'Claim unstaked {symbol}',
                    description: 'Network fee',
                },
                fourth: {
                    title: 'Receive {symbol} in your account',
                    description: 'Instantly',
                },
            },
        },
        staked: 'Staked',
        stakedAutomatically: 'Staked automatically',
        fullBalance: 'Full balance',
        rewards: 'Rewards',
        rewardsPerEpoch: 'Next estimated reward',
        apy: 'Annual percentage yield',
        stakingCanBeManaged: 'Staking can be currently managed only in',
        trezorDesktop: 'Trezor Suite for desktop or web.',
        adaStaysFullyAccessuble: 'Your ADA stays fully accessible while earning rewards.',
        infoBanner: {
            updateProviderTitle: 'Save your ADA rewards by updating your staking provider',
            updateProviderButton: 'Update provider',
            providerReducingRewards:
                "You're earning nearly 0% in ADA rewards right now. Switch to Everstake to earn up to {apy}% APY. Your funds and past rewards are safe.",
            updateToNewProvider:
                'Update to our new provider, Everstake, and earn ~{apy}% APY. Your ADA with our previous provider is safe, and your rewards stay intact, though rates aren’t guaranteed.',
            rewardsReduced: 'Cardano staking rewards reduced',
        },
        notAvailable: 'Not available',
        apyNotAvailable: 'APY not available',
        apyPercentage: '~{apy}% APY',
        notAvailableShort: 'N/A',
        stakePendingCard: {
            totalStakePending: 'Total stake pending',
            addingToStakingPool: 'Adding to staking pool',
            activatingStake: 'Activating stake',
            totalStakeActivating: 'Total stake activating',
            transactionPending: 'Transaction pending',
            unknownStatus: 'Unknown status',
        },
        claimReviewScreen: {
            title: 'Claim {displaySymbol}',
            reviewAndSignButton: 'Review & Sign',
            amountLabel: 'Amount',
            instantClaimBanner: "You'll claim the {displaySymbol} instantly",
        },
        claimTransactionDataReviewScreen: {
            title: 'Review with Trezor',
            successMessage: "You're all set.",
            viewTransactionButton: 'Claim now',
            pushTransactionFailedAlert: {
                title: 'Transaction failed',
                description: 'Failed to submit your claim transaction. Please try again.',
                primaryButton: 'Go to home',
            },
            pendingTransactionConflictAlert: {
                title: 'Pending transaction detected',
                description:
                    'A claim transaction is already pending for this account. Please wait for it to be confirmed before claiming again.',
                primaryButton: 'Go to home',
            },
        },
        claimableCard: {
            claimable: 'Claimable',
            claimButton: 'Claim',
            readyToClaim: '{amount} ready to be claimed',
        },
        stakingBottomSheet: {
            title: 'To manage your staked funds, please use Trezor Suite for desktop.',
            description: 'We currently support staking as view-only in Trezor Suite.',
        },
    },
    moduleTrading: {
        providerSheet: {
            title: 'Providers',
            fixed: {
                title: 'Fixed-rate CEX',
                description: 'Lock in your rate for 15 minutes by paying a higher fee.',
            },
            float: {
                title: 'Floating-rate CEX',
                description: 'Get an estimated rate that may adjust with real-time market changes.',
            },
            dex: {
                title: 'DEX',
                description:
                    'A decentralized exchange (DEX) allows you to trade {coinLabel} directly on the blockchain without the need for a central authority or intermediary.',
            },
            filters: {
                all: 'All',
                cex: 'CEX',
                dex: 'DEX',
            },
            noProviders: 'No offers available.',
        },
        kyc: {
            dex: 'KYC never required. DEX swaps either succeed or fail.',
            noKyc: 'KYC never required. Exceptional cases automatically refunded.',
            noRefund: 'KYC is only requested in exceptional cases. KYC required for refunds.',
            yesRefund: "KYC is only requested in exceptional cases. It's not required for refunds.",
            kycRequired: 'This provider requires to verify identity.',
        },
        tradingScreen: {
            buyTitle: 'Buy',
            receiveAccount: 'Receive account',
            receiveMethod: 'Receive method',
            paymentMethod: 'Payment method',
            noPaymentMethod: 'No payment method selected',
            noReceiveMethod: 'No receive method selected',
            selectedProvider: 'Selected provider',
            noProvider: 'No provider selected',
            selectedPaymentMethod: 'Selected payment method',
            selectedReceiveMethod: 'Selected receive method',
            provider: 'Provider',
            quotesLoadingLabel: 'Fetching offers...',
            rate: 'Rate',
            selectedRate: 'Selected rate',
            footer: {
                termsAndConditionsProvider:
                    "Trezor doesn't provide this service. It's governed by <link>{companyName}'s Terms & Conditions</link>.",
                termsAndConditionsGeneral:
                    "Trezor doesn't provide this service. It's governed by provider's Terms & Conditions.",
                termsOfUse: "Trezor's Terms of Use",
                learnMore: 'Learn more',
                termsAndConditionsGeneric:
                    'This service is offered by a third-party provider, not Trezor. Provider’s terms apply.',
                howTradingWorksSheet: {
                    title: 'How trading works',
                    sheetTitle: 'How trading with Trezor works',
                    item1: 'Trezor compares trusted exchange providers to find the best offer',
                    item2: 'Providers use your location only to show relevant offers',
                    item3: 'Trezor never sees your payment or KYC data\n<text>You share it only with the exchange if you complete the trade.</text>',
                    item4: 'How fees are calculated',
                    item5: 'Trezor’s Terms of Use',
                },
            },
            balance: 'Balance:',
            providerOffer: 'Provider offer: {amount}',
            tabs: {
                buy: 'Buy',
                sell: 'Sell',
                exchange: 'Swap',
                settings: 'Advanced settings',
            },
            kycWarning: 'This provider requires to know your identity.',
            buttons: {
                continue: 'Continue',
                swap: 'Swap',
                approveAndSwap: 'Approve and swap',
                revoke: 'Revoke approval',
            },
            countryOfResidence: 'Country of residence',
            noCountryOfResidence: 'No country of residence selected',
            selectedCountryOfResidence: 'Selected country of residence',
        },
        selectFiat: {
            sell: {
                title: 'You get',
                amountLabel: 'You get',
            },
            buy: {
                title: 'You pay',
                amountLabel: 'You pay',
            },
            buttonTitle: 'Select fiat currency',
        },
        selectCoinToSell: {
            title: 'You pay',
            buttonTitle: 'Select asset',
            amountLabel: 'You pay',
        },
        selectCoin: {
            title: 'You get',
            buttonTitle: 'Select asset',
            amountLabel: 'You get',
        },
        selectRate: {
            fixed: 'Fixed',
            floating: 'Floating',
            dex: 'DEX',
        },
        fiatCurrencySheet: {
            title: 'Currency',
            emptyTitle: 'Currency not found',
            emptyDescription: 'Check the spelling or browse the list to select an option.',
            searchInputPlaceholder: 'Search country or ticker',
        },
        tradeableAssetsSheet: {
            title: 'Assets',
            favouritesTitle: 'Favourites',
            allTitle: 'All assets',
            favouritesAdd: 'Add to favourites',
            favouritesRemove: 'Remove from favourites',
            emptyTitle: 'Coin not found',
            emptyDescription: 'Check the spelling or browse the list to select an option.',
            searchInputPlaceholder: 'Search tokens or address',
        },
        accountScreen: {
            accountEmpty: {
                viewOnly: {
                    title: 'Account not found',
                    description: 'You need to connect your device to add new account.',
                },
                networkNotEnabled: {
                    title: 'Account not found',
                    description:
                        'It seems that you don’t have any account matching selected asset.',
                },
                portfolioTracker: {
                    title: 'Account not found',
                    description:
                        'You don’t have an account for this asset imported in Portfolio Tracker.',
                },
            },
            addressEmpty: {
                title: 'Address not found',
                description: 'Check the spelling or browse the list to select an option.',
            },
            titleStep1: 'Select account',
            newAddress: 'New address',
            usedAddresses: 'Used addresses',
            step2Hint: 'Select to display account addresses',
            balanceFiat: 'Balance in fiat',
            balanceCrypto: 'Balance in {coinLabel}',
        },
        validators: {
            min: 'Minimum is {min}',
            max: 'Maximum is {max}',
            noQuotes: 'No offers available for your request. Change amount or currency.',
            insufficientBalance: 'Insufficient balance',
            networkReserve: 'Not enough {displaySymbol} after network fees',
        },
        tradingExchangePreviewScreen: {
            title: 'Swap',
            fromAccount: 'From',
            toAccount: 'To',
            details: 'Transaction details',
            providerNamePlaceholder: 'Provider',
            providerReceiveAddressLabel: "{providerName}'s receive address",
            confirmationAlertTitle: 'Failed to confirm offer.',
            approvalSuccessAlert: 'Spending approval confirmed.',
            fusionPlusInfo: {
                title: 'You are swapping with 1Inch Fusion+',
                bullet1: 'Simply sign the order - no need to send transactions manually',
                bullet2: 'No gas fees - the smart contract handles everything for you',
                bullet3: 'Your swap might be partially filled based on the market conditions',
            },
            fiatDeviationWarning: 'Receiving {percent} less in estimated value.',
            feeLabel: 'Fee',
        },
        tradingSellPreviewScreen: {
            title: 'Sell',
            fromAccount: 'From',
            toFiat: 'To',
            paymentMethods: {
                bankTransfer: 'Bank Transfer',
                creditCard: 'Credit/Debit Card',
                sepa: 'SEPA',
                ach: 'Automated Clearing House',
                skrill: 'Skrill',
                neteller: 'Neteller',
                payid: 'PayID',
                dcinterac: 'Interac',
                fasterPayment: 'Faster Payment System',
            },
            bankAccount: 'Bank account',
            verified: 'Verified',
            notVerified: 'Not verified',
            bankAccountSheetTitle: {
                title: 'Select an account',
            },
            providerStatus: {
                confirming: 'Provider is confirming your sell',
                waitingForAddress: 'Waiting for the provider’s receive address',
                upTo30Seconds: 'This may take up to 30 seconds.',
                startOver:
                    'If you didn’t finish all steps on the provider’s site, go back and start a new sell. Your funds are safe.',
                cannotBeCompletedAlert: {
                    title: 'Your sell couldn’t be completed',
                    description:
                        'We didn’t receive confirmation from the provider. Your funds are safe in your account.',
                    button: 'Start a new sell',
                },
            },
        },
        composeAllowanceError: 'Failed to estimate approval fees. Please try again.',
        confirmApprovalError: 'Failed to confirm approval. Please try again.',
        tradingExchangeApprovalScreen: {
            title: 'Set {symbol} spending',
            approveTitle: 'Approve {symbol} spending',
            subtitle:
                'Set the {symbol} amount to approve so {companyName} can access it. This is required to continue with your swap.',
            approveSubtitle: 'Approve provider to spend your {symbol} to swap.',
            revokeSuccessAlert: 'Revoke successful. Set a higher limit.',
            lowLimitInfoAlert:
                'You’ve approved this token, but the limit is too low. Increase it to continue.',
            for: 'For',
            approvalDetailsTitle: 'Approval details',
            limitLabel: 'Limit',
            currentLimitLabel: 'Current limit',
            newLimitLabel: 'New limit',
            unlimitedLabel: 'Unlimited',
            limitInfo:
                'Skip future approvals and pay less fees. {companyName} will gain full access to your {symbol}.',
            approveErrorAlert: 'Error approving token. Please try again later.',
        },
        tradingExchangeRevokeScreen: {
            title: 'Revoke {symbol} approval',
            revokeTitle: 'Revoke {symbol} spending',
            revokeSubtitle: 'Revoke provider to spend your {symbol} to swap.',
            subtitle:
                'This stops the provider from using your {symbol}. You’ll need to approve again to swap.',
            infoAlert:
                'The approved amount is too low. To increase it, first revoke the current approval, then set a higher limit.',
            lowLimitInfoAlert:
                'The spending limit too low. Revoke the current spending limit and approve a higher amount.',
            from: 'From',
            details: 'Details',
            currentLimit: 'Current limit',
            newLimit: 'New limit',
            limitLabel: 'Limit',
            unlimited: 'Unlimited',
            revokeErrorAlert: 'Error revoking spending limit. Please try again later.',
        },
        tradingFeesScreen: {
            title: 'Fee picker',
        },
        tradingReviewOutputs: {
            title: 'Review with Trezor',
            submitButton: 'Send transaction',
        },
        tradingConfirmationScreen: {
            approveHeaderTitle: 'Approve {symbol} spending',
            revokeHeaderTitle: 'Revoke {symbol} approval',
            approveTitle: 'Confirming approval',
            revokeTitle: 'Confirming revoke',
            subtitle: 'This may take a few moments.',
            pending: 'Pending',
            error: 'Error confirming transaction. Please try again.',
            date: 'Date',
            exploreInBlockchain: 'Explore in blockchain',
        },
        exchangeApprovalLimitSheet: {
            title: 'Set limit',
            unlimitedCard: {
                info: 'Approve once and avoid future network fees. This provider can spend any amount until you revoke the approval.',
                alert: 'If the provider is compromised, all your {coinSymbol} may be taken.',
                description:
                    'Approve unlimited {symbol} to skip future approval requests and reduce fees. Only use this option if you trust {companyName}, as it will have access to all your {symbol}.',
            },
            limitedCard: {
                info: 'Approve this amount for the provider. Valid until fully used or revoked. Then a new approval and network fee will be required.',
                description:
                    "Approve only the amount needed for this swap. This helps reduce risk, but you'll need to approve again (and pay a fee) for future swaps.",
            },
        },
        exchangeTradePreviewCard: {
            account: 'Account',
        },
        tradeHistory: {
            list: {
                title: 'Trade history',
            },
            button: {
                title: 'Trade history',
            },
            timeAt: '{date} at {time}',
            status: {
                badge: 'Trade status badge',
                loginRequest: 'Pending',
                requesting: 'Requesting',
                submitted: 'Submitted',
                approvalPending: 'Approval pending',
                waitingForUser: 'Waiting for user',
                success: 'Success',
                error: 'Rejected',
                blocked: 'Blocked',
                siteActionRequest: 'Site action requested',
                sendCrypto: 'Send {coinLabel}',
                pending: 'Pending',
                cancelled: 'Canceled',
                refunded: 'Refunded',
                loading: 'Loading',
                confirm: 'Confirm',
                sending: 'Sending',
                confirming: 'Confirming',
                converting: 'Converting',
                ApprovalRequired: 'Approval required',
                signData: 'Sign data',
                kyc: 'KYC',
            },
            transactionId: 'Trans. ID: {orderId}',
            detail: {
                paid: 'You paid',
                received: 'You get',
                toAccount: 'To',
                fromAccount: 'From',
                issued: 'Issued',
                provider: 'Provider',
                method: 'Via',
                orderId: 'Order id:',
                buttons: {
                    providerSupport: 'Go to provider support',
                    proceedToPay: 'Proceed to pay',
                },
                errorAlert: {
                    title: 'Transaction failed',
                    description:
                        'Your transaction failed or was rejected. Your payment method hasn’t been charged.',
                    button: 'Go to provider support',
                },
                waitingAlert: {
                    title: 'Waiting for your payment ...',
                    description: 'Click to complete your details on the provider’s site.',
                    button: 'Proceed to pay',
                },
                convertingAlert: {
                    title: 'Converting your crypto...',
                    description: 'Your swap is being processed. This may take a few minutes.',
                    button: 'Go to provider support',
                },
                kycAlert: {
                    title: 'Identity verification required',
                    description:
                        'Please complete the identity verification process to continue with your transaction.',
                    button: 'Go to provider support',
                },
                sendingAlert: {
                    title: 'Sending your crypto...',
                    description:
                        'Your transaction is being processed. Please wait for confirmation.',
                    button: 'Go to provider support',
                },
                pendingAlert: {
                    title: 'Transaction pending...',
                    description:
                        'Your sell transaction is being processed. Please wait for confirmation.',
                    button: 'Go to provider support',
                },
                buy: 'Buy',
                exchange: 'Swap',
                sell: 'Sell',
            },
        },
        error: {
            deviceOfflineDescription:
                'Trading needs an internet connection to be available. Check your mobile phone settings and try again.',
        },
        defaultSearchLabel: 'Search',
        notSelected: 'Not selected',
        networkName: 'Network name',
        coinName: 'Coin name',
        coinSymbol: 'Coin symbol',
        providerListItem: {
            rate: 'Rate',
            youGet: 'You get',
            decentralizedExchange: 'Decentralized exchange',
            centralizedExchange: 'Centralized exchange',
            anonymous: 'Anonymous',
            kycRequired: 'This provider requires to verify identity.',
        },
        myAssetSheet: {
            title: 'Your assets',
            emptyTitle: 'No assets found',
            emptyDescription: 'You do not have any assets available for this operation.',
            noPair: {
                note: 'No pair',
                toast: 'There is no pair for this asset',
            },
            nonTradeable: '+ {count} non-tradeable {count, plural, one{token} other{tokens}}',
        },
        advancedSettings: {
            slippage: {
                title: 'Maximum slippage',
                description:
                    "Set the maximum difference you're willing to accept. Higher means more likely to succeed, while lower may fail but protects your price.",
                confirm: 'Confirm custom slippage',
                inputLabel: 'Slippage',
                outOfRangeError: 'Slippage must be between 0.01% and 50%',
            },
        },
        countrySheet: {
            title: 'Country of residence',
            emptyTitle: 'Country not found',
            emptyDescription: 'Check the spelling or browse the list to select an option.',
            searchInputPlaceholder: 'Search country',
        },
        browser: {
            noURL: 'No URL provided',
            browserLocked: 'Browser is locked.',
            browserError: 'An error occurred while opening the browser.',
        },
    },
    notifications: {
        transaction: {
            incoming: 'Incoming transaction',
            confirmed: 'Received transaction',
            sending: 'Sending transaction',
        },
    },
    firmware: {
        title: 'Firmware',
        version: 'Version {firmwareVersion}',
        typeUniversal: 'Universal',
        typeBitcoinOnly: 'Bitcoin-only',
        updateNotAvailable: 'Firmware update disabled',
        seedBottomSheet: {
            title: 'It’s a good practice to check your backup before updating firmware.',
            description:
                'Although unlikely, a firmware update might fail. If this were to happen, you would need to access your assets with your wallet backup.',
            continueButton: 'I’ve checked it',
            checkBackupButton: 'Check backup',
        },
        versionCard: {
            title: 'Version',
            status: {
                upToDate: 'Up to date',
                updateAvailable: 'Update available',
                updateRequired: 'Update required',
            },
            currentFirmware: 'Current firmware',
            newFirmware: 'New firmware',
        },
        languageCard: {
            title: 'Language',
            betaBadge: 'Beta',
        },
        changeLanguage: {
            success: 'Language changed to {languageName}',
            failure: {
                title: 'Translation download failed',
                description: 'Check your internet connection and try again.',
            },
        },
        updateCard: {
            upToDate: 'Up to date',
            newVersionAvailable: 'New firmware is available.',
            updateButton: 'Update',
            updateToVersionAvailable: 'Update to version {firmwareVersion} available',
        },
        changelog: {
            button: "See what's new",
            title: "See what's new",
            changelogUnavailable: 'No changelog available',
        },
        firmwareInfoScreen: {
            title: {
                update: 'Firmware update',
                install: 'Firmware installation',
            },
            subtitle: "Firmware is your Trezor's operating system",
            list: {
                item1: {
                    update: 'This update will take some time to complete.',
                    install: 'This installation will take some time to complete.',
                },
                item2: '<b>Don’t leave or close the app</b> during installation. Doing so will corrupt the firmware.',
                item3: {
                    update: 'While the firmware is updating, <b>leave your phone as is</b>. It won’t shut off.',
                    install:
                        'While the firmware is installing, <b>leave your phone as is</b>. It won’t shut off.',
                },
            },
            installButton: 'Install now',
            updateButton: 'Update now',
            cancelButton: 'Cancel installation',
        },
        firmwareUpdateScreen: {
            updateFirmware: 'Update firmware',
            skipButton: 'Skip',
            title: 'Firmware update',
            subtitle: 'Firmware is your Trezor’s operating system.',
        },
        firmwareUpdateProgress: {
            generalSubtitle: 'Firmware is your Trezor’s operating system.',
            initializing: {
                title: 'Preparing your Trezor',
            },
            confirming: {
                title: 'Confirm firmware update on your Trezor',
            },
            restarting: {
                title: 'Restarting Trezor',
            },
            completed: {
                title: 'Firmware installed',
                subtitle: 'You’re all set.',
            },
            error: {
                title: 'Update failed',
            },
            doNotCloseApp: {
                alertBox: {
                    title: 'Keep the app open',
                    button: 'Why?',
                },
                alert: {
                    title: 'Leaving the app would corrupt the firmware and you’d need to start the installation over.',
                    button: 'Got it',
                },
            },
            trezorFacts: {
                '1': 'Born in Prague and created by SatoshiLabs, Trezor continues to stand proudly independent.',
                '2': 'In 2014, Trezor introduced the world’s first hardware wallet, the Trezor Model One.',
                '3': 'Trezor began as a side project in 2011, created by its founders, Stick and Slush.',
                '4': 'Trezor, which means "vault" in Czech, is designed with security at its core.',
                '5': 'Trezor’s hardware and firmware are completely open-source, giving you full transparency and control.',
                '6': 'Trezor’s initial prototypes were created on Raspberry Pi boards.',
                '7': 'Trezor played a key role in shaping industry wallet standards, including BIP-39 and BIP-44.',
                '8': 'Trezor co-founder Marek "Slush" Palatinus launched the very first Bitcoin mining pool.',
                '9': 'Since 2023, Trezor has taken direct control of its chip supply chain to enhance security.',
                '10': 'Trezor has earned the trust of users in over 150 countries worldwide.',
                '11': 'In January 2025, Trezor introduced the Trezor Safe 5 Freedom Edition, a limited release of just 2,100 devices.',
                title: 'Did you know?',
            },
            confirmOnDeviceMessage: 'Go to your device and confirm the firmware update.',
            retryButton: 'Retry',
            contactSupportButton: 'Contact support',
            stuckButton: 'Troubleshooting tips',
        },
        stuckedBottomSheet: {
            part1: {
                title: 'Make sure you have your wallet backup',
                description:
                    'Having your wallet backup is crucial as the troubleshooting might result in a corrupted state of firmware that will require reinstalling.',
                continueButton: 'I have my wallet backup ready',
                closeButton: 'Cancel',
            },
            part2: {
                title: 'Troubleshooting tips',
                subtitle: 'Try the steps below to continue installing the firmware.',
                gotItButton: 'Got it',
                tip1: 'Reconnect the cable to your phone',
                tip2: 'Try a different cable',
                tip3: 'Make sure the cable is not twisted and fits the connector properly.',
            },
        },
    },
    banner: {
        stellarLimitedHistoryBanner: {
            title: 'Transaction history limited to 12 months',
            description:
                'Only transactions from the past 12 months are available in this view. To explore older activity, use the blockchain explorer.',
            confirmButton: 'Got it',
        },
        solanaLimitedHistoryBanner: {
            title: 'Transaction history is limited to the last 100 transactions per token',
            description:
                'This view shows only the most recent 100 transactions for each token. To see the full history, please use the blockchain explorer.',
            confirmButton: 'Got it',
        },
    },
    atoms: {
        animatedDoubleView: {
            defaultSwitchLabel: 'Switch',
        },
    },
    transactionManagement: {
        networkReserveBanner: {
            title: 'We’ve reserved {amount} {displaySymbol} to cover any extra network fees.',
            buttonTitle: 'Manage',
        },
        fees: {
            levels: {
                low: 'Low',
                normal: 'Normal',
                high: 'High',
            },
            description: {
                title: {
                    general: 'Transaction fee',
                    ethereum: 'Maximum fee',
                    tron: 'Network fee',
                },
                body: 'Fees are paid directly to validators for processing your transactions.',
            },
            custom: {
                addButton: 'Add custom fee',
                bottomSheet: {
                    currentBaseFeeEthereum: 'Current base fee: {baseFee}',
                    title: 'Custom fee',
                    minimumLabel: 'The minimum fee rate is {feePerUnit}',
                    label: {
                        feeRate: 'Fee rate',
                        gasLimit: 'Gas limit',
                        gasPrice: 'Gas price',
                        maxFeePerGas: 'Max fee per gas',
                        maxPriorityFeePerGas: 'Max priority fee per gas',
                    },
                    errors: {
                        feeLimit: {
                            low: 'Gas limit must be at least {minGasLimit}',
                        },
                        decimals: 'Too many decimals.',
                        feePerUnit: {
                            low: 'Fee is too low.',
                            high: 'Fee is too high.',
                        },
                        maxFeePerGas: {
                            lessThanPriority: 'This fee can’t be lower than Max priority fee.',
                            outOfRange: 'Enter a max fee per gas between {minFee} and {maxFee}',
                        },
                        maxPriorityFee: {
                            min: 'Max priority fee must be at least {minPriorityFee}',
                            higherThanMaxFee: 'This fee can’t be higher than Max fee per gas',
                        },
                    },
                    total: 'Total fee',
                    confirmButton: 'Confirm custom fee',
                },
                card: {
                    label: 'Custom',
                    ethereumValues: 'Limit: {gasLimit} • Price: {gasPrice}',
                },
            },
            error: 'You don’t have enough balance to use this fee.',
            amount: 'Amount',
            totalAmount: 'Total amount',
            tabs: {
                standard: 'Standard fee',
                custom: 'Custom fee',
            },
            tron: {
                feeLimit: 'Fee Limit (SUN)',
                feeLimitBelowRecommended: 'Fee limit must be at least {minFeeLimit}',
            },
            confirmButton: 'Confirm fee',
            submitButton: 'Review and sign',
            total: 'Total fee',
        },
        review: {
            outputs: {
                addressLabel: 'Recipient address',
                amountLabel: 'Amount',
                destinationTagLabel: 'Destination tag',
                timeboundsLabel: 'TimeBounds',
                timeboundsNotSet: 'No restriction',
                destinationTagNotSet: "Memo/Destination tag isn't set",
                networkLabel: 'Network',
                networkTestnet: 'Transaction is on testnet network',
                signingWithLabel: 'Signing with',
                contractLabel: 'Token address',
                approveLabel: 'Approve',
                revokeLabel: 'Revoke',
                tokenApprovalLabel: 'Token approval',
                tokenRevocationLabel: 'Token revocation',
                tokenApprovalDescription: 'Review details to approve token spending.',
                tokenRevocationDescription: 'Review details to revoke token approval.',
                approveToLabel: 'Approve to',
                revokeApprovalFromLabel: 'Revoke approval from',
                amountAllowanceLabel: 'Amount allowance',
                chainLabel: 'Chain',
                tokenLabel: 'Token',
                feeLimitLabel: 'Fee Limit',
                feeLimitSummaryLabel: 'Summary',
                summary: {
                    label: 'Total including fee',
                    totalAmount: 'Total amount',
                    amount: 'Amount',
                    fee: 'incl. Transaction fee',
                    maxFee: 'Maximum fee',
                },
                noAccount: 'Account not found.',
                signSuccessMessage: 'Everything is ready, you can send the transaction now.',
            },
            cancelAlert: {
                title: 'Cancel transaction?',
                continueButton: 'Continue editing',
            },
        },
        precomposedTransaction: {
            errors: {
                amountNotEnoughCurrencyFee:
                    'Insufficient {networkDisplaySymbol} to cover the transaction fee.',
                amountIsNotEnough: "You don't have enough funds.",
                amountIsTooLow: 'Amount is too low.',
                amountIsLessThanReserve: 'Recipient account requires minimum reserve to activate.',
                stakeNotEnoughFunds: 'Insufficient funds for staking.',
                remainingBalanceLessThanRent:
                    'After sending this amount, your account will have SOL remaining lower than the rent.',
                amountNotEnoughCurrencyFeeWithEthAmount:
                    'Insufficient {networkDisplaySymbol} to cover the transaction fee.',
            },
        },
    },
    navigation: {
        tabs: {
            home: 'Home',
            accounts: 'My assets',
            earn: 'Earn',
            trade: 'Trade',
            settings: 'Settings',
        },
    },
    tradingAtoms: {
        error: {
            deviceOfflineTitle: 'Trading is not available offline',
            deviceOfflineDescription:
                'Trading needs an internet connection to be available. Check your mobile phone settings and try again.',
            serverOfflineTitle: "It's not you, it's us.",
            serverOfflineDescription:
                'Something is wrong on our end. Please, wait a minute or try again later.',
            serverOfflineRetry: 'Try again',
            tradingTypeDisabledTitle: '{tradingType} disabled',
            viewOnlyWalletTitle: 'View-only wallet',
            viewOnlyWalletDescription:
                'Selling & swapping are disabled. Connect your device to enable full functionality.',
            portfolioTrackerTitle: 'Portfolio Tracker',
            portfolioTrackerDescription:
                'Selling & swapping are disabled. Connect your device to enable full functionality.',
            btcOnlyFirmwareTitle: 'Bitcoin-only firmware',
            btcOnlyFirmwareDescription:
                'Swapping is unavailable with Bitcoin-only firmware. To enable, switch to universal firmware.',
            notAvailableInCountryTitle: 'Trading is not yet available in your country',
        },
        providerLogo: 'Provider logo',
        quotesLoadingLabel: 'Fetching offers...',
        networkName: 'Network name',
    },
    tradingResidence: {
        locationSettings: {
            title: 'Trading is now available',
            description:
                'Swap and buy crypto directly on your phone.  Availability varies by location. Select your country to continue. Change this anytime in settings.',
            tradingAvailable: 'Trading is available',
            tradingUnavailable: "Trading isn't available",
            confirmButton: 'Confirm location',
            skipButton: 'Not now',
            countryOfResidence: 'Country of residence',
            noCountryOfResidence: 'No country of residence selected',
            selectedCountryOfResidence: 'Selected country of residence',
            notSelected: 'Not selected',
        },
        countrySheet: {
            title: 'Country of residence',
            emptyTitle: 'Country not found',
            emptyDescription: 'Check the spelling or browse the list to select an option.',
            searchInputPlaceholder: 'Search country',
        },
    },
    moduleDemoAccountQuestionnaire: {
        intro: {
            title: 'Help improve Trezor Suite',
            subtitle:
                'We have two questions that will help us provide you with a better experience.',
            note: "It's anonymous and will take less than a minute.",
            primaryCta: 'Sure, continue',
            secondaryCta: "I'm not interested",
        },
        reason: {
            title: 'Why did you download Trezor Suite?',
            options: {
                considering: "I'm considering a hardware wallet",
                ad: 'I saw an ad online',
                friend: 'A friend told me about Trezor',
            },
        },
        suiteAction: {
            title: 'What did you hope to do in Trezor Suite?',
            options: {
                explore: 'I wanted to explore the app, its interactions, and its design.',
                transaction: 'I wanted to try to send and receive cryptocurrencies.',
                hardwareWallet:
                    'I wanted to understand how a hardware wallet works with Trezor Suite.',
            },
        },
        noneOption: 'None of the above',
        success: {
            title: 'Thanks for your help.',
            subtitle:
                'Your responses will help us prepare the best mobile experience for users like you.',
            recommendationsHeading: 'You might also be interested in:',
            recommendations: {
                hardwareWallet: 'What is a hardware wallet?',
                trezorSecurity: 'Why is Trezor secure?',
                trezorSafe7: 'Get to know the new Trezor Safe 7',
            },
            backCta: 'Back to dashboard',
        },
    },
    moduleClipboard: {
        copiedToClipboard: 'Copied to clipboard',
    },
    moduleStellarToken: {
        screenTitle: {
            activateToken: 'Activate token',
            deactivateToken: 'Deactivate token',
        },
        accountDetail: {
            activateToken: 'Activate token',
            deactivateToken: 'Deactivate token',
        },
        tokenSelection: {
            title: 'Select token',
            subtitle: 'Activate a token below to receive it or trade it.',
            searchPlaceholder: 'Search token or address',
            activateManually: 'Activate token manually',
            noResults: 'No tokens found',
        },
        tokenDetail: {
            issuer: 'Issuer',
            issuerAddress: 'Issuer address',
            unknownIssuer: 'Unknown',
        },
        networkFee: {
            token: 'Token',
            reserveInfo: 'This will increase your <link>reserved balance</link> by {reserve}.',
            reviewAndSign: 'Review and sign',
            activationFailed: 'Activation Failed',
            activationFailedDescription: 'Failed to activate token. Please try again.',
            unexpectedError: 'An unexpected error occurred. Please try again.',
            insufficientBalance:
                'Insufficient funds. You need {required} but only have {available} available.',
        },
        manualInput: {
            title: 'Activate token manually',
            subtitle: 'You can activate any token if you know its asset code and issuer address.',
            assetCode: 'Asset code',
            assetCodePlaceholder: 'e.g. SHX',
            assetCodeError: 'Invalid asset code. Enter 1-12 alphanumeric characters.',
            issuerAddressPlaceholder: 'e.g. GARDNV3Q...',
            issuerAddressError: 'Invalid issuer address. Enter a valid Stellar address.',
        },
        deactivationFee: {
            warningText:
                "You won't be able to receive, send, or trade this token until you activate it again. Deactivation makes the {reserve} reserve available for use.",
            deactivationFailed: 'Deactivation Failed',
            deactivationFailedDescription: 'Failed to deactivate token. Please try again.',
            cantDeactivateTitle: "You can't deactivate a token with a balance",
            cantDeactivateDescription:
                'You need to transfer or convert your balance to zero first. Try selling for XLM.',
        },
    },
};
