// Few rules:
// 1. Never use dynamic keys IDs for example: translate(`module.graph.coin.${symbol}`) instead map it to static key: { btc: translate('module.graph.coin.btc') }
// 2. Don't split string because of formatting or nested components use Rich Text Formatting instead https://formatjs.io/docs/react-intl/components#rich-text-formatting
// 3. Always wrap keys per module/screen/feature for example: module.graph.legend

export const messages = {
    generic: {
        trezorSuite: 'Trezor Suite',
        buttons: {
            cancel: 'Cancel',
            close: 'Close',
            confirm: 'Confirm',
            continue: 'Continue',
            done: 'Done',
            dismiss: 'Dismiss',
            eject: 'Eject',
            enable: 'Enable',
            gotIt: 'Got it',
            next: 'Next',
            retry: 'Retry',
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
                    "Firmware authenticity check couldn't be performed.\nConnect to the internet to verify your firmware version.",
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
                        "A wallet backup is essential for recovering your assets. Don't send or receive funds with this device until you've created a backup.",
                    cta: 'Create wallet backup',
                },
            },
            outOfSuiteSyncQuota: {
                title: 'Suite Sync storage is full',
                subtitle:
                    'New labels will be saved locally on this phone, but not synced to your other devices.',
                cta: 'Contact Trezor Support',
                dismiss: 'Dismiss',
            },
        },
        tokens: '+ Tokens',
        warning: 'Warning',
    },
    icons: {
        networkIconHint: 'Network Icon',
        tokenIconHint: 'Token Icon',
    },
    messageSystem: {
        killswitch: {
            title: 'Update required',
            content: 'Update to continue using Trezor Suite. Your funds are secure.',
        },
    },
    suiteSync: {
        label: 'Label',
        addLabel: 'Add label',
        enabledToast: 'Suite Sync turned on.',
        disableAlert: {
            title: 'Turn off Suite Sync?',
            description:
                "Turning off Suite Sync disables labeling. Your labels will stay safely encrypted, but they won't be visible until you turn Suite Sync back on.",
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
            quotaManagerCommunicationFailed: 'Quota Manager communication failed.',
        },
    },
    moduleHome: {
        graphIgnoredNetworks:
            "{networksString} and all related tokens are included in your portfolio balance, but aren't currently supported in the graph.",
        emptyState: {
            uninitializedDevice: {
                title: 'Your Trezor is ready to set up',
                subtitle: 'You can do this anytime.',
                button: 'Set up my Trezor',
            },
            initializedDevice: {
                title: 'Your wallet is ready',
                subtitle: 'Add the networks you want to use.',
                button: 'Get started',
            },
            discoveryNotFinished: {
                title: 'Reconnect your Trezor',
                subtitle:
                    'Your Trezor was disconnected before any assets could be discovered. Reconnect it to finish setup.',
            },
            portfolioTracker: {
                title: 'Get started',
                subtitle: 'Sync your asset addresses and view your portfolio balance.',
                primaryButton: 'Sync & Track',
                alert: 'This requires access to Trezor Suite asset addresses.',
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
                title: 'Track your assets ',
                description: 'Sync your favorite assets and track balances with portfolio tracker.',
                syncButton: 'Sync & Track',
            },
            demoAccountQuestionnaire: {
                title: "Don't have a Trezor yet?",
                description: 'Help us shape a better experience for you.',
                button: "I don't have a Trezor",
            },
            getTrezorCta: {
                title: "Don't have a Trezor yet?",
                button: 'Get Trezor',
            },
            onboardingFeedbackBanner: {
                title: 'Help us improve',
                subtitle: 'Share your setup experience',
                button: 'Give feedback',
            },
        },
        buttons: {
            receive: 'Receive',
            send: 'Send',
            referral: 'Earn $20 per referral',
        },
        firmwareUpdateAlert: {
            title: 'New firmware is available',
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
                'Connect your Trezor and allow Suite Sync to view and edit your labels, wallet names, and account names.',
            connectButton: 'Connect & allow',
        },
        suiteSyncFirmwareUpdateAlert: {
            title: 'Firmware update required',
            description: 'Update firmware on your Trezor to use Suite Sync.',
            button: 'Update',
        },
    },
    accounts: {
        accountLabelFieldHint: {
            letterCount: '{current} / {max} characters',
        },
        searchForm: {
            placeholder: 'Search assets',
        },
    },
    accountList: {
        numberOfTokens: '+{numberOfTokens, plural, one{1 Token} other{# Tokens}}',
        staking: 'Staking',
        rewardsReduced: 'Rewards reduced',
        stakingDisabled: 'Staking is currently unavailable.',
    },
    assets: {
        dashboard: {
            discoveryProgress: {
                loading: 'Loading...',
                stillWorking: 'Loading balances...',
            },
        },
        rediscoveryNeeded: 'Reconnect your Trezor to load all assets.',
    },
    biometrics: {
        biometricsButton: 'Unlock with biometrics',
        biometricsUnavailableAlert: {
            title: 'Biometric authentication',
            description:
                "Biometric authentication isn't set up on your phone. Set it up in your phone settings and try again.",
        },
    },
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
                    ios: 'Bluetooth is currently turned off on this phone. Go to Control Center and turn it on.',
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
                    "The Trezor you're trying to connect may still be remembered in your phone's Bluetooth settings. Remove it and try again.",
                primaryButton: 'Open system settings',
                secondaryButton: 'Device removed',
            },
            systemUnpairing: {
                title: 'Remove from Bluetooth settings',
                description:
                    'Go to Bluetooth settings and remove your Trezor. If not, you might have trouble pairing it again in the future.',
                primaryButton: 'Open system settings',
                secondaryButton: 'Device removed',
            },
            unpairingInstructions: {
                step1: 'Go to Settings > Bluetooth',
                step2: 'Find Trezor and tap on ⓘ',
                step3: 'Tap “Forget this device”',
            },
        },
        toasts: {
            pairingCanceled: 'Bluetooth pairing canceled',
        },
        deviceList: {
            connect: {
                title: 'Connect your Trezor',
                subtitle: 'Select the Trezor to connect.',
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
                pairingHint: 'Make sure the pairing code on your Trezor matches.',
            },
            remove: {
                actionButton: 'Pair again',
            },
            unknownColor: 'Unknown',
        },
    },
    moduleAccountImport: {
        title: 'Sync my assets',
        error: {
            unsupportedNetworkType: 'Unsupported account network type.',
        },
        summaryScreen: {
            title: {
                confirmToAdd: 'Confirm to add asset',
                alreadySynced: 'Asset already synced',
            },
            subtitle: "Here's what you have in your account.",
            tokens: 'Tokens:',
            syncAnotherCoinButton: 'Sync another asset',
        },
        coinList: {
            mainnets: 'Select a network to sync',
            testnets: 'Testnet networks (no value–for testing purposes only)',
        },
        xpubScanScreen: {
            alert: {
                address: {
                    title: 'This is your receive address',
                    description: 'To check the balance of your asset, scan your public key (XPUB).',
                    hintButton: 'Where to find it?',
                },
                xpub: {
                    title: 'Incompatible XPUB detected',
                    description: "The XPUB provided doesn't correspond with the selected network.",
                },
            },
            input: {
                label: {
                    xpub: 'Enter public key (XPUB) manually',
                    address: 'Enter address manually',
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
                    xpub: ' To view the public key (XPUB) of your account, open Trezor Suite, plug in your Trezor, then select <emphasized>Details</emphasized>, then <emphasized>Show public key</emphasized>.',
                    address:
                        'To view the receive address of your account, open the Trezor Suite desktop app, plug in your Trezor, select <emphasized>Accounts</emphasized>, then <emphasized>Receive</emphasized>, and click on <emphasized>Show full address</emphasized>.',
                },
            },
        },
        accountImportLoaderScreen: {
            loaderState: {
                balances: 'Loading balances...',
                assets: 'Confirming assets',
                transactions: 'Checking transactions...',
            },
        },
    },
    moduleAddAccounts: {
        addCoinAccountScreen: {
            title: 'Add new',
        },
        alerts: {
            tooManyAccounts: {
                title: 'You have reached the maximum number of accounts',
                description: 'You can create up to 10 accounts of a type for each network.',
                actionPrimary: 'Close',
            },
            anotherEmptyAccount: {
                title: "Can't create another fresh account",
                description:
                    'The last account you created for this network has no transactions yet.',
                actionPrimary: 'Close',
                actionSecondary: 'Learn more',
            },
            generalError: {
                title: "We couldn't add your account.",
                description: "There's been an unknown technical issue on our end.",
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
            title: 'Checking {coin} for balances & transactions...',
            subtitle: 'This should take just a moment.',
        },
        coinDiscoveryFinishedScreen: {
            title: {
                singular: "We've found {count} {coin} account",
                plural: "We've found {count} {coin} accounts",
            },
            orSeparator: 'OR',
            addButton: 'Add new network',
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
                    title: 'Legacy SegWit',
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
                callout: "Let's check your wallet backup",
                title: 'This check verifies your wallet backup',
                description:
                    'A wallet backup is the only way to regain access to your assets if your Trezor is lost, stolen, or damaged.',
            },
            step2: {
                callout: 'To get started',
                title: 'Get your wallet backup',
                description:
                    'Your wallet backup is the list of words you wrote down when you set up your Trezor for the first time.',
                checkButton: 'Check wallet backup',
                noBackupButton: "I don't have my wallet backup",
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
            subtitle: 'Check backup for {deviceModel} is not supported in the mobile app.',
            redirectButton: 'Continue to Trezor Suite for Web',
            laterButton: "I'll do it later",
            step1: 'Go to Trezor Suite for Web using the button below.',
            step2: 'Complete check backup in your browser.',
            step3: 'Start using your Trezor with\nTrezor Suite.',
        },
        checkBackupSupportScreen: {
            title: "We're here to help",
            description: 'Reach out to our support team for assistance with this issue.',
            button: 'Contact Trezor Support',
        },
        checkBackupFailScreen: {
            title: 'The wallet backup entered is invalid',
            description:
                "Check for any typos and try again.\nIf you're still having issues, contact Trezor Support.",
            supportButton: 'Get help',
        },
        cancelAlert: {
            title: 'Cancel wallet backup check?',
            description: 'You can restart anytime.',
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
            status: 'Checking for connected Trezors...',
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
                    current: 'Enter PIN',
                    new: 'Enter new PIN',
                    confirm: 'Re-enter new PIN',
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
                hint1: 'Make sure your Trezor is turned on and unlocked',
                hint2: 'Use a different USB cable',
                hint3: 'Connect your Trezor to a different mobile device or computer',
                contactSupportButton: 'Contact Trezor Support',
            },
            pairing: {
                hints: {
                    title: 'Your Trezor needs to be in pairing mode',
                    description: 'This window will close as soon as we detect your Trezor.',
                    stillNotWorkingButton: "It's still not working",
                },
                settings: {
                    title: "Confirm that your Trezor is visible in your phone's settings",
                    description: 'If not, pair your Trezor again.',
                    goToSettingsButton: 'Go to Bluetooth settings',
                    pairAgainButton: 'Pair again',
                },
            },
        },
        pinCanceledDuringDiscovery: {
            title: "Some balances haven't been loaded.",
            subtitle: 'Unlock your Trezor to finish loading your balances.',
            button: 'Enter PIN',
        },
    },
    moduleConnectPopup: {
        confirm: 'Confirm',
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
            coinHeading: '{coin} access',
            deviceHeading: 'Device access',
            read_address: 'View receive addresses',
            read_xpub: 'Access extended public keys (XPUBs)',
            read_account_info: 'View account balances and transaction history',
            read_settings: 'Read device settings',
            read_features: 'Read device features',
            sign: 'Allow transaction and data signing on Trezor',
            sign_message: 'Allow message signing on Trezor',
            verify_message: 'Verify signed messages',
            management: 'Change device settings',
            push_tx: 'Broadcast transactions to the blockchain',
            internal: 'Internal use only',
            read: 'Access public keys from your Trezor device',
            write: 'Allow transaction and data signing on Trezor',
        },
        simulation: {
            reviewTransaction: 'Review transaction',
            simulation: 'Simulation',
            simulationPoweredBy: 'Simulation powered by {provider}',
            simulationStatusError: 'Unable to simulate transaction. Proceed at your own risk.',
            simulationStatusWarning:
                'This transaction appears suspicious. Make sure you trust the source before continuing.',
            simulationStatusMalicious:
                'This transaction is likely malicious! We recommend you do not engage with this app.',
            disclaimerOverride: 'Ignore warning and continue',
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
            message: 'Compare the original address with what’s on your Trezor.',
        },
        exportAccounts: {
            title: 'Export accounts',
            message:
                'The following accounts from {passphraseWalletLabel} on {deviceLabel} will be shared with {thirdParty}. Your private keys stay secure and are never exposed.',
        },
        connectionStatus: {
            loading: 'Loading...',
            discoveryRunning: 'Discovery running...',
        },
        errors: {
            requestFailed: 'Request failed',
            deviceNotConnected: 'Device not connected.',
            invalidCallback: 'Invalid callback URL',
            invalidParams: 'Invalid parameters from calling app',
            versionUnsupported: 'Unsupported version. Update your Trezor Suite app.',
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
                "We couldn't verify the authenticity of this request. Ensure you trust the source before proceeding.",
            pasteFromClipboard: 'Paste from clipboard',
            scanQR: 'Scan WalletConnect QR code',
            disconnect: 'Disconnect',
            switchAccount: 'Switch account',
            app: 'App',
            requestedNetworks: 'Requested networks',
            selectedAccount: 'Selected account',
            serviceStatus: {
                verified: 'Verified service',
                unknown: 'Unknown service',
                dangerous: 'Dangerous service',
            },
            errors: {
                requestExpired: 'This request has expired. Return to the app and try again.',
                isScam: 'We detected a scam attempt and blocked it for your safety.',
                unableToVerify:
                    "We couldn't verify the authenticity of this request. Ensure you trust the source before proceeding.",
                requiredNetworksNotActivated:
                    'Some required networks are inactive. Activate them to use all app features.',
                noNetworksActivated:
                    'To connect to the app, activate at least one supported network in Settings.',
            },
        },
    },
    moduleDevice: {
        incompatibleFirmwareModalAppendix: {
            title: 'Follow these steps',
            lines: {
                '1': '1. Connect your Trezor to the Trezor Suite desktop app',
                '2': '2. Go to device settings',
                '3': '3. Update firmware',
            },
        },
        noSeedModal: {
            title: 'Your Trezor needs to be set up.',
            description:
                'Trezor setup is currently not available with the Trezor Suite mobile app.',
            primaryButton: 'Continue to Trezor Suite for Web',
            appendix: {
                title: 'What to do now?',
                lines: {
                    '1': 'Go to Trezor Suite for Web using the button below.',
                    '2': 'Finish device setup in your browser.',
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
            title: 'Reconnect your Trezor',
            description:
                'We’ve encountered an unexpected error. If the problem persists, contact Trezor Support.',
            buttons: {
                reconnect: 'Reconnect Trezor',
                help: 'Contact Trezor Support',
            },
        },
        unacquiredDeviceModal: {
            title: 'Connected Trezor is being used by another application.',
            description: "Trezor can't be used by multiple applications.",
            button: 'Use Trezor here',
            appendix: {
                bullet1: 'Close other apps that might be using your Trezor.',
                bullet2: 'Reconnect your Trezor',
            },
        },
        unsupportedFirmwareModal: {
            title: 'The connected Trezor device needs an update',
            description:
                'To continue using your Trezor with this app, update it using Trezor Suite for Desktop or Web.',
        },
        noBackupModal: {
            title: "Your Trezor isn't backed up.",
            subtitle: 'If your Trezor is lost or damaged, your funds may be irreversibly lost.',
            cta: 'Create wallet backup',
            continue: 'Continue anyway',
        },
        confirmOnDeviceSheetTitle: 'Confirm on Trezor',
        toasts: {
            firmwareRevisionCheckOtherError: "Firmware authenticity check couldn't be performed.",
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
                description: 'This will erase all data on your Trezor. Proceed with caution.',
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
            dangerZone: 'Danger area',
        },
        changeDeviceName: {
            title: 'Rename your Trezor',
            validations: {
                noSpecialCharacters: 'Name contains unsupported characters.',
                maxLengthInfo: 'Name can be up to 16 characters.',
                englishLettersOnly:
                    'Enter a name using English letters, numbers, and supported special characters.',
            },
            submitButton: 'Confirm',
            loadingSuccessScreen: {
                title: 'Device name changed',
            },
        },
        connection: {
            title: 'Device connection',
            description: "Manage your Trezor's connection settings",
        },
        autoConnect: {
            title: 'Auto-connect',
            description:
                'Trezor will connect automatically without having to confirm every connection.',
            successToast: 'Auto-connect turned on',
            errorToast: 'Auto-connect failed to turn on',
        },
        forgetDevice: {
            title: 'Forget device',
            description:
                'Permanently delete all data related to your Trezor from this phone, including Bluetooth pairing and connection settings.',
            info: {
                title: 'Forget this Trezor?',
                list: {
                    item1: 'Trezor Suite will forget this Trezor.',
                    item2: 'Your Trezor will be disconnected and its Bluetooth pairing removed.',
                    item3: 'Your wallet backup and funds stay intact—they won’t be erased.',
                },
                submitButton: 'Forget device',
            },
            guide: {
                title: 'Remove from Bluetooth settings',
                step1: {
                    header: 'On your phone',
                    description:
                        'Go to <link>Bluetooth settings</link> and remove your Trezor. If not, you might have trouble pairing it again in the future.',
                },
                step2: {
                    header: 'On your Trezor',
                    description:
                        'Go to Pair & Connect and remove your phone. This will prevent connection errors later.',
                },
                continueButton: "I've removed it",
            },
            finish: {
                title: 'Finish removing this Trezor',
                subtitle: 'Disconnect your Trezor from your phone.',
            },
            successToast: 'Device forgotten',
        },
        pinProtection: {
            title: 'PIN',
            content:
                'Use a strong PIN to help protect your device from unauthorized access and keep your assets safe.',
            alertBoxTitle: "Your PIN isn't set",
            cardSubtitle: {
                enable: 'Set a PIN for your Trezor',
                changeOrRemove: 'Change or remove PIN',
            },
            pictograms: {
                enable: {
                    title: "Your PIN isn't set",
                    subtitle: 'Set a strong PIN to keep your Trezor safe from unauthorized access.',
                },
                change: {
                    title: 'Your PIN is set',
                },
            },
            actions: {
                enable: {
                    success: 'PIN enabled',
                    canceled: 'Enable PIN canceled',
                },
                change: {
                    success: 'PIN changed successfully',
                    canceled: 'Change PIN canceled',
                },
                disable: {
                    success: 'PIN disabled',
                    canceled: 'Disable PIN canceled',
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
            description: 'Check wallet backup & enable passphrase wallets',
        },
        passphrase: {
            title: 'Use Passphrase wallets',
            description:
                'Add a passphrase to create a separate, extra-secure wallet. Each Passphrase wallet is unique and only accessible with its own passphrase.',
        },
        checkBackup: {
            title: 'Check wallet backup',
            subtitle: 'Perform a simulated recovery to verify your wallet backup.',
        },
        authenticity: {
            title: 'Device authenticity check',
            subtitle:
                "This check is essential to ensure your device's reliability, integrity, and secure use.",
            content: 'Check the integrity of the device',
            info: {
                item1: 'This confirms that the secure hardware inside your device is genuine.',
                item2: 'Once your Trezor has passed this check and been verified, you’re all set.',
                letsDoItButton: "Let's do it",
            },
            success: {
                title: 'Device authenticity check passed',
                subtitle: 'You can now be sure that your Trezor is genuine & safe to use.',
            },
            toast: {
                canceled: 'Device authenticity check canceled',
                error: 'Unable to authenticate your device: {error}',
                failed: 'Device authenticity check failed: {error}',
            },
        },
        wipeDevice: {
            title: 'Wipe device',
            subtitle:
                'Permanently erase all stored data on your Trezor, including your wallet backup and PIN.',
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
            subtitle: "Firmware is your Trezor's operating system.",
            updateFirmwareButton: 'Update firmware',
            noBackupAlert: {
                title: 'Do you really want to proceed without a backup?',
                description:
                    'In the unlikely event of a firmware update issue, you may need your wallet backup to restore access. Check your wallet backup before you continue.',
                primaryButton: 'No, create wallet backup',
                secondaryButton: 'Yes, update firmware',
            },
        },
    },
    moduleReceive: {
        receiveTitle: 'Receive',
        screenTitle: '{coinSymbol} Receive address',
        deviceCancelError: 'Address confirmation canceled.',
        destinationTag:
            "When sending {coinSymbol} to Trezor, your online exchange may require a memo/destination tag, but Trezor doesn't. Enter any random number to proceed. <link>Learn more</link>",
        receiveAddressCard: {
            alert: {
                longCardanoAddress:
                    "This Cardano (ADA) address is too long to fit on your Trezor's screen. Scroll on both screens to view and confirm it.",
                token: 'Your receive address is your {networkName} address',
            },
        },
        deviceCompromisedScreen: {
            title: 'Receiving is disabled',
        },
        addressActions: {
            verify: 'Verify',
        },
        addressCopiedBottomSheet: {
            title: 'Address copied.',
            subtitle: 'Verify before you receive.',
            steps: {
                pasteAddress:
                    'Paste the address into the exchange or app from where you will receive the funds.',
                verifyAddress: 'Verify the pasted address against your Trezor for maximum safety.',
            },
            buttons: {
                verifyOnTrezor: 'Verify on Trezor',
                skipVerification: 'Skip verification',
            },
        },
        addressSharedBottomSheet: {
            title: 'Verify the shared address',
            subtitle: 'Verify the address you just shared against your Trezor for maximum safety.',
        },
        addressVerificationScreen: {
            pastedTitle: 'Compare the pasted address against your Trezor',
            sharedTitle: 'Compare the shared address against your Trezor',
        },
    },
    moduleSettings: {
        getTrezorCta: {
            title: "Don't have a Trezor yet?",
            subtitle:
                'Secure your crypto offline and unlock its full potential with Trezor hardware wallets.',
            bullets: {
                security: 'Advanced open-source security',
                app: 'Powerful crypto app for mobile & desktop',
                setup: 'Easy to set up & simple to recover',
            },
            button: 'Get Trezor',
        },
        items: {
            general: {
                title: 'General',
                preferences: {
                    title: 'Preferences',
                    subtitle: 'Set app preferences and theme',
                },
                privacy: {
                    title: 'Privacy & security',
                    subtitle: 'Enable biometric authentication and set data preferences',
                },
                support: {
                    title: 'Support',
                    subtitle: 'Get troubleshooting tips and answers to FAQs',
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
                ejectWallets: {
                    title: 'Eject wallets',
                    subtitle: 'Hide your wallets when you disconnect your Trezor',
                },
                networks: {
                    title: 'Networks',
                    subtitle: 'Enable networks to receive assets',
                },
                suiteSync: {
                    title: 'Suite Sync',
                    subtitle: 'Sync data across your devices',
                    screenSubtitle:
                        'Name your wallets, personalize accounts, and label transactions.',
                    toggleDescription:
                        'Keeps your data up to date on all your devices. Your data stays local and syncs only with devices you approve.',
                    relayUrl: {
                        serverType: {
                            label: 'Server',
                            default: 'Trezor (default)',
                            custom: 'Custom',
                        },
                        customUrlInput: {
                            label: 'Custom server URL',
                            required: 'This field is required',
                            invalidUrl: 'Enter a valid URL',
                        },
                        saved: 'Server settings saved.',
                    },
                },
                security: {
                    title: 'Security',
                    subtitle: 'Protect your transactions',
                },
                advanced: {
                    title: 'Advanced',
                    subtitle: 'Enable expert features for power users',
                },
                experimental: {
                    title: 'Experimental',
                    subtitle: 'Get early access to new features',
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
                label: 'Get more help',
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
                                "If you're having trouble connecting your Trezor and your mobile device, try the following:",
                            cabled: {
                                title: 'For cabled connections:',
                            },
                            wireless: {
                                '0': 'Check the devices are in close proximity',
                                '1': 'Make sure Bluetooth is enabled on both devices',
                                '2': 'Remove old Trezor device Bluetooth connections',
                                '3': 'Restart your device(s)',
                                '4': 'Turn Bluetooth on/off again on your mobile device',
                                '5': 'Forget and re-pair the devices',
                                '6': 'Update Trezor firmware and your mobile device OS',
                                title: 'For wireless connections:',
                            },
                            footer: "If you're still having issues, contact <link>Trezor Support</link>.",
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
                        answer: "Yes, you can connect your Trezor Safe 7 and use the app to manage your crypto with ease and confidence. For all Trezor devices the app is designed to work as a companion to the desktop/web version of Trezor Suite. As we add more features, it'll become a standalone mobile application to manage your crypto funds on the go.",
                    },
                    '1': {
                        question:
                            'What is the difference between Portfolio Tracker and Connected Trezor functionality?',
                        answer: "Portfolio Tracker helps you monitor your account balances without having to physically connect your Trezor device. Simply sync your asset addresses and keep track of your crypto on the go. You can also combine asset addresses from multiple wallets or Trezor devices to track your whole portfolio in one place. Connected Trezor allows you to manage your funds protected by your Trezor device. You can verify receive addresses and check your balances and transactions. However, if you disconnect the Trezor, you'll no longer see the data from the Trezor device.",
                    },
                    '2': {
                        question: 'What are public keys (XPUB) and receive addresses?',
                        answer: 'An XPUB is a master public key for hierarchical deterministic wallets, generating multiple child keys and receive addresses for improved privacy. Ethereum uses a single, unchanging address for all transactions. For Ethereum, share only your address, while keeping your private key secure.',
                    },
                    '3': {
                        question: "My Trezor device can't connect",
                        answer: {
                            '0': 'Check the devices are in close proximity',
                            '1': 'Make sure Bluetooth is enabled on both devices',
                            '2': 'Remove old Trezor device Bluetooth connections',
                            '3': 'Restart your device(s)',
                            '4': 'Turn Bluetooth on/off again on your mobile device',
                            '5': 'Forget and re-pair the devices',
                            '6': 'Update Trezor firmware and your mobile device OS',
                            subtitle:
                                "If you're having trouble connecting your Trezor and your mobile device, try the following:",
                            footer: "If you're still having issues, contact <link>Trezor Support</link>.",
                        },
                    },
                    '4': {
                        question:
                            'Which firmware versions are supported by Trezor Suite on Mobile?',
                        answer: 'Trezor Safe 7: all versions',
                    },
                    '5': {
                        question: "Why don't I see my asset listed?",
                        answer: "Trezor Suite on Mobile currently supports a limited number of cryptocurrencies. If your asset isn't listed, it may not be compatible with the app. However, Trezor regularly adds support for new assets and tokens, so check back periodically to see which assets have been added.",
                    },
                    '6': {
                        question: 'What does the graph display?',
                        answer: "The graph displays the price history of your portfolio's synced assets over a specified period. You can adjust the time period by selecting a different range on the bottom of the graph.",
                    },
                    '7': {
                        question: 'What is auto-eject wallets?',
                        answer: "Auto-eject wallets automatically hides all wallets from the app when your Trezor is disconnected.\nIf disabled, you can continue viewing your balances and transaction history without connecting your Trezor. To move funds or confirm transactions, you'll always need to connect your device.",
                    },
                },
            },
            usbEnabled: {
                '0': {
                    question: 'Can I connect my Trezor to Trezor Suite?',
                    answer: 'Yes, all Trezor devices work with Android. Trezor Safe 7 also works with iOS via Bluetooth. The mobile app is continuously being improved to bring more features and make it a standalone application to manage your {coinLabel} funds.',
                },
                '1': {
                    question:
                        'What is the difference between Portfolio Tracker and Connected Trezor functionality?',
                    answer: 'Portfolio Tracker helps you stay in touch with your portfolio balances without having to connect your Trezor device. Simply sync your asset addresses and you can keep track of your balances on the go. You can also combine asset addresses from multiple wallets or Trezor devices to track your whole portfolio in one place. Connected Trezor allows you to manage your funds associated with your Trezor device. You can verify receive addresses and check your balances and transactions. However, if you disconnect the Trezor, you will no longer see the data from the Trezor device.',
                },
                '2': {
                    question: 'What is a public key? XPUB or a receive address?',
                    answer: 'An XPUB is a master public key for hierarchical deterministic wallets, generating multiple child keys and receive addresses for improved privacy. Ethereum uses a single, unchanging address for all transactions. For Ethereum, share only your address, while keeping your private key secure.',
                },
                '3': {
                    question: "My Trezor device can't connect",
                    answer: {
                        '0': 'Reconnect your Trezor',
                        '1': 'Use a different USB data cable',
                        '2': 'Use a different mobile device',
                        '3': "Enable connection for Trezor Suite via your phone's system message",
                    },
                },
                '4': {
                    question: 'Which firmware versions are supported by Trezor Suite on Mobile?',
                    answer: {
                        '0': 'Trezor Model One: from version 1.12.1',
                        '1': 'Trezor Model T: from version 2.6.3',
                        '2': 'Trezor Safe 3: from version 2.6.3',
                        '3': 'Trezor Safe 5: from version 2.7.2',
                    },
                },
                '5': {
                    question: "Why don't I see my asset listed?",
                    answer: 'Trezor Suite currently supports a limited number of cryptocurrencies. If your asset is not listed, it may not be compatible with the app. However, Trezor regularly adds support for new assets, so check back periodically to see which assets have been added.',
                },
                '6': {
                    question: 'What does the graph display?',
                    answer: "The graph in Trezor Suite displays the price history of your portfolio's synced assets over specified time period. You can adjust the time period by selecting a different range on the bottom of the graph.",
                },
                '7': {
                    question: 'What is the “Eject wallets” feature?',
                    answer: "Auto-eject wallets automatically hides all wallets from the app when your Trezor is disconnected.\nIf disabled, you can continue viewing your balances and transaction history without connecting your Trezor. To move funds or confirm transactions, you'll always need to connect your device.",
                },
            },
            trading: {
                question: 'What trading features are available?',
                answer: "With a connected Trezor you're able to carry out key trade features in Trezor Suite on mobile. Learn more about trading crypto on the <link>Trezor Knowledge Base</link>.",
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
            text: 'Manage your assets securely with Trezor Suite. Buy, sell, send, receive, and swap assets, or earn rewards through staking and DeFi yield. Track your balances anytime, even without your Trezor connected.',
            followUs: 'Follow us',
            lastCommitHash: 'Last commit hash: {lastCommitHash}',
        },
        privacyAndSecurity: {
            title: 'Privacy & security',
            analyticsSwitch: {
                title: 'Usage data',
                subtitle:
                    'All collected data is anonymous and is only used to improve the Trezor ecosystem.',
            },
            biometrics: {
                title: 'Biometric authentication',
                subtitle: 'Use facial or fingerprint verification to unlock Trezor Suite.',
            },
            discreetMode: 'Discreet mode',
        },
        networks: {
            title: 'Networks',
            subtitle:
                'Enable networks to buy or receive assets. Disable unused networks to improve loading speed.',
        },
        networkBackends: {
            title: '{networkName} backend',
            description: 'Connect to a custom backend server for enhanced privacy.',
            servers: {
                title: 'Backend server',
                status: {
                    connected: 'Connected',
                    disconnected: 'Disconnected',
                },
                serverType: {
                    label: 'Server type',
                    defaultLabel: 'Trezor (default)',
                },
                serverAddress: {
                    label: 'Server address',
                    hint: 'Format: {example}',
                },
                connectButton: 'Connect',
                invalidFormat: "Server address format isn't valid.",
                unableToConnect: {
                    clearnet: 'Unable to connect to the server. Check the address and connection.',
                    tor: 'Can’t connect to the server. Check the address and make sure Orbot is running.',
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
                connectedTo: 'Connected to',
                blockHash: 'Block hash',
                blockHeight: 'Block height',
                backendVersion: 'Backend version',
                disconnected:
                    'Failed to connect to the backend server. Check your internet connection, verify your custom backend address, reconnect your device, and make sure {networkName} is enabled in Settings.',
            },
        },
        coinEnabling: {
            unsupportedSubtitle: 'Not supported on this device',
            labels: {
                testnets: 'Testnet networks',
                tokens: 'Including tokens',
                tokensAndStaking: 'Including tokens & staking',
                more: '+more',
            },
            toasts: {
                coinEnabled: 'Connect your Trezor to load {coin}',
            },
            oneNetworkSymbolAlert: {
                title: 'You need to keep at least 1 network enabled at all times.',
                description: "Otherwise the app won't show you anything.",
            },
            bottomNote:
                "Didn't find what you're looking for? Make sure the token uses one of the listed networks.",
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
                    "Your balances remain visible when you disconnect your Trezor. Enable auto-eject to hide them. Assets can't be moved without a connected Trezor.",
                switch: {
                    title: 'Auto-eject wallets',
                    description: 'Automatically eject all wallets when you disconnect your Trezor.',
                    alert: {
                        disconnectedTrezorTitle: 'Enable auto-eject to hide your balances',
                        connectedTrezorTitle:
                            'Enable auto-eject to hide your balances when you disconnect your Trezor',
                        primaryButtonTitle: 'Enable auto-eject',
                    },
                },
                toast: {
                    walletsEjected: 'Wallets ejected',
                    walletEjected: 'Wallet ejected',
                    walletsWillBeEjected: 'Wallets are ejected when your Trezor disconnects',
                },
                alert: {
                    title: 'Your balances remain visible when your Trezor is disconnected',
                    subtitle:
                        "You can eject your wallets anytime. Assets can't be moved without a connected Trezor.",
                    primaryButtonTitle: 'Got it',
                    secondaryButtonTitle: 'Auto-eject wallets',
                    successToast: 'Wallets eject when your Trezor disconnects',
                },
            },
        },
        security: {
            title: 'Security',
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
                    number: 'Enter a valid number',
                    positive: 'Dust threshold must be a positive number',
                },
            },
        },
        advanced: {
            title: 'Advanced',
            authenticityChecks: {
                buttonTurnOff: 'Turn off',
                buttonTurnOn: 'Turn on',
                buttonLearnMore: 'Learn more',
                toastOn: 'Device authenticity check turned on',
                toastOff: 'Device authenticity check turned off',
                turnOff: {
                    content: 'This feature is designed to protect your security.',
                    item1: 'Only continue if your Trezor has successfully passed this check before',
                    item1Explanation:
                        'Using an unverified device could result in the loss of your funds.',
                    item2: 'Only continue if you fully understand the risks and have a valid reason',
                    item2Explanation: 'If unsure, contact Trezor Support for help.',
                    acknowledgement: "I've read and understood the warnings above.",
                    acknowledgementNote: 'Trezor Support will never ask you to turn this off.',
                },
                firmware: {
                    title: 'Firmware authenticity check',
                    subtitle:
                        'Checks that the firmware on your Trezor is genuine before you use the device in Trezor Suite.',
                    turnOffTitle: 'Turn off firmware authenticity check?',
                },
                device: {
                    title: 'Device authenticity check',
                    subtitle:
                        'Verify that your Trezor device is genuine. This helps ensure you never use a compromised or fake device. ',
                    turnOffTitle: 'Turn off device authenticity check?',
                },
            },
            networkReserve: {
                title: 'Network reserve',
                subtitle:
                    'Reserve a small amount of the native token on {supportedNetworks} to cover any extra network fees when you send, swap, or sell your assets.',
            },
            addressDisplay: {
                title: 'Spaced address formatting',
                subtitle:
                    'Add spaces to addresses for easier reading. When off, addresses are shown as a continuous string.',
            },
            bitcoinBackends: {
                title: 'Bitcoin backend',
                description: 'Connect to a custom backend server for enhanced privacy.',
                servers: {
                    title: 'Backend server',
                    status: {
                        connected: 'Connected',
                        disconnected: 'Disconnected',
                    },
                    serverType: 'Server',
                    serverTypeDefault: 'Trezor (default)',
                    serverAddress: 'Server address',
                    connectButton: 'Connect',
                    invalidFormat:
                        'Invalid format. Enter the server address in this format: host:port:[t|s].',
                    unableToConnect: {
                        clearnet:
                            'Unable to connect to the server. Check the address and connection.',
                        tor: 'Can’t connect to the server. Check the address and make sure Orbot is running.',
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
                    connectedTo: 'Connected to',
                    blockHash: 'Block hash',
                    blockHeight: 'Block height',
                    backendVersion: 'Backend version',
                    disconnected:
                        'Connection to the backend server failed. Check your internet connection, verify your custom backend address, reconnect your device, and make sure Bitcoin is enabled in Settings.',
                },
                subtitle: 'Manage backend connections',
            },
            experimentalFeatures: {
                suiteSync: {
                    title: 'Suite Sync',
                },
            },
            testnets: {
                title: 'Testnet networks',
                description:
                    'Send and receive transactions on testnet networks. These assets are for testing purposes only and have no real value.',
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
            title: 'Experimental',
            subtitle: 'For experienced users only. Use at your own risk.',
            noneAvailable: {
                title: 'None available',
                subtitle: 'No experimental features currently available.',
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
        availableOn: 'Available on {supportedNetworks}.',
        notSupported: 'Not supported on this Trezor device.',
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
            title: 'Biometric authentication',
            description:
                'Enable biometric authentication to prevent unauthorized access to this app.',
            button: {
                notNow: 'Not now',
            },
        },
    },
    moduleDeviceOnboarding: {
        createPinScreen: {
            title: "Set your Trezor's PIN",
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
                    callout: 'Extra caution required',
                    submitButton: 'Continue with Multi-share Backup',
                    alertButtonLabel: 'Learn more',
                },
                '12-words': {
                    title: '12-word backup',
                    description: 'Legacy backup type',
                    format: 'Generates a <bold>single set of 12 words</bold> to recover access to your funds.',
                    storage:
                        'Store your wallet backup in a secure, private place. Never share it with anyone or store it anywhere digital.',
                    callout: "This can't be upgraded to a Multi-share Backup.",
                    submitButton: 'Continue with 12-word backup',
                },
                '24-words': {
                    title: '24-word backup',
                    description: 'Legacy backup type',
                    format: 'Generates a <bold>single set of 24 words</bold> to recover access to your funds.',
                    storage:
                        'Store your wallet backup in a secure, private place. Never share it with anyone or store it anywhere digital.',
                    callout: "This can't be upgraded to a Single-share Backup.",
                    submitButton: 'Continue with 24-word backup',
                },
            },
        },
        uninitializedDeviceLandingScreen: {
            noFirmware: {
                title: "Now it's just you\nand your {coinLabel}",
                button: "Let's get started",
            },
            firmware: {
                title: 'Have you used this Trezor before?',
                subtitle:
                    'Firmware is already installed on this Trezor. Continue only if you have used this Trezor before.',
                button: 'Yes, I have',
                noButton: "No, I haven't",
            },
            lookDifferentLabel: 'My device looks different',
        },
        suspiciousDeviceScreen: {
            title: 'Let’s play it safe',
            subtitle:
                'Your Trezor’s security is our top priority. Before using it, reach out to Trezor Support—they’ll guide you through what to do next.',
            bullet1: 'Disconnect your device from your phone.',
            bullet2: 'Avoid using this device or sending any funds to it.',
            bullet3: 'Click below and use the Chat option on the Trezor Support page.',
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
            declineButton: "I'm not sure",
        },
        deviceAuthenticitySuccessScreen: {
            title: 'Your Trezor is genuine',
            subtitle: 'You can now be sure that your Trezor is safe to use.',
        },
        deviceTutorialScreen: {
            title: 'Continue with a short tutorial on your Trezor',
            actionLabel: 'Skip',
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
            title: "Let's protect your assets with a wallet backup",
        },
        walletBackupTutorialScreen: {
            step1: {
                callout: "What's a wallet backup?",
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
                    description: 'Recover a wallet',
                    bullet1:
                        'Use your wallet backup to recover access to your assets if something happens to your Trezor.',
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
                callout: "Let's start off right",
                title: 'Get set before creating your wallet backup',
                instruction1: 'Have a pen & your wallet backup card',
                instruction2: {
                    single: 'Give yourself about 10 minutes to complete',
                    multiple: 'Give yourself about 10 minutes per share',
                },
                instruction3: "Make sure you're in a safe & private space",
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
                step1: 'If your Trezor is lost, stolen, damaged, or you upgrade to a new one:',
                step2: 'Get a new Trezor',
                step3: 'Enter your wallet backup',
                step4: 'Regain access to your assets',
            },
            step2: {
                callout: 'Securing your wallet backup',
                title: 'Never store your wallet\nbackup anywhere digital',
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
            secondaryButton: "I don't have a wallet backup",
            bottomSheet: {
                title: "I don't have a wallet backup",
                card1: {
                    title: "Can't find your wallet backup?",
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
                    "You should not have any funds associated with this device. Wiping it will erase its data. This action can't be undone.",
                primaryButton: 'Wipe device',
                secondaryButton: 'Contact Trezor Support',
            },
        },
        congratulationsScreen: {
            title: "You're all set",
            subtitle: 'Your {deviceName} is set up and ready for use.',
            continueButton: 'Go to Dashboard',
        },
        deviceDisconnectedAlert: {
            title: 'Your Trezor has been disconnected',
            description: 'Connect your Trezor to start again.',
            reconnectButton: 'Reconnect Trezor',
        },
        cancelOnboardingAlert: {
            title: 'Cancel Trezor setup?',
            description: 'Start again at any time.',
            cancelButton: 'Yes, cancel',
            continueButton: 'Continue setup',
        },
    },
    moduleAccountManagement: {
        discoveryFailedBanner: {
            title: 'Account couldn’t be loaded',
            description:
                'Something went wrong while loading this account. Check your internet connection and try again.',
            retryButton: 'Retry',
        },
        accountsScreen: {
            title: 'My assets',
            networkFilter: {
                title: 'Show assets on',
                applyButton: 'Apply',
                clearButton: 'Clear filter',
                showAllButton: 'Show all',
                accountCount: '{count, plural, one {# account} other {# accounts}}',
            },
        },
        accountAssetsScreen: {
            tab: {
                tokens: 'Tokens {count, plural, =0 {} other { #}}',
                defi: 'DeFi {count, plural, =0 {} other { #}}',
                hidden: 'Hidden',
                inactive: 'Inactive',
            },
            zeroBalanceSection: {
                title: 'Zero-balance tokens',
            },
            hiddenTokensSection: {
                title: 'Unrecognized tokens',
                warning:
                    'Proceed with caution. This transaction may include hidden or unrecognized tokens.',
                emptyTitle: 'No hidden tokens',
            },
        },
        tokenSettings: {
            contractAddress: 'Contract address',
            network: 'Network',
            balance: 'Balance',
            hideToken: 'Hide token',
        },
        accountSettingsScreen: {
            coin: 'Network',
            accountType: 'Account type',
            derivationPath: 'Derivation path',
            xpubBottomSheet: {
                xpub: {
                    title: 'Public key (XPUB)',
                    showButton: 'Show public key (XPUB)',
                    copyMessage: 'XPUB copied',
                },
                copyButton: 'Copy',
            },
            renameForm: {
                title: 'Rename account',
                coinLabel: 'Account label',
            },
            removeAccountAlert: {
                title: 'Remove this asset from Trezor Suite?',
                description:
                    'Your assets remain safe. You can re-import them anytime using your public key (XPUB) or receive address.',
                primaryButton: 'Remove asset',
            },
        },
        accountDetailContentScreen: {
            coinPriceCard: {
                changeIn7d: '7D change',
                coinPrice: '{coinName} price',
            },
        },
    },
    moduleAccounts: {
        accountNotFound: 'Account {accountKey} not found.',
        tokens: {
            errorMessage: 'Token not found.',
        },
        accountDetail: {
            stablecoinYield: {
                defiYieldInfoText:
                    'This token represents your deposit and all rewards in DeFi Yield.',
                vault: 'Vault',
                apy: 'Annual Percentage Yield',
                deposited: 'Deposited',
                depositMore: 'Deposit more',
                withdraw: 'Withdraw',
                firmwareUpdateAlert: {
                    title: 'Firmware update required',
                    description: 'Update firmware on the device {name} to use {featureName}.',
                    primaryButtonTitle: 'Update',
                    secondaryButtonTitle: 'Not now',
                },
                apyBreakdown: {
                    apyLabel: '{apy} APY',
                    autoCompounded: 'Automatically added and compounded.',
                    manualCompound:
                        'Claim manually, then swap to {tokenSymbol} and deposit to compound.',
                    footerApy: 'APY may change over time.',
                    footerApyApr: 'APY and APR rates can change over time.',
                    footer: 'APY may change over time.',
                },
            },
        },
        emptyState: {
            title: 'No assets',
            subtitle: 'Connect your Trezor or sync networks to view and track assets.',
            addSubtitle: 'Start adding networks you want to use.',
            receiveSubtitle: 'Connect your Trezor or sync networks to view and receive assets.',
            searchTitle: 'No results found',
            searchAgain: 'Search again',
        },
        viewOnlyAddAccountAlert: {
            title: 'Connect & unlock your Trezor to add new assets',
            description: 'You can’t add new assets while your Trezor is disconnected.',
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
        accountSettingsBip329: {
            title: 'Transaction labels',
            description:
                'Import or export transaction labels for this account. These are compatible with other wallet applications that support the BIP-329 format.',
            importButton: 'Import',
            exportButton: 'Export',
            export: {
                exportSuccessfulToast: 'Labels exported successfully',
                exportFailedToast: 'Labels export failed',
                fileSavingNotSupported: 'File saving not supported on this platform.',
            },
            import: {
                importSuccessfulToast: 'Labels imported successfully',
                importFailedToast: 'Labels import failed',
                invalidFileToast: 'The selected file is not a valid BIP-329 label file.',
            },
        },
        accountSettingsExportBip329Button: {
            title: 'Export labels',
            button: 'Export',
            description:
                'Export transaction labels for this account. Compatible with other wallet applications that support the BIP-329 format.',
            exportSuccessfulToast: 'Labels exported successfully',
            exportFailedToast: 'Labels export failed',
            fileSavingNotSupported: 'File saving isn’t supported on mobile devices.',
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
            subtitle: 'Get started by receiving assets.',
            button: 'Receive',
        },
        detail: {
            header: '<transactionType></transactionType> transaction',
            unstakeHeader: 'Unstake {amount}',
            exploreButton: 'Show in blockchain explorer',
            feeLabel: 'Fee',
            dateLabel: 'Date',
            transactionOverviewTitle: 'Transaction overview',
            showMoreButton: 'and {amount} more',
            stellarTrustlineAdded: 'Established trustline to {assetCode}',
            stellarTrustlineRemoved: 'Removed trustline to {assetCode}',
            sheet: {
                parameters: 'Parameters',
                values: 'Compare values',
                inputs: 'Inputs & outputs',
            },
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
            stakeRegistration: 'Stake address registered',
            stakeDeregistration: 'Stake address unregistered',
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
                votedVotes: 'Voted with {votes} {votes, plural, one {vote} other {votes}}',
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
                tronNote: 'Note',
                feeRate: 'Fee rate',
                rbf: 'RBF',
                lockTime: 'Lock time',
                broadcast: 'Broadcast',
                transactionId: 'Transaction ID',
                transactionIdCopied: 'Transaction ID copied',
                memo: 'Memo',
                memoCopied: 'Memo copied',
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
                changeAddresses: 'Change {count,plural, one {address} other {addresses}}',
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
            subtitle: 'Follow the on-screen instructions.',
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
            portfolioTracker: 'Track your assets without connecting your Trezor',
            connected: 'Connected',
            disconnected: 'Disconnected',
            bootloader: 'Bootloader mode',
        },
        defaultHeader: 'Hi there!',
        wallet: {
            standard: 'Standard wallet',
            defaultPassphrase: 'Passphrase wallet #{index}',
        },
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
            description: 'Enable camera access in your device settings.',
            grantPermissionButton: 'Grant permission',
        },
    },
    graph: {
        retrievingData: 'Loading graph...',
        errorMessage: 'There are some problems loading the graph: ',
        tryAgain: 'Try again',
        retrievengTakesLongerThanExpected:
            'Your balances are taking longer to load. \n Check your internet connection.',
        timeSwitch: {
            day: '1D',
            week: '1W',
            month: '1M',
            sixMonths: '6M',
            year: '1Y',
            all: 'ALL',
        },
    },
    modulePassphrase: {
        title: 'Passphrase',
        subtitle:
            'Entering a <bold>passphrase opens a distinct wallet</bold> secured by that specific phrase.',
        featureAuthorizationError: "The passphrase you've entered is incorrect.",
        alertCard: {
            paragraphWarning1:
                "It's essential to understand how a passphrase works before using it.",
            paragraphWarning2:
                'Store your passphrase separately from your wallet backup and Trezor device.',
            paragraphWarning3: 'No one can recover it, not even Trezor support.',
            button: 'How passphrase works',
        },
        form: {
            createWalletInputLabel: 'Enter passphrase',
            verifyPassphraseInputLabel: 'Re-enter your passphrase',
            enterWallet: 'Enter passphrase',
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
            title: 'Checking passphrase wallet for balances & transactions...',
            subtitle: 'This might take up to a minute.',
        },
        confirmOnDevice: {
            title: 'Confirm passphrase\non your Trezor',
            description: "Go to your device and confirm the passphrase you've entered.",
            warningSheet: {
                title: 'Cancel opening this Passphrase wallet?',
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
            subtitle: "You're trying to enter a passphrase wallet that's already been opened.",
            button: 'Proceed to passphrase wallet',
        },
        passphraseFeatureUnlock: {
            title: 'Enter passphrase to continue',
        },
    },
    moduleSend: {
        accountsList: {
            title: 'Send',
        },
        defi: {
            banner: {
                title: '{token} represents your position in a vault.',
                description:
                    'If you transfer this token elsewhere, you will move your entire position and stop future rewards.',
            },
        },
        outputs: {
            title: '{assetName} Send',
            correctNetworkMessage:
                "Make sure that you're sending to an address\non {networkName} network. <link>Learn more</link>",
            tokenOfNetworkSheet: {
                title: "You're about to send {tokenSymbol} that runs on {networkName} network.",
                body: {
                    self: {
                        subtitle: 'Sending to yourself?',
                        text: 'Make sure your exchange or wallet supports this token on {networkName} network.',
                    },
                    outside: {
                        subtitle: 'Sending to someone else?',
                        text: "Check with them if they're alright with receiving this token on {networkName} network.",
                    },
                },
                warning: 'Sending to the wrong network might result in loss of funds.',
            },
            recipients: {
                title: 'Recipient & amount',
                addressLabel: 'Recipient address',
                autocorrect: {
                    convertedToLowercase: 'The address has been converted to lowercase.',
                    addedBitcoincashPrefix:
                        'The address has been updated with the bitcoincash: prefix.',
                },
                checksum: {
                    label: "We've adjusted the casing of your address to match checksum format. <link>Learn more</link>",
                    alert: {
                        title: 'This address needs to be converted to checksum format.',
                        body: 'This will adjust the casing of your address to match the checksum format and allow us to properly validate your address. <link>Learn more</link>',
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
                qrNetworkMismatch:
                    'This QR code is for {qrNetwork}, but your account is on {accountNetwork}. Make sure to switch to the correct network.',
                amountLabel: 'Amount to be sent',
                maxButton: 'Send max',
                destinationTag: {
                    label: 'Memo/Destination tag',
                    warning:
                        "Online exchanges require this to identify your account. Get your memo/destination tag from your {network} account. Make sure you really don't need it.",
                    info: 'Online exchanges require this to identify your account. Get your memo/destination tag from your exchange.',
                    linkText: "<link>What's this?</link>",
                },
                smartContract: {
                    alert: {
                        title: 'This is a smart contract address.',
                        description:
                            'Accidentally sending to a smart contract address may result in the loss of funds.',
                        primaryButton: 'I understand',
                    },
                },
                solana: {
                    memo: {
                        label: 'Memo',
                        addButton: 'Add memo',
                        inputPlaceholder: 'Enter your memo',
                        saveButton: 'Save',
                        removeButton: 'Remove',
                    },
                },
            },
        },
        tron: {
            accountActivationFee: 'Activation fee',
            accountActivationFeeTitle: 'Activation fee',
            accountActivationFeeDescription:
                'New TRON accounts require a one-time 1 {networkDisplaySymbol} network fee to activate.',
            note: {
                label: 'Note',
                addButton: 'Add note',
                inputPlaceholder: 'Enter your note',
                saveButton: 'Save',
                removeButton: 'Remove',
                info: 'Adds 1 {networkDisplaySymbol} to the network fee.',
            },
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
                bottomSheet: {
                    total: 'Total fee',
                },
            },
            error: "You don't have enough balance to use this fee.",
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
            deviceDisconnectedAlert: {
                title: 'Trezor disconnected',
                description: 'Reconnect your Trezor to continue.',
                primaryButton: 'Reconnect Trezor',
            },
            destinationTagTitle: 'Confirm the XRP destination tag on your Trezor',
            address: {
                title: 'Verify the address',
                step1: 'Go to the app or website where you originally got the address.',
                step2: "Compare the original address with what's on your Trezor.",
                step3: 'If they match exactly, confirm on your Trezor.',
                originBottomSheet: {
                    title: "What's the place of origin?",
                    subtitle: "Think of how you've initially retrieved the address.",
                    exchange: {
                        header: 'Online exchange',
                        body: 'The original address can be found in the “receive” or “deposit” section of your online exchange.',
                    },
                    person: {
                        header: 'Person or a friend',
                        body: "If you got it from a friend or a person, they've likely sent it to you through some messaging platform.",
                    },
                },
                compareBottomSheet: {
                    why: {
                        header: 'Why compare?',
                        body: 'Checking your Trezor against the original address is the only truly secure way of checking for mistakes or hacks.',
                    },
                    how: {
                        header: 'How to compare?',
                        body: 'Always check both addresses against each other. Character for character, end to end.',
                    },
                },
            },
            outputs: {
                title: 'Confirm on Trezor',
                submitButton: 'Send transaction',
                errorAlert: {
                    secondaryButtonTitle: "I'll do it later",
                    generic: {
                        title: 'Transaction failed',
                        description: 'Something went wrong. Try again.',
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
                invariability: "Your Trezor's model or color appears to have been manipulated.",
                entropy: 'Security check (entropy verification) failed.',
            },
            steps: {
                disconnectDevice: 'Disconnect your device from your phone.',
                avoidUsingDevice: 'Avoid using this device or sending any funds to it.',
                contactSupport: 'Continue to Trezor Support and use the Chat option.',
            },
            buttonContactSupport: 'Contact Trezor Support',
        },
    },
    earn: {
        staking: 'Staking',
        defiYield: 'DeFi Yield',
        poweredBy: 'Powered by',
        feeEstimationFailed:
            "The network fee couldn't be estimated, so the transaction can't be prepared. Try again later.",
        stakingOperatedByProviders: 'Staking is operated by independent providers',
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
        },
        stakingDetailScreen: {
            title: 'Staking',
        },
        stakingManagementScreen: {
            yourStake: 'Your stake',
            stakedLabel: 'Staked',
            totalRewardsLabel: 'Total rewards',
            autoRestakedBadge: 'Automatically restaked',
            nextRewardLabel: 'Next reward in ~{value, plural, one {# day} other {# days}}',
            solRewardsFrequencyLabel: 'Rewards every ~{value, plural, one {# day} other {# days}}',
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
            outsideStakingBanner: {
                title: "You're staking outside of Trezor Suite.",
                description: '{amount} {symbol} (≈ {fiat}) is currently staked elsewhere.',
            },
            solRewardsWarning:
                'Your recent rewards are securely on the blockchain and may take more time to appear in Trezor Suite.',
            rewardsList: {
                title: 'Total rewards',
                itemLabel: 'Reward',
                epoch: 'Epoch number {epoch}',
                empty: {
                    title: 'No rewards',
                    description:
                        'Your rewards will appear within {days, plural, one {# day} other {# days}}.',
                },
            },
            claim: {
                readyToClaim: '{amount} unstaked and ready to claim',
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
                stepStakedReceivingRewards: 'Staked & earning rewards',
                stepWithdrawalPeriod:
                    'Withdrawal period (~{days, plural, one {# day} other {# days}})',
                stepReadyToClaim: 'Ready to claim',
            },
        },
        yieldInsufficientBalance: {
            title: "You don't have enough {tokenSymbol}",
            subtitle: 'Get more {tokenSymbol} in this account to start earning yield.',
            getButton: 'Get more {tokenSymbol}',
        },
        earnConsentsScreen: {
            title: 'Before you continue',
            entryPeriodCard: {
                title: 'Confirm entry period',
                firstItem: 'The entry period currently takes up to {entryPeriodInDays} days.',
                secondItem: "You can't cancel your stake during this period.",
            },
            delegatingCard: {
                title: 'Delegate to Everstake',
                firstItem:
                    'Everstake maintains and protects your staked {displaySymbol} with their smart contracts, infrastructure, and technology.',
                secondItem:
                    "When you stake, the responsibility for your funds' security transitions from your Trezor to Everstake.",
            },
        },
        earnTransactionDataReviewScreen: {
            title: 'Confirm on Trezor',
            successMessage: 'You’re all set',
            viewTransactionButton: 'Stake now',
            pushTransactionFailedAlert: {
                title: 'Transaction failed',
                description: 'Failed to complete your staking transaction. Try again.',
                primaryButton: 'Go to Dashboard',
            },
            pendingTransactionConflictAlert: {
                title: 'Pending transaction detected',
                description:
                    'A staking transaction is already pending for this account. Wait for it to confirm before staking again.',
                primaryButton: 'Go to Dashboard',
            },
        },
        unstakeTransactionDataReviewScreen: {
            title: 'Confirm on Trezor',
            successMessage: "You're all set",
            viewTransactionButton: 'Unstake now',
            pushTransactionFailedAlert: {
                title: 'Transaction failed',
                description: 'Failed to complete your unstaking transaction. Try again.',
                primaryButton: 'Go to Dashboard',
            },
            pendingTransactionConflictAlert: {
                title: 'Pending transaction detected',
                description:
                    'An unstaking transaction is already pending for this account. Wait for it to confirm before unstaking again.',
                primaryButton: 'Go to Dashboard',
            },
        },
        earnUnstakeOutputItem: {
            title: 'Unstake',
            description: 'Unstake {displaySymbol} from stake account?',
            descriptionEverstake: 'Unstake {displaySymbol} from Everstake?',
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
            descriptionEverstake: 'Claim {displaySymbol} from Everstake?',
        },
        earnFormScreen: {
            title: '{assetName} staking',
            unstakeTitle: 'Unstake {displaySymbol}',
            staked: 'Staked',
            unstakingTimeline: 'Unstaking timeline',
            unstakingPeriodInfo:
                'The unstaking period is currently {days, plural, one {~# day} other {~# days}}.',
            networkFeeWarning:
                'Network fees may exceed this amount. Your balance may decrease. Enter a higher amount.',
            reviewAndSign: 'Review & sign',
            amountLabel: 'Amount',
            stakeMaxButton: 'Stake max',
            unstakeMaxButton: 'Unstake max',
            withdrawalFeesBanner:
                "We've left {amount} {displaySymbol} in your account so you can pay withdrawal fees.",
            insufficientBalanceBanner:
                'Not enough {displaySymbol}. Staking requires at least {minAmount} {displaySymbol} plus network fees.',
            insufficientBalanceBannerButton: 'Buy {displaySymbol}',
            estimatedRewardsLabel: 'Estimated yearly rewards',
            validation: {
                amountIsZero: 'Amount must be greater than 0.',
                amountBelowMinimum: 'Amount must be at least {amount} {symbol}.',
                amountExceedsMax: 'The amount exceeds the maximum allowed value of {maxAmount}.',
                insufficientBalance: 'Insufficient balance to stake this amount.',
                feeBufferReserve:
                    'Insufficient funds remaining after we reserve for withdrawal fees.',
                tooManyDecimals: 'Too many decimal places.',
            },
            estimatedRewardsPlaceholder: 'Enter amount to see rewards',
        },
        unstakeFormScreen: {
            validation: {
                amountIsZero: 'Amount must be greater than 0.',
                amountExceedsMax: 'The amount exceeds the maximum allowed value of {maxAmount}.',
                invalidUnstakeAmount:
                    "Due to recent Solana blockchain changes, this amount can't be unstaked.\n\nTry {higher}{higherFiat},\n\nor {lower}{lowerFiat}.",
                invalidUnstakeAmountHigherOnly:
                    "Due to recent Solana blockchain changes, this amount can't be unstaked.\n\nTry {higher}{higherFiat}.",
                insufficientBalance: 'You don’t have enough staked balance to unstake this amount.',
                tooManyDecimals: 'Too many decimals places.',
            },
        },
        unstakeFlowScreen: {
            canClaimWarning:
                'You can already claim {amount}. Claim now or wait until your new unstake is processed.',
            instantlyAvailable: {
                label: 'Instantly available (est.)',
                infoTitle: 'Instantly available (estimate)',
                infoDescription:
                    'The liquidity of the staking pool can allow for instant unstake of some funds. The remaining funds will follow the unstaking period.',
            },
            accountLimitBanner:
                'Due to Solana transaction size restriction, you can unstake from {limit} accounts at once. In the next transaction you can unstake up to {amount} {symbol}. To unstake more, repeat the process.',
        },
        earnScreen: {
            title: 'Earn',
            otherOpportunities: 'Other opportunities',
            depositsCard: {
                title: 'Your deposits',
                networkStaking: '{networkName} staking',
                availableRewards: 'Available rewards',
                claimRewardsButton: 'Claim rewards',
                incompleteFiatTotal: 'Some fiat rates couldn’t load. Total may be incomplete.',
            },
            activeSheet: {
                stakingTitle: 'Your stakes',
                stablecoinYieldTitle: 'Your yields',
            },
            claimRewards: {
                title: 'Claim rewards from an account',
            },
            stablecoinYieldLoadError: {
                title: 'Unable to load yield opportunities',
                description:
                    'This may be due to a network or connectivity issue. Check your connection and try again.',
            },
            chooseAccountSheet: {
                title: 'Choose account',
            },
            earnItem: {
                rewards: 'Rewards',
                pending: 'Activation pending',
            },
            infoModal: {
                title: 'Manage {earnType} in the Trezor Suite desktop app',
                subtitle: 'Go to the link below on your computer and download the desktop app.',
                copyLabel: 'Hold to copy',
            },
            enableNetworkModal: {
                title: 'Enable {networkName} to start staking',
                subtitle:
                    'Grow your crypto by locking it to help secure the {networkName} network—and earn rewards in return.',
                cta: 'Enable {networkName}',
                defiYield: {
                    title: 'Enable {networkName} to use DeFi Yield',
                    subtitle:
                        'Add the {networkName} network to deposit eligible assets and earn yield.',
                    cta: 'Enable {networkName}',
                },
            },
            adaInfo: 'Your ADA stays fully accessible while earning rewards.',
        },
        howStakeWorksScreen: {
            title: 'How {displaySymbol} staking works',
            subtitle:
                'Earn rewards by temporarily locking your {displaySymbol} and helping secure the network.',
            benefits: {
                first: {
                    title: '{apy}% APY with automatic compounding',
                    description: 'Rewards are automatically restaked.',
                },
                second: {
                    title: 'Staked {displaySymbol} is locked',
                    description: "You can't send or swap it while staked",
                },
                third: {
                    title: 'Unstake to get your funds in ~{days, plural, one {# day} other {# days}}',
                    description: {
                        ethereum:
                            'After entry period, you can unstake anytime. Your funds will be available within ~{days, plural, one {# day} other {# days}}.',
                        solana: 'After warm-up period, you can unstake anytime. Your funds will be available within ~{days, plural, one {# day} other {# days}}.',
                    },
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
        howYieldWorksScreen: {
            defiYieldTitle: 'How DeFi Yield works',
            defiYieldSubtitle: 'Put your assets to work and earn rewards.',
            benefits: {
                first: {
                    title: 'The deposited amount of {tokenSymbol} is always available.',
                    description: 'Withdrawal is instant.',
                },
                second: {
                    title: 'Rewards overview',
                    description:
                        'Most rewards compound automatically—some must be claimed manually.',
                },
                third: {
                    title: 'Deposit {tokenSymbol} to receive {vaultTokenSymbol}',
                    description: 'This is your vault position.',
                },
                fourth: {
                    title: 'You will also earn {bonusRewardTokenName} tokens as rewards.',
                    description: 'These must be claimed separately.',
                },
            },
            timelineCardTitle: 'Deposit timeline',
            timelineBottomSheetTitle: 'Deposit timeline',
            depositTimelineTitle: 'Deposit',
            depositTimeline: {
                first: {
                    title: 'Approve spending transaction',
                    description: 'Network fee',
                },
                second: {
                    title: 'Sign deposit transaction',
                    description: 'Network fee',
                },
                third: {
                    title: 'Earn rewards as your assets grow in value',
                    description: '~{apy}% APY',
                },
            },
            withdrawTimelineTitle: 'Withdraw',
            withdrawTimeline: {
                first: {
                    title: 'Sign withdrawal transaction',
                    description: 'Network fee',
                },
                second: {
                    title: 'Receive {tokenSymbol} in account',
                    description: 'Instantly',
                },
            },
        },
        yieldConsentsScreen: {
            title: 'Before you continue',
            providerCard: {
                title: 'Deposit to {providerName}',
                firstItem:
                    '{providerName} maintains and protects your supplied {tokenSymbol} with their smart contracts, infrastructure, and technology.',
                secondItem:
                    "When you deposit, the responsibility for your funds' security transitions from your Trezor to {providerName}.",
                thirdItem:
                    'Supplying assets involves smart contract risks. {providerName} applies rigorous security measures, but cannot guarantee against all losses.',
            },
        },
        yieldDepositFlowScreen: {
            step: 'Step {stepNumber} of {stepCount}',
            approvalStepTitle: 'Select amount & approve',
            modalTitle: 'Deposit',
            depositTransactionStepTitle: 'Deposit transaction',
            depositPendingTitle: 'Confirming deposit',
            amountToDeposit: 'Amount to deposit',
            depositMax: 'Deposit max',
            balance: 'Balance:',
            approvedAmount: 'Approved amount',
            approvalLimit: 'Approval limit',
            increaseApprovalLimit: 'Increase approval limit',
            revokeApproval: 'Revoke approval',
            perDeposit: 'Per deposit',
            estimatedRewardsLabel: 'Estimated yearly rewards',
            approvalLimitSheet: {
                title: 'Select approval limit',
                perDeposit: {
                    description:
                        'Approve the exact amount for the provider. Valid until fully used or revoked. Then a new approval and network fee will be required.',
                },
                unlimited: {
                    title: 'Unlimited',
                    description:
                        'Approve once and avoid future network fees. This provider can spend any amount until you revoke the approval.',
                    alert: 'If the provider is compromised, all your {tokenSymbol} may be taken.',
                },
            },
            validation: {
                amountIsZero: 'Amount must be greater than 0.',
                insufficientBalance: "You don't have enough {tokenSymbol} balance.",
                tooManyDecimals: 'Too many decimals.',
            },
            alerts: {
                approvalUnavailable: {
                    title: 'Approval unavailable',
                    description: 'Approval could not be prepared. Check the amount and try again.',
                },
                approvalReviewUnavailable: {
                    title: 'Approval review unavailable',
                    description:
                        'Approval review could not be prepared. Check the selected fee and try again.',
                },
                revokeReviewUnavailable: {
                    title: 'Revoke approval review unavailable',
                    description:
                        "Revoke approval review couldn't be loaded. Check the selected fee and try again.",
                },
                revokeUnavailable: {
                    title: 'Revoke approval unavailable',
                    description:
                        "Revoke approval couldn't be loaded. Check the approval and try again.",
                },
                depositUnavailable: {
                    title: 'Deposit unavailable',
                    description: 'Deposit could not be prepared. Check the amount and try again.',
                },
                approvalTooLow: {
                    title: 'Approval is too low. Change approval or lower amount to supply.',
                    primaryButton: 'Change approval',
                },
                approvalIncreaseRequiresRevoke: {
                    title: 'To increase your approval, you must first revoke the current allowance.',
                },
                transactionFailed: {
                    title: 'Transaction failed',
                    description:
                        'The transaction failed on the network. Check the details and try again.',
                },
                approvalResetNotSupported: {
                    title: 'Approval reset not supported',
                    description:
                        'This deposit needs an approval reset first. Revoke is not supported on mobile yet.',
                },
            },
            depositCompleteStepTitle: 'Deposit complete',
        },
        yieldDepositRevokeScreen: {
            title: 'Revoke {tokenSymbol} spending',
            subtitle: 'Revoke this provider’s access to spend your {tokenSymbol}.',
            lowLimitInfoAlert:
                'The spending limit too low. Revoke the current spending limit and approve a higher amount.',
            account: 'Account',
            provider: 'Provider',
            limit: 'Limit',
            pendingTitle: 'Confirming revoke...',
        },
        yieldWithdrawFlowScreen: {
            withdrawalAmount: 'Withdrawal amount',
            withdrawMax: 'Withdraw max',
            deposited: 'Deposited:',
            withdrawPendingTitle: 'Confirming withdrawal',
            amountToWithdraw: 'Amount to withdraw',
            amountExceedsDeposited: 'The amount exceeds your deposited balance.',
            networkFeeWarning:
                'Network fees may exceed this amount. Your balance may decrease. Enter higher amount.',
            maxWithdrawInfo:
                'Amount switched to {vaultTokenSymbol} to withdraw your entire balance, including yield earned up to the moment the transaction is processed.',
            title: 'Withdraw',
            supplied: 'Supplied:',
            maximumFee: 'Maximum fee',
            feeToBeCalculated: 'To be calculated',
            amountExceedsSupplied: 'The amount exceeds your supplied balance.',
            validation: {
                amountIsZero: 'Amount must be greater than 0.',
                tooManyDecimals: 'Too many decimals.',
            },
        },
        yieldClaimFlowScreen: {
            title: 'Claim rewards',
            rewards: 'Rewards',
            noRewards: 'No rewards to claim.',
            claimPendingTitle: 'Confirming claim',
            feeWarning: {
                title: 'Network fees may exceed rewards.',
                description: 'Consider waiting for your rewards to grow before claiming.',
            },
            unverifiableFeeWarning: {
                title: "Rewards value can't be verified.",
                description:
                    "We couldn't determine the value of your rewards. Make sure the network fee doesn't exceed the rewards you're claiming.",
            },
            alerts: {
                reviewMismatch: {
                    title: "Claim couldn't be verified",
                    description:
                        "The rewards to claim didn't match the transaction details, so nothing was signed and no funds moved. Tap Continue to try again with refreshed data. If the issue persists, contact Trezor Support.",
                },
            },
        },
        yieldDepositApprovalReviewScreen: {
            title: 'Review with Trezor',
            submitButton: 'Approve',
            successMessage: "You're all set",
        },
        yieldDepositRevokeReviewScreen: {
            title: 'Review with Trezor',
            successMessage: 'Revoke approval transaction signed',
            submitButton: 'Revoke',
        },
        yieldDepositReviewScreen: {
            title: 'Review with Trezor',
            submitButton: 'Deposit',
            successMessage: "You're all set",
        },
        yieldWithdrawReviewScreen: {
            title: 'Review with Trezor',
            submitButton: 'Withdraw',
            redeemSubmitButton: 'Redeem',
            successMessage: "You're all set.",
        },
        yieldClaimReviewScreen: {
            title: 'Review with Trezor',
            submitButton: 'Claim now',
            successMessage: "You're all set.",
        },
        yieldDepositCompleteScreen: {
            title: 'Deposit complete',
            subtitle: 'Your deposit is now earning yield in the vault.',
        },
        yieldWithdrawCompleteScreen: {
            title: 'Withdrawal complete',
            subtitle: 'Your funds have been withdrawn from the vault.',
        },
        yieldClaimCompleteScreen: {
            title: 'Claim complete',
            subtitle: 'Rewards added to your balance.',
        },
        yieldCompleteScreen: {
            status: 'Status',
            completed: 'Completed',
            apy: 'APY',
            received: 'Received',
            rewards: 'Rewards',
            sent: 'Sent',
            deposited: 'Deposited',
            withdrawalAmount: 'Withdrawal amount',
            backToOverview: 'Back to overview',
        },
        yieldReview: {
            outputs: {
                claimTitle: 'Claim rewards from',
                depositAmount: 'Deposit amount',
                depositDescription: 'Review details to deposit to vault.',
                depositTitle: 'Deposit',
                depositTo: 'Deposit to',
                redeemAmount: 'Redeem amount',
                redeemDescription: 'Review details to redeem from vault.',
                redeemFrom: 'Redeem from',
                redeemTitle: 'Redeem',
                rewardTokens: 'Reward tokens',
                withdrawAmount: 'Withdraw amount',
                withdrawDescription: 'Review details to withdraw from vault.',
                withdrawFrom: 'Withdraw from',
                withdrawTitle: 'Withdraw',
            },
            alerts: {
                primaryButton: 'Go to homepage',
                approval: {
                    pushTransactionFailed: {
                        title: 'Approval was not submitted',
                        description:
                            'The approval transaction was signed but could not be submitted to the network.',
                    },
                    pendingTransactionConflict: {
                        title: 'Approval was not submitted',
                        description:
                            'There is already a pending transaction for this account. Wait for it to finish before trying again.',
                    },
                },
                revoke: {
                    pushTransactionFailed: {
                        title: 'Revoke approval transaction not broadcast',
                        description:
                            "The revoke transaction was signed but couldn't be broadcast to the network.",
                    },
                    pendingTransactionConflict: {
                        title: 'Revoke approval transaction not broadcast',
                        description:
                            'A revoke approval transaction is already pending for this account. Wait for it to complete and try again.',
                    },
                },
                deposit: {
                    signTransactionFailed: {
                        title: 'Transaction was not signed',
                        description: 'Review the transaction and sign it again.',
                    },
                    pushTransactionFailed: {
                        title: 'Deposit was not submitted',
                        description:
                            'The deposit transaction was signed but could not be submitted to the network.',
                    },
                    pendingTransactionConflict: {
                        title: 'Deposit was not submitted',
                        description:
                            'There is already a pending transaction for this account. Wait for it to finish before trying again.',
                    },
                },
                withdraw: {
                    signTransactionFailed: {
                        title: 'Transaction was not signed',
                        description: 'Review the transaction and sign it again.',
                    },
                    pushTransactionFailed: {
                        title: 'Withdraw was not submitted',
                        description:
                            'The withdraw transaction was signed but could not be submitted to the network.',
                    },
                    pendingTransactionConflict: {
                        title: 'Withdraw was not submitted',
                        description:
                            'There is already a pending transaction for this account. Wait for it to finish before trying again.',
                    },
                },
                claim: {
                    signTransactionFailed: {
                        title: 'Transaction was not signed',
                        description: 'Review the transaction and sign it again.',
                    },
                    pushTransactionFailed: {
                        title: 'Claim was not submitted',
                        description:
                            'The claim transaction was signed but could not be submitted to the network.',
                    },
                    pendingTransactionConflict: {
                        title: 'Claim was not submitted',
                        description:
                            'A transaction is already pending for this account. Wait for it to finish before trying again.',
                    },
                },
            },
            depositCard: {
                title: 'Deposit',
            },
            withdrawCard: {
                title: 'Withdraw',
            },
            receiveCard: {
                title: 'Receive',
            },
            transactionDetailsCard: {
                title: 'Transaction details',
            },
            approvalCard: {
                title: 'Approve',
            },
            approvalDetailsCard: {
                title: 'Approval details',
                approvalLimit: 'Approval limit',
            },
        },
        staked: 'Stake',
        stakedAutomatically: 'Staked automatically',
        fullBalance: 'Full balance',
        rewards: 'Rewards',
        rewardsPerEpoch: 'Next estimated reward',
        apy: 'Annual Percentage Yield',
        apr: 'Annual Percentage Return',
        apyAbbr: 'APY',
        aprAbbr: 'APR',
        tron: {
            votes: 'Votes',
            allVotesUsed: 'All {count} votes used',
            votesRemaining:
                '{count, plural, one {1 remaining vote} other {{count} remaining votes}}',
            votesBottomSheet: {
                title: 'Assign all votes to earn more rewards.',
                description: 'Staking can currently be managed only in Trezor Suite for desktop.',
            },
            votesAlertText:
                'Assign {count, plural, one {1 remaining vote} other {{count} remaining votes}} to earn more rewards.',
            readyToWithdrawAlert: '{amount} TRX unstaked and ready to withdraw.',
            unstakingCardTitle: 'Unstaking (~{days} days)',
        },
        stakingCanBeManaged: 'Manage your staking accounts in the',
        trezorDesktop: 'Trezor Suite desktop app.',
        adaStaysFullyAccessuble: 'Your ADA stays fully accessible while earning rewards.',
        infoBanner: {
            updateProviderTitle: 'Save your ADA rewards by updating your staking provider',
            newProviderTitle: 'Earn ~{apy}% APY with our new provider',
            updateProviderButton: 'Update provider',
            providerReducingRewards:
                "You're earning nearly 0% in ADA rewards right now. Switch to Everstake to earn up to {apy}% APY. Your funds and past rewards are safe.",
            updateToNewProvider:
                'Update to our new provider, Everstake, and earn ~{apy}% APY. Your {symbol} with our previous provider is safe, and your rewards stay intact, though rates aren’t guaranteed.',
            rewardsReduced: 'Cardano staking rewards reduced',
        },
        notAvailable: 'Not available',
        apyNotAvailable: 'APY not available',
        apyPercentage: '~{apy}% APY',
        aprPercentage: '~{apy}% APR',
        notAvailableShort: 'N/A',
        messageSystem: {
            depositDisabled: 'Deposit is currently disabled.',
            withdrawDisabled: 'Withdrawal is currently disabled.',
            claimDisabled: 'Claim is currently disabled.',
        },
        stakePendingCard: {
            totalStakePending: 'Total stake pending',
            addingToStakingPool: 'Adding to staking pool',
            activatingStake: 'Activating stake',
            totalStakeActivating: 'Total stake activating',
            transactionPending: 'Transaction pending',
        },
        claimReviewScreen: {
            title: 'Claim {displaySymbol}',
            reviewAndSignButton: 'Review & sign',
            amountLabel: 'Amount',
            instantClaimBanner: "You'll claim the {displaySymbol} instantly",
            accountLimitBanner:
                'Due to Solana transaction size restriction, you can claim from {limit} accounts at once. In the next transaction you can claim up to {amount} {symbol}. To claim more, repeat the process.',
            insufficientFeeBalance: {
                title: 'Insufficient {displaySymbol} to cover the transaction fee.',
                description: 'You only have {amount} available.',
            },
        },
        claimTransactionDataReviewScreen: {
            title: 'Confirm on Trezor',
            successMessage: "You're all set",
            viewTransactionButton: 'Claim now',
            pushTransactionFailedAlert: {
                title: 'Transaction failed',
                description: 'Failed to complete your claim transaction. Try again.',
                primaryButton: 'Go to Dashboard',
            },
            pendingTransactionConflictAlert: {
                title: 'Pending transaction detected',
                description:
                    'A claim transaction is already pending for this account. Wait for it to confirm before claiming again.',
                primaryButton: 'Go to Dashboard',
            },
        },
        claimableCard: {
            claimable: 'Claimable',
            claimButton: 'Claim',
            readyToClaim: '{amount} ready to be claimed',
        },
        stakingBottomSheet: {
            title: 'Manage staking in the Trezor Suite desktop app',
            description:
                'Staking accounts can be viewed but not managed in the Trezor Suite mobile app.',
        },
        claimSummaryOutputItem: {
            title: 'Total including fee',
        },
    },
    moduleTrading: {
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
            noRefund: 'KYC is only required in exceptional cases. It may be needed for refunds.',
            yesRefund: "KYC is only required in exceptional cases. It's not needed for refunds.",
            kycRequired: 'KYC is required.',
        },
        tradingScreen: {
            receiveAccount: 'Receive account',
            receiveMethod: 'Receive method',
            paymentMethod: 'Payment method',
            noPaymentMethod: 'No payment method selected',
            noReceiveMethod: 'No receive method selected',
            selectedProvider: 'Selected provider',
            selectedPaymentMethod: 'Selected payment method',
            selectedReceiveMethod: 'Selected receive method',
            provider: 'Provider',
            quotesLoadingLabel: 'Searching for your best offer...',
            footer: {
                termsOfProvider:
                    'This service is offered by {companyName}, not Trezor. <link>Terms apply</link>',
                termsAndConditionsGeneric:
                    'This service is offered by a third-party provider, not Trezor. Provider’s terms apply.',
                howTradingWorksSheet: {
                    title: 'How trading works',
                    sheetTitle: 'How trading with Trezor works',
                    item1: 'Trezor compares trusted exchange providers to find the best offer',
                    item2: 'Providers use your location only to show relevant offers',
                    item3: 'Trezor never sees your payment or KYC data\n<text>It’s shared only with the provider if you complete your trade.</text>',
                    item4: 'How fees are calculated',
                    item5: "Trezor's Terms of Use",
                },
            },
            balance: 'Balance:',
            providerOffer: 'Provider offer: {amount}',
            tabs: {
                buy: 'Buy',
                sell: 'Sell',
                exchange: 'Swap',
                settings: 'Advanced settings',
                concierge: 'Concierge',
            },
            concierge: {
                noProvidersAvailable: 'No providers available for this country.',
                alert: {
                    labelBuy:
                        'For buys over 50,000 EUR, use Concierge for competitive, private, and secure trades.',
                    labelSell:
                        'For sells over 50,000 EUR, use Concierge for competitive, private, and secure trades.',
                    ctaBuy: 'Buy with Concierge',
                    ctaSell: 'Sell with Concierge',
                },
                infoCard: {
                    title: 'Large trades, made simple',
                    description:
                        'Get private, competitive pricing for trades over 50,000 EUR, handled by a dedicated specialist.',
                    items: {
                        pricing: {
                            title: 'Competitive pricing',
                            description: 'Avoid slippage and get a tailored quote for your trade.',
                        },
                        specialist: {
                            title: 'Dedicated specialist',
                            description:
                                'One expert handles your trade and answers all your questions.',
                        },
                        execution: {
                            title: 'Expedited execution & settlement',
                            description:
                                'Lock in your price instantly. Funds typically arrive the next business day.',
                        },
                    },
                },
            },
            kycRequired: 'KYC is required.',
            buttons: {
                buyVia: 'Buy with {providerName}',
                sellVia: 'Sell with {providerName}',
                continue: 'Continue',
                revoke: 'Revoke approval',
            },
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
            amountLabel: 'You pay',
        },
        selectCoin: {
            title: 'You get',
            buttonTitle: 'Select asset',
            amountLabel: 'You get',
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
            allFilterTabTitle: 'All',
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
                        "It seems that you don't have any account matching selected asset.",
                },
                portfolioTracker: {
                    title: 'Account not found',
                    description:
                        "You don't have an account for this asset imported in Portfolio Tracker.",
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
            noQuotes: 'No offers found. Adjust the currency, assets, or amounts.',
            insufficientBalance: 'Insufficient funds',
            dustLimit: 'Amount is lower than the dust limit',
            networkReserve: 'Not enough {displaySymbol} remaining after reserving network fees',
        },
        tradingBuyPreviewScreen: {
            title: 'Complete your buy with {companyName}',
            subtitle: 'You’ll be redirected to provider’s website to finish the payment.',
            buyVia: 'Buy with {companyName}',
            youPay: 'You pay',
            youGet: 'You get',
        },
        transactionSimulation: {
            title: 'Simulation powered by Blockaid',
            simulating: 'Simulating transaction',
        },
        tradingExchangePreviewScreen: {
            title: 'Swap',
            fromAccount: 'From',
            toAccount: 'To',
            details: 'Transaction details',
            providerNamePlaceholder: 'Provider',
            providerReceiveAddressLabel: "{providerName}'s receive address",
            providerContractAddressLabel: "{providerName}'s contract address",
            confirmationAlertTitle: 'Failed to confirm offer.',
            approvalSuccessAlert: 'Spending approval confirmed.',
            eip712Info: {
                title: "You're swapping with {providerName}",
                bullet1: 'Simply sign the order—no need to send transactions manually',
                bullet2: 'No gas fees—the smart contract covers everything automatically',
                bullet3:
                    'Your swap may be completed in multiple parts, depending on market conditions',
            },
            fiatDeviationWarning: 'Receiving {percent} less in estimated value.',
        },
        tradingSellPreviewScreen: {
            title: 'Sell',
            fromAccount: 'From',
            toFiat: 'To',
            bankAccount: 'Bank account',
            verified: 'Verified',
            notVerified: 'Not verified',
            bankAccountSheetTitle: 'Select an account',
            providerStatus: {
                confirming: 'Provider is confirming your sell',
                waitingForAddress: "Waiting for the provider's receive address",
                upTo30Seconds: 'This may take up to 30 seconds.',
                startOver:
                    "If you didn't finish all steps on the provider's site, go back and start a new sell. Your funds are safe.",
                cannotBeCompletedAlert: {
                    title: "Your sell couldn't be completed",
                    description:
                        "We didn't receive confirmation from the provider. Your funds are safe in your account.",
                    button: 'Start a new sell',
                },
            },
        },
        composeAllowanceError: 'Failed to estimate approval fees. Try again.',
        confirmApprovalError: 'Failed to confirm approval. Try again.',
        tradingExchangeApprovalScreen: {
            approveTitle: 'Approve {symbol} spending',
            approveSubtitle: 'Approve provider to spend your {symbol} to swap.',
            revokeSuccessAlert: 'Revoke successful. Set a higher limit.',
            lowLimitInfoAlert:
                "You've approved this token, but the limit is too low. Increase it to continue.",
            limitLabel: 'Limit',
            currentLimitLabel: 'Current limit',
            newLimitLabel: 'New limit',
            unlimitedLabel: 'Unlimited',
            approveErrorAlert: 'Failed to approve token. Try again.',
        },
        tradingExchangeRevokeScreen: {
            revokeTitle: 'Revoke {symbol} spending',
            revokeSubtitle: 'Revoke provider to spend your {symbol} to swap.',
            lowLimitInfoAlert:
                'The spending limit too low. Revoke the current spending limit and approve a higher amount.',
            limitLabel: 'Limit',
            revokeErrorAlert: 'Error revoking spending limit. Try again.',
        },
        tradingReviewOutputs: {
            title: 'Confirm on Trezor',
            submitButton: 'Send transaction',
            signData: {
                heading: 'Sign EIP-712 typed data',
                address: 'Address',
                domain: 'Domain',
                message: 'Message',
            },
            tradedAssets: {
                recipient: 'Recipient',
            },
        },
        tradingConfirmationScreen: {
            approveHeaderTitle: 'Approve {symbol} spending',
            revokeHeaderTitle: 'Revoke {symbol} approval',
            approveTitle: 'Confirming approval',
            revokeTitle: 'Confirming revoke',
            subtitle: 'This may take a few moments.',
            pending: 'Pending',
            error: 'Failed to confirm transaction. Try again.',
            date: 'Date',
            exploreInBlockchain: 'Explore in blockchain',
            approvalPendingAlert:
                'Your approval is still processing. When confirmed, you’ll be able to use this approval with the same provider.',
            revocationPendingAlert:
                'Your revocation is still processing. When confirmed, the provider will no longer be able to spend your tokens.',
        },
        exchangeApprovalLimitSheet: {
            title: 'Set limit',
            unlimitedCard: {
                info: 'Approve once and avoid future network fees. This provider can spend any amount until you revoke the approval.',
                alert: 'If the provider is compromised, all your {coinSymbol} may be taken.',
            },
            limitedCard: {
                info: 'Approve this amount for the provider. Valid until fully used or revoked. Then a new approval and network fee will be required.',
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
                loading: 'Loading...',
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
                errorAlert: {
                    title: 'Transaction failed',
                    buyDescription:
                        "Your transaction failed or was rejected. Your payment method hasn't been charged.",
                    sellDescription:
                        'The transaction didn’t go through. Your funds are safe in your account.',
                    swapDescription:
                        'The transaction didn’t go through. Your funds are safe in your account.',
                    description:
                        "Your transaction failed or was rejected. Your payment method hasn't been charged.",
                },
                waitingAlert: {
                    title: 'Waiting for your payment ...',
                    description: "Click to complete your details on the provider's site.",
                    button: 'Proceed to pay',
                },
                convertingAlert: {
                    title: 'Converting your crypto...',
                    description: 'Your swap is being processed. This may take a few minutes.',
                },
                kycAlert: {
                    title: 'KYC is required',
                    description:
                        'Complete the identity verification process to continue with your transaction.',
                    button: 'Go to provider support',
                },
                sendingAlert: {
                    title: 'Sending your crypto...',
                    description: 'Your transaction is being processed. Wait for confirmation.',
                },
                buy: 'Buy',
                exchange: 'Swap',
                sell: 'Sell',
                checkOrderStatus: 'Check your order status on the provider’s website.',
                providerSupport: 'Go to provider support',
            },
        },
        error: {
            deviceOfflineDescription:
                'Trading needs an internet connection to be available. Check your mobile phone settings and try again.',
        },
        defaultSearchLabel: 'Search',
        notSelected: 'Not selected',
        networkName: 'Network name',
        providerListItem: {
            rate: 'Rate',
            decentralizedExchange: 'Decentralized exchange',
            centralizedExchange: 'Centralized exchange',
            anonymous: 'Anonymous',
            kycRequired: 'KYC is required',
        },
        myAssetSheet: {
            title: 'Your assets',
            searchInputPlaceholder: 'Search assets',
            emptyTitle: 'No assets found',
            emptyDescription: 'You do not have any assets available for this operation.',
            noPair: {
                note: 'No pair',
                toast: 'No trading pair',
            },
            nonTradeable: '+ {count} non-tradeable {count, plural, one{token} other{tokens}}',
        },
        slippage: {
            title: 'Maximum slippage',
            description:
                'Limit how much the rate can change before the transaction fails. Network fees always apply.',
            confirm: 'Confirm custom slippage',
            inputLabel: 'Slippage',
            maxSlippageLabel: 'Max. slippage',
            validation: {
                required: 'Slippage is required.',
                notNumber: 'Slippage must be a number.',
                outOfRange: 'Slippage must be between {min}% and {max}%.',
            },
            summary: {
                offered: 'Swap offer',
                deduction: 'Maximum slippage',
                minimum: 'Minimum received',
            },
        },
        browser: {
            noURL: 'No URL provided',
            browserLocked: 'Browser is locked.',
            browserError: 'An error occurred while opening the browser.',
        },
        advancedSettings: {
            slippage: {
                title: 'Maximum slippage',
                description:
                    "Set the maximum difference you're willing to accept. Higher means more likely to succeed, while lower may fail but protects your price.",
                confirm: 'Confirm custom slippage',
                inputLabel: 'Slippage',
            },
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
                'In the unlikely event of a firmware update issue, you may need your wallet backup to restore access. Check your wallet backup before you continue.',
            continueButton: 'Yes, I do',
            checkBackupButton: 'Check wallet backup',
        },
        versionCard: {
            title: 'Firmware',
            status: {
                upToDate: 'Up to date',
                updateAvailable: 'Update available',
                updateRequired: 'Update required',
            },
            currentFirmware: 'Current firmware version',
            newFirmware: 'New firmware version',
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
            newVersionAvailable: 'New firmware is available',
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
            subtitle: "Firmware is your Trezor's operating system.",
            list: {
                item1: {
                    update: 'This firmware update may take some time to complete.',
                    install: 'This firmware installation may take some time to complete.',
                },
                item2: '<b> Keep the app open while installing</b> —closing it may corrupt the firmware. ',
                item3: {
                    update: 'While the firmware is updating, leave your phone as is. It will remain on throughout the update.',
                    install:
                        'While the firmware is installing, leave your phone as is. It will remain on throughout the installation.',
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
            generalSubtitle: "Firmware is your Trezor's operating system.",
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
                '8': 'Trezor co-founder Marek "Slush" Palatinus launched the first Bitcoin mining pool.',
                '9': 'Since 2023, Trezor has taken direct control of its chip supply chain to enhance security.',
                '10': 'Trezor has earned the trust of users in over 150 countries worldwide.',
                '11': 'In January 2025, Trezor introduced the Trezor Safe 5 Freedom Edition, a limited release of just 2,100 devices.',
                title: 'Did you know?',
            },
            retryButton: 'Retry',
            contactSupportButton: 'Contact Trezor Support',
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
                'Only the most recent 100 transactions per token are shown. For the full history, view on the blockchain explorer.',
            confirmButton: 'Got it',
        },
    },
    atoms: {
        animatedDoubleView: {
            defaultSwitchLabel: 'Switch',
        },
    },
    transactionManagement: {
        stayOnScreenAlert: {
            title: 'Leave this screen?',
            removeButton: 'Leave',
            stayButton: 'Stay',
        },
        networkReserveBanner: {
            title: 'We’ve reserved {amount} {displaySymbol} to cover any extra network fees.',
            buttonTitle: 'Manage',
        },
        txValidityTimer: {
            countdown: '{seconds}s left to confirm',
            confirming: 'Confirming transaction...',
            expiredTitle: 'Transaction expired',
            expiredAlert: {
                title: 'Transaction confirmation expired',
                description: 'Your funds are safe. Try again to continue.',
            },
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
                bodyRipple:
                    'Transaction fees are burned (permanently destroyed), not paid to validators.',
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
                            lessThanPriority: "This fee can't be lower than Max priority fee.",
                            outOfRange: 'Enter a max fee per gas between {minFee} and {maxFee}',
                        },
                        maxPriorityFee: {
                            min: 'Max priority fee must be at least {minPriorityFee}',
                            higherThanMaxFee: "This fee can't be higher than Max fee per gas",
                        },
                    },
                    total: 'Total fee',
                    confirmButton: 'Confirm custom fee',
                },
                card: {
                    label: 'Custom',
                },
            },
            error: "You don't have enough balance to use this fee.",
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
                networkTestnet: 'This transaction is on a testnet network',
                signingWithLabel: 'Signing with',
                contractLabel: 'Token address',
                swapContractLabel: 'Swap contract address',
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
                noteLabel: 'Note',
                transactionDataLabel: 'Data',
                transactionDataEmpty: 'No data',
                transactionDataShowMore: 'Show more',
                transactionDataShowLess: 'Show less',
                recipientNameOutputLabel: 'Trading partner',
                tradedAssetsOutputLabel: 'My assets',
                tradedAssetsSendLabel: 'You send',
                tradedAssetsReceiveLabel: 'You receive',
                swapIntentLabel: 'Intent',
                swapIntentValue: 'Swap',
                summary: {
                    label: 'Total including fee',
                    totalAmount: 'Total amount',
                    amount: 'Amount',
                    fee: 'incl. Transaction fee',
                    maxFee: 'Maximum fee',
                },
                approveMaxAmount: 'Unlimited',
                noAccount: 'Account not found.',
                signSuccessMessage: "You're all set",
            },
            cancelAlert: {
                title: 'Cancel transaction?',
                continueButton: 'Continue editing',
            },
        },
        precomposedTransaction: {
            errors: {
                amountNotEnoughCurrencyFee:
                    'Insufficient {networkDisplaySymbol} to cover the transaction fee',
                amountIsNotEnough: "You don't have enough funds.",
                amountIsTooLow: 'Amount is too low.',
                amountIsLessThanReserve: 'Recipient account requires minimum reserve to activate.',
                stakeNotEnoughFunds: 'Insufficient funds for staking.',
                remainingBalanceLessThanRent:
                    'After sending this amount, your account will have SOL remaining lower than the rent.',
                amountNotEnoughCurrencyFeeWithEthAmount:
                    'Insufficient {networkDisplaySymbol} to cover the transaction fee',
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
            serverOfflineDescription: 'Something went wrong. Try again in a moment.',
            serverOfflineRetry: 'Try again',
            tradingTypeDisabledTitle: '{tradingType} disabled',
            portfolioTrackerTitle: 'Portfolio Tracker',
            portfolioTrackerDescription:
                'Selling & swapping are disabled. Connect your device to enable full functionality.',
            btcOnlyFirmwareTitle: 'Bitcoin-only firmware',
            btcOnlyFirmwareDescription:
                'Swapping is unavailable with Bitcoin-only firmware. To enable, switch to universal firmware.',
            notAvailableInCountryTitle: 'Trading is not yet available in your country',
        },
        providerLogo: 'Provider logo',
        quotesLoadingLabel: 'Searching for your best offer...',
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
            countrySubdivision: 'State of residence',
            noCountryOfResidence: 'No country of residence selected',
            selectedCountryOfResidence: 'Selected country of residence',
            noCountrySubdivision: 'No state selected',
            selectedCountrySubdivision: 'Selected state',
            notSelected: 'Not selected',
            selectCountrySubdivisionButton: 'Select state',
            selectCountrySubdivisionLabel:
                'To see available offers, select your state of residence.',
        },
        countrySheet: {
            title: 'Country of residence',
            emptyTitle: 'Country not found',
            emptyDescription: 'Check the spelling or browse the list to select an option.',
            searchInputPlaceholder: 'Search country',
        },
        countrySubdivisionSheet: {
            title: 'State of residence',
            emptyTitle: 'State not found',
            emptyDescription: 'Check the spelling or select from the list.',
            searchInputPlaceholder: 'Search state',
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
                trezorSafe7: 'Introducing the new Trezor Safe 7',
            },
            backCta: 'Back to Dashboard',
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
            deactivateToken: 'Deactivate token',
        },
        tokenSelection: {
            searchPlaceholder: 'Search token or address',
            activateManually: 'Activate token manually',
            noResults: 'No token found',
        },
        tokenDetail: {
            issuer: 'Issuer',
            issuerAddress: 'Issuer address',
            unknownIssuer: 'Unknown issuer',
        },
        networkFee: {
            token: 'Token',
            reserveInfo: 'This will increase your <link>reserved balance</link> by {reserve}.',
            reviewAndSign: 'Review & sign',
            activationFailed: 'Activation failed',
            activationFailedDescription: 'Failed to activate token. Try again.',
            unexpectedError: 'An unexpected error occurred. Try again.',
            insufficientBalance:
                'Insufficient funds. You need {required} but only have {available} available.',
        },
        manualInput: {
            title: 'Activate token manually',
            subtitle: 'To activate a token, enter its asset code and issuer address.',
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
            deactivationFailedDescription: 'Failed to deactivate token. Try again.',
            cantDeactivateTitle: "You can't deactivate a token with a balance",
            cantDeactivateDescription:
                'You need to transfer or convert your balance to zero first. Try selling for XLM.',
        },
    },
    networks: {
        initialSetup: {
            title: 'Add your networks',
            subtitle: 'Enable networks to buy or receive assets. Change your selection anytime.',
            banner: 'Change your networks anytime in Settings.',
        },
    },
    biometricsButton: 'Unlock with biometrics',
    search: {
        noResults: 'No results',
    },
};
