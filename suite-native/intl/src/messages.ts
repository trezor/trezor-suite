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
            gotIt: 'Got it',
            retry: 'Retry',
            tryAgain: 'Try again',
            edit: 'Edit',
            learnMore: 'Learn more',
            copy: 'Copy',
            understand: 'I understand',
            goBack: 'Go back',
        },
        validateForm: 'Validate form',
        savedToClipboard: 'Saved to clipboard',
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
        },
        tokens: '+ Tokens',
        unknownToken: 'Unknown token',
        warning: 'Warning',
    },
    icons: {
        networkIconHint: 'Network Icon',
        tokenIconHint: 'Token Icon',
    },
    stepCards: {
        stepper: 'Step {stepNumber} of {stepCount}',
    },
    messageSystem: {
        killswitch: {
            title: 'Update required',
            content: 'Update to continue using Trezor Suite. Your funds are secure.',
        },
    },
    forms: {
        errors: {
            mixed: {
                required: 'Field is mandatory',
            },
            string: {
                max: 'Character limit exceeded',
            },
        },
    },
    suiteSync: {
        label: 'Label',
        addLabel: 'Add label',
        enabledToast: 'Suite Sync turned on.',
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
            lazyLoadingError:
                'Something went wrong. Try restarting the app, and if it keeps happening, contact Trezor Support.',
        },
    },
    moduleHome: {
        emptyState: {
            getTrezorCta: {
                title: "Don't have a Trezor yet?",
                button: 'Get Trezor',
            },
        },
    },
    accounts: {
        accountLabelFieldHint: {
            letterCount: '{current} / {max} characters',
        },
        searchForm: {
            searchAccountsPlaceholder: 'Search accounts',
        },
    },
    accountList: {
        numberOfTokens: '+{numberOfTokens, plural, one{1 token} other{# tokens}}',
        staking: 'Staking',
    },
    assets: {
        priceChangePeriod: '7d',
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
                "Biometric authentication isn't set up on your phone. Configure it in your phone settings and try again.",
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
    moduleAddAccounts: {
        alerts: {
            tooManyAccounts: {
                title: 'You have reached the maximum number of accounts',
                description: 'You can create up to 10 accounts for each network.',
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
        selectAccountTypeScreen: {
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
    moduleConnectDevice: {
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
        pinCanceledDuringDiscovery: {
            title: "Some balances haven't been loaded.",
            subtitle: 'Unlock your Trezor to finish loading your balances.',
            button: 'Enter PIN',
        },
    },
    moduleConnectPopup: {
        simulation: {
            reviewTransaction: 'Review transaction',
            simulationPoweredBy: 'Simulation powered by {provider}',
            simulationStatusError: 'Unable to simulate transaction. Proceed at your own risk.',
            simulationStatusWarning:
                'This transaction appears suspicious. Make sure you trust the source before continuing.',
            simulationStatusMalicious:
                'Warning: this transaction looks malicious. We recommend you do not proceed with this app.',
            disclaimerOverride: 'Ignore warning and continue',
            contractInfo: 'Contract info',
            feeInfo: 'Fee info',
            protocol: 'Protocol',
            address: 'Address',
            contractFunction: 'Contract function',
            sendingAsset: 'Sending {amount}',
            receivingAsset: 'Receiving {amount}',
            crossChainAsset: '{amount} on {chain}',
        },
        connectionStatus: {
            loading: 'Loading...',
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
                bullet1: 'Close other apps that may be using your Trezor.',
                bullet2: 'Reconnect your Trezor',
            },
        },
        unsupportedFirmwareModal: {
            title: 'The connected Trezor device needs an update',
            description:
                'To continue using your Trezor with this app, update it using Trezor Suite for Desktop or Web.',
        },
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
        pinProtection: {
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
        },
        authenticity: {
            toast: {
                canceled: 'Device authenticity check canceled',
                error: 'Unable to authenticate your device: {error}',
                failed: 'Device authenticity check failed: {error}',
            },
        },
    },
    moduleSettings: {
        coinEnabling: {
            unsupportedSubtitle: 'Not supported on this device',
            labels: {
                testnets: 'Testnet networks',
                more: '+more',
            },
            toasts: {
                coinEnabled: 'Connect your Trezor to load {coin}',
            },
            oneNetworkSymbolAlert: {
                title: 'You need to keep at least 1 network enabled at all times.',
                description: "Otherwise the app won't show you anything.",
            },
        },
        advanced: {
            experimentalFeatures: {
                suiteSync: {
                    title: 'Suite Sync',
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
            slip24: {
                title: 'SLIP-24 (clear signing)',
                description:
                    'View transaction details on your Trezor in a human-readable format before confirming.',
            },
        },
        notSupported: 'Not supported on this Trezor device.',
    },
    moduleDeviceOnboarding: {
        walletBackupTutorialScreen: {
            step6: {
                holdToConfirmButton: 'Hold to start',
            },
        },
    },
    moduleAccountManagement: {
        discoveryFailedBanner: {
            title: 'Account couldn’t be loaded',
            description: 'Failed to load account. Check your connection and try again.',
            retryButton: 'Retry',
        },
        accountsScreen: {
            networkFilter: {
                applyButton: 'Apply',
                clearButton: 'Clear filter',
                showAllButton: 'Show all',
                accountCount: '{count, plural, one {# account} other {# accounts}}',
                title: 'Filter by network',
            },
        },
        tokenSettings: {
            contractAddress: 'Contract address',
            network: 'Network',
            balance: 'Balance',
            hideToken: 'Hide token',
        },
        accountSettingsScreen: {
            xpubBottomSheet: {
                xpub: {
                    title: 'Public key (XPUB)',
                    showButton: 'Show public key (XPUB)',
                    confirmOnTrezorButton: 'Confirm on Trezor',
                    copyMessage: 'XPUB copied',
                },
                copyButton: 'Copy',
                viewOnlyWarning: {
                    title: 'Your Trezor isn’t connected',
                    description:
                        'To prevent phishing attacks, verify the public key on your Trezor. Connect it to continue with the verification process.',
                    primaryButton: 'Show unverified public key',
                    secondaryButton: 'Back',
                },
                unverifiedWarning: {
                    title: 'Public key not verified',
                    subtitle:
                        'To prevent phishing attacks, verify the public key on your Trezor once it’s connected.',
                },
            },
        },
        accountDetailContentScreen: {
            yieldBadge: {
                upToRate: 'Up to {apy}% APY',
                yieldRate: '{apy}% APY',
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
                vault: 'Vault',
                deposit: 'Deposit',
                withdraw: 'Withdraw',
                firmwareUpdateAlert: {
                    title: 'Firmware update required',
                    description: 'Update firmware on the device {name} to use {featureName}.',
                    primaryButtonTitle: 'Update',
                    secondaryButtonTitle: 'Not now',
                },
                apyBreakdown: {
                    autoCompounded: 'Automatically added and compounded.',
                    manualCompound:
                        'Bonus rewards are offered for a limited time and claimed separately in the Earn tab.',
                    footerApy: 'APY may change over time.',
                    footerApyApr: 'APY and APR rates can change over time.',
                },
            },
        },
        emptyState: {
            noAccountsTitle: 'No accounts',
            noAccountsSubtitle: 'Connect your Trezor or sync networks to view and track accounts.',
            addSubtitle: 'Start adding networks you want to use.',
            noAccountsReceiveSubtitle:
                'Connect your Trezor or sync networks to receive to your accounts.',
        },
        viewOnlyAddAccountAlert: {
            title: 'Connect & unlock your Trezor to add new assets',
            description: 'You can’t add new assets while your Trezor is disconnected.',
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
    },
    transactions: {
        title: 'Transactions',
        more: 'Load more',
        loadOlder: 'Load older transactions',
        historyCoveredSince: 'Showing transactions since {date}',
        loadFailed: 'Couldn’t load transactions. Try again.',
        status: {
            pending: 'Pending',
        },
        phishing: {
            badge: 'Caution!',
        },
        emptyState: {
            title: 'No transactions',
            subtitle: 'Get started by receiving assets.',
            recentWindowTitle: 'No recent transactions',
            recentWindowSubtitle:
                'Only recent history is loaded by default. Use the button below to load older transactions.',
        },
        detail: {
            unstakeHeader: 'Unstake {amount}',
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
            wrap: 'Wrap {nativeSymbol} into {wrappedAmount}',
            unwrap: 'Unwrap {wrappedAmount} into {nativeSymbol}',
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
            stellarAccountMerge: 'Merged account',
            stellarClaimableBalanceClaimed: 'Claimed balance',
            stellarClaimableBalanceCreated: 'Offered balance to claim',
            stellarClaimableBalanceOffered: 'Balance offered to claim',
            stellarDataEntry: 'Updated account data',
            stellarFootprint: 'Extended contract data rent',
            stellarLiquidityPool: 'Liquidity pool operation',
            stellarOffer: 'Managed an offer',
            stellarSequenceBumped: 'Bumped account sequence',
            stellarTrustlineUpdated: 'Updated trustline',
            stellarSetOptions: 'Changed account settings',
            stellarSponsorship: 'Changed reserve sponsorship',
            stellarTrustlineFlags: 'Changed trustline authorization',
        },
        TransactionDetailScreen: {
            parametersSheet: {
                transactionId: 'Transaction ID',
                transactionIdCopied: 'Transaction ID copied',
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
        portfolioTrackerHeader: 'Portfolio Tracker',
        wallet: {
            standard: 'Standard wallet',
            defaultPassphrase: 'Passphrase wallet #{index}',
        },
    },
    qrCode: {
        scanner: 'QR code scanner',
        addressCopied: 'Address copied',
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
        priceHistoryError: "Price history couldn't be loaded.",
        priceHistoryEmpty: 'No price history for this period.',
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
        featureAuthorizationError: "The passphrase you've entered is incorrect.",
        enterPassphraseOnTrezor: {
            button: 'Enter passphrase on Trezor',
            title: 'Continue on Trezor',
            subtitle: 'Enter your passphrase on your Trezor',
        },
        noPassphrase: {
            button: 'No passphrase',
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
            confirmEmptyWalletSheet: {
                title: 'Passphrase best practices',
                list: {
                    backup: 'Write it down on paper and keep it offline (no photos or digital copies).',
                    store: 'Store it in a secure location, separate from both your wallet backup and Trezor device.',
                    neverShare: 'Never share it with anyone, not even Trezor Support.',
                },
                alertTitle: 'No one can recover your passphrase, not even Trezor Support',
            },
            verifyEmptyWallet: {
                passphraseMismatchAlert: {
                    title: 'Passphrase mismatch',
                    description: 'Try again and re-enter your passphrase.',
                    primaryButton: 'Try Again',
                    secondaryButton: 'Cancel',
                },
            },
        },
        passphraseMismatch: {
            title: 'Passphrase duplicate',
            subtitle: 'This passphrase wallet is already open.',
            button: 'Proceed to passphrase wallet',
        },
    },
    moduleSend: {
        defi: {
            banner: {
                title: '{token} represents your position in a vault.',
                description:
                    'If you transfer this token elsewhere, you will move your entire position and stop future rewards.',
            },
        },
        fees: {
            unavailable: 'Network fee information is unavailable.',
            tron: {
                energyCount: '{count} energy',
                bandwidthCount: '{count} bandwidth',
            },
            custom: {
                bottomSheet: {
                    total: 'Total fee',
                },
            },
        },
        review: {
            deviceDisconnectedAlert: {
                title: 'Trezor disconnected',
                description: 'Reconnect your Trezor to continue.',
                primaryButton: 'Reconnect Trezor',
            },
            outputs: {
                title: 'Confirm on Trezor',
                submitButton: 'Send transaction',
            },
        },
    },
    earn: {
        staking: 'Staking',
        defiYield: 'DeFi Yield',
        poweredBy: 'Powered by',
        max: 'Max',
        feeEstimationFailed:
            "The network fee couldn't be estimated, so the transaction can't be prepared. Try again later.",
        stakingOperatedByProviders: 'Staking is operated by independent providers',
        portfolioTracker: {
            alert: {
                title: 'Staking is disabled in the portfolio tracker',
                description: 'Connect your device for full functionality or use our desktop app.',
                copyLabel: 'Tap to copy',
            },
        },
        instantStakeBanner: {
            stakedTitle: '{amount} {displaySymbol} staked instantly',
            unstakedTitle: '{amount} {displaySymbol} unstaked instantly',
            claimedTitle: '{amount} {displaySymbol} claimed',
        },
        promoStakeBanner: {
            title: 'Earn up to {apy}% APY on your {symbol}',
            eth: {
                description: 'Stake {symbol} for network rewards, or deposit it in a yield vault.',
            },
            sol: {
                description: 'Put your {symbol} to work. Stake now to earn rewards.',
            },
            exploreButton: 'Explore',
        },
        stakingDetailScreen: {
            title: 'Staking',
        },
        stakingManagementScreen: {
            yourStake: 'Your stake',
            stakedLabel: 'Staked',
            totalRewardsLabel: 'Total rewards',
            autoRestakedBadge: 'Restaked',
            nextRewardLabel: 'Next reward payout in ~{value, plural, one {# day} other {# days}}',
            rewardsFrequencyLabel: 'Rewards every ~{value, plural, one {# day} other {# days}}',
            cardanoDesktopOnlyBanner:
                'Staking {symbol} can only be managed in Trezor Suite on desktop.',
            cardanoAutoStakedBadge: 'Auto-staked',
            cardanoLearnMoreLink: 'Learn more',
            cardanoNotEarningBanner: {
                title: 'Your Cardano is no longer earning rewards',
                description:
                    'Use Trezor Suite on desktop to switch your provider and start earning again.',
                button: 'Learn more',
            },
            cardanoDelegatedOutsideBanner: {
                title: 'Delegated outside Trezor Suite',
                description:
                    "Your full balance is delegated to a pool that isn't managed in Trezor Suite.",
            },
            cardanoAutoStakedModal: {
                title: 'Your whole balance earns rewards',
                delegationDescription:
                    'On Cardano you delegate your entire balance, not a set amount. Everything in this account earns rewards automatically, including {symbol} you receive later.',
                accessibilityDescription:
                    'Nothing gets locked. You can send or spend at any time and your stake adjusts automatically.',
                learnMoreButton: 'Learn more',
            },
            unstakeButton: 'Unstake',
            stakeButton: 'Stake',
            stakeMoreButton: 'Stake more',
            stakingHistory: 'Staking transactions',
            pendingActions: 'Pending actions',
            instantUnstakeBanner: {
                title: '{amount} {symbol} unstaked instantly',
                descriptionWithDays:
                    "You've received {amount} {symbol} instantly. The remainder is paid out within {days, plural, one {# day} other {# days}}.",
                descriptionWithoutDays: "You've received {amount} {symbol} instantly.",
            },
            outsideStakingBanner: {
                title: "You're staking outside of Trezor Suite.",
                description: '{amount} {symbol} (≈ {fiat}) is currently staked elsewhere.',
            },
            solRewardsWarning:
                'Your latest reward is already recorded on-chain, but it may take some time to appear in Rewards history.',
            rewardsList: {
                title: 'Rewards history',
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
                labelWithoutDays: 'Unstaking',
                modalTitle: 'Unstaking',
            },
            pendingStakesItem: {
                label: 'Pending stake',
                modalTitle: 'Pending stake',
            },
            pendingItemModal: {
                gotIt: 'Got it',
                stepTransactionConfirmed: 'Transaction confirmed',
                stepEntryPeriod: 'Staking activation (~{days, plural, one {# day} other {# days}})',
                stepEntryPeriodWithoutDays: 'Staking activation',
                stepStakedReceivingRewards: 'Staked & earning rewards',
                stepWithdrawalPeriod:
                    'Staking deactivation (~{days, plural, one {# day} other {# days}})',
                stepWithdrawalPeriodWithoutDays: 'Staking deactivation',
                stepReadyToClaim: 'Ready to claim',
                sol: {
                    stepWarmUpPeriod:
                        'Staking activation (~{days, plural, one {# day} other {# days}})',
                    stepWarmUpPeriodWithoutDays: 'Staking activation',
                    stepStakedReceivingRewards: 'Staked & earning rewards',
                    stepCoolDownPeriod:
                        'Staking deactivation (~{days, plural, one {# day} other {# days}})',
                    stepCoolDownPeriodWithoutDays: 'Staking deactivation',
                    stepUnstakedReadyToClaim: 'Unstaked and ready to claim',
                },
            },
        },
        noBalance: {
            staking: {
                title: 'Get {displaySymbol} to start staking',
                subtitle:
                    'You need at least {minAmount} {displaySymbol} plus network fees in your account. When it arrives, you can start staking immediately.',
                subtitleWithoutMinimum:
                    'Receive {displaySymbol} in this account. Once it arrives, you can stake right away.',
            },
            yield: {
                title: 'Get {tokenSymbol} to start earning',
                subtitle:
                    'No {tokenSymbol} in this account yet. Buy, swap, or receive to deposit here.',
            },
            earningApy: 'Earning ~{apy}% APY',
            buyButton: 'Buy {displaySymbol}',
            receiveButton: 'Receive {displaySymbol}',
            swapButton: 'Swap',
            receiveShortButton: 'Receive',
        },
        wrappedNativeToken: {
            featureName: 'wrapping and unwrapping',
            firmwareOutdated:
                'Update the firmware on your Trezor to continue with this transaction.',
        },
        wrapNativeToken: {
            entryButton: 'Wrap',
            title: 'Wrap {nativeSymbol} to {wrappedSymbol}',
            amountToWrap: 'Amount to wrap',
            reserveRecommendation:
                'We recommend leaving {amount} {nativeSymbol} so you can pay future network fees.',
            reserveKept: 'We left {amount} {nativeSymbol} so you can pay future network fees.',
            insufficientFeeReserve:
                'You need at least {amount} {nativeSymbol} to cover the network fees.',
            submitButton: 'Wrap',
            closeButton: 'Close',
            pendingTransactionTitle: 'Wrapping in progress',
            review: {
                title: 'Confirm wrap',
                submitButton: 'Wrap now',
            },
            complete: {
                title: 'Wrapping complete',
                subtitle: '{nativeSymbol} was wrapped and {wrappedSymbol} is now in your account.',
                failedTitle: 'Wrap transaction failed',
                failedSubtitle: 'Transaction not confirmed. Check account history and try again.',
            },
            errors: {
                deviceNotConnected: 'Connect your Trezor to continue.',
            },
        },
        unwrapNativeToken: {
            entryButton: 'Unwrap',
            title: 'Unwrap {wrappedSymbol} to {nativeSymbol}',
            amountToUnwrap: 'Amount to unwrap',
            submitButton: 'Unwrap',
            closeButton: 'Close',
            pendingTransactionTitle: 'Unwrapping in progress',
            review: {
                title: 'Confirm unwrap',
                submitButton: 'Unwrap now',
            },
            complete: {
                title: 'Unwrapping complete',
                subtitle:
                    '{wrappedSymbol} was unwrapped and {nativeSymbol} is now in your account.',
                failedTitle: 'Unwrap transaction failed',
                failedSubtitle: 'Transaction not confirmed. Check account history and try again.',
            },
            errors: {
                deviceNotConnected: 'Connect your Trezor to continue.',
            },
        },
        earnConsentsScreen: {
            maintained: 'Staking infrastructure is maintained by Everstake.',
            acknowledge: 'I acknowledge and consent to stake with Everstake.',
            title: 'Before you continue',
            delegatingCard: {
                eth: {
                    benefits:
                        "Stake your {displaySymbol} to receive rewards and help enhance the network's security and stability.",
                },
            },
        },
        earnTransactionDataReviewScreen: {
            title: 'Confirm on Trezor',
            pendingTitle: 'Confirming stake…',
            amountLabel: 'Staking amount',
            viewTransactionButton: 'Stake now',
            pushTransactionFailedAlert: {
                title: 'Transaction failed',
                description: 'Failed to complete your staking transaction. Try again.',
            },
            pendingTransactionConflictAlert: {
                title: 'Pending transaction detected',
                description:
                    'A staking transaction is already pending for this account. Wait for it to confirm before staking again.',
            },
            signTransactionFailedAlert: {
                title: 'Transaction was not signed',
                description: 'Your account balance may have changed. Review and try again.',
            },
        },
        unstakeTransactionDataReviewScreen: {
            title: 'Confirm on Trezor',
            pendingTitle: 'Confirming unstake…',
            amountLabel: 'Unstaking amount',
            viewTransactionButton: 'Unstake now',
            followDeviceInstructions: "Follow the instructions on your Trezor's screen.",
            pushTransactionFailedAlert: {
                title: 'Transaction failed',
                description: 'Failed to complete your unstaking transaction. Try again.',
            },
            pendingTransactionConflictAlert: {
                title: 'Pending transaction detected',
                description:
                    'An unstaking transaction is already pending for this account. Wait for it to confirm before unstaking again.',
            },
            signTransactionFailedAlert: {
                title: 'Transaction was not signed',
                description: 'Your account balance may have changed. Review and try again.',
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
            staked: 'Staked balance',
            unstakingTimeline: 'Unstaking timeline',
            unstakingPeriodInfo:
                'The unstaking period is currently {days, plural, one {~# day} other {~# days}}.',
            networkFeeWarning:
                'Network fees may exceed this amount. Your balance may decrease. Enter a higher amount.',
            reviewAndSign: 'Review & sign',
            amountLabel: 'Amount',
            stakeMaxButton: 'Stake max',
            unstakeMaxButton: 'Unstake max',
            withdrawalFeesRecommendation:
                'We recommend leaving {amount} {displaySymbol} so you can pay future network fees.',
            estimatedRewardsLabel: 'Estimated yearly rewards',
            validation: {
                amountIsZero: 'Amount must be greater than 0.',
                amountBelowMinimum: 'Amount must be at least {amount} {symbol}.',
                amountExceedsMax: 'The amount exceeds the maximum allowed value of {maxAmount}.',
                insufficientBalance: 'Insufficient balance to stake this amount.',
                feeBufferReserve:
                    'Insufficient funds remaining after the reserve for future network fees.',
                tooManyDecimals: 'Too many decimal places.',
            },
            withdrawalFeesBanner:
                "We've left {amount} {displaySymbol} in your account so you can pay future network fees.",
        },
        unstakeFormScreen: {
            validation: {
                amountIsZero: 'Amount must be greater than 0.',
                amountExceedsMax: 'The amount exceeds the maximum allowed value of {maxAmount}.',
                invalidUnstakeAmount:
                    "Due to recent Solana blockchain changes, this amount can't be unstaked.\n\nTry {higher}{higherFiat},\n\nor {lower}{lowerFiat}.",
                invalidUnstakeAmountHigherOnly:
                    "Due to recent Solana blockchain changes, this amount can't be unstaked.\n\nTry {higher}{higherFiat}.",
                insufficientBalance: 'Insufficient staked balance to unstake this amount.',
                tooManyDecimals: 'Too many decimal places.',
            },
        },
        unstakeFlowScreen: {
            canClaimWarning:
                'You currently have {amount} from unstaking ready to claim. Claim it now, or wait until your new unstake is processed and claim everything at once.',
            instantlyAvailable: {
                label: 'Instantly available',
                infoDescription:
                    'The liquidity of the staking pool can allow for instant unstake of some funds. The remaining funds will follow the unstaking period.',
            },
            accountLimitBanner:
                'Due to Solana transaction size restrictions, you can unstake from {limit} accounts at once. In the next transaction you can unstake up to {amount} {symbol}. To unstake more, repeat the process.',
        },
        earnScreen: {
            otherOpportunities: 'Explore earn opportunities',
            depositsCard: {
                title: 'Earning balance',
                stakingPositions: 'Staking positions',
                defiYieldPositions: 'DeFi Yield positions',
                availableRewards: 'Bonus rewards',
                claimRewardsButton: 'Claim rewards',
                rewardsSummary:
                    '{tokenCount, plural, one {<text>in</text><tokenIcons></tokenIcons><text>{tokenSymbol}</text>} other {<text>in</text><tokenIcons></tokenIcons><text># tokens</text>}}{accountCount, plural, one {} other {<text>across</text><accountIcon></accountIcon><text># accounts</text>}}',
                incompleteFiatTotal: 'Some fiat rates couldn’t load. Total may be incomplete.',
            },
            activeSheet: {
                stakingPositionsTitle: 'Staking positions',
                yieldPositionsTitle: 'Yield positions',
            },
            stablecoinYieldLoadError: {
                title: 'Unable to load yield opportunities',
                description:
                    'This may be due to a network or connectivity issue. Check your connection and try again.',
            },
            chooseAccountSheet: {
                stakingTitle: 'Choose account to stake',
                yieldTitle: 'Choose account to deposit',
                title: 'Choose account',
            },
            viewOnlyStakingAlert: {
                title: 'Connect & unlock your Trezor to start staking',
                description: "You can't stake {networkName} while your Trezor is disconnected.",
            },
            infoModal: {
                title: 'Manage {earnType} in the Trezor Suite desktop app',
                subtitle: 'Go to the link below on your computer and download the desktop app.',
                copyLabel: 'Hold to copy',
            },
            enableNetworkModal: {
                title: 'Enable {networkName} to start staking',
                subtitle:
                    'Stake your crypto to help secure the {networkName} network and earn rewards in return.',
                cta: 'Enable {networkName}',
                viewOnlyAlert: {
                    title: 'Connect & unlock your Trezor to enable {networkName}',
                    description:
                        "You can't enable {networkName} while your Trezor is disconnected.",
                },
                defiYield: {
                    title: 'Enable {networkName} to start earning yield',
                    subtitle:
                        'Put your assets to work on the {networkName} network—deposit them into a vault and earn yield.',
                    cta: 'Enable {networkName}',
                },
            },
            claimRewards: {
                title: 'Bonus rewards to claim',
            },
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
                            'After staking activation, you can unstake anytime. In ~{days, plural, one {# day} other {# days}}, your funds will be ready to claim.',
                        solana: 'After staking activation, you can unstake anytime. In ~{days, plural, one {# day} other {# days}}, your funds will be ready to claim.',
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
                    titleEthereum: 'Staking activation',
                    titleSolana: 'Staking activation',
                    description: '~{entryPeriod, plural, one {# day} other {# days}}',
                },
                third: {
                    titleEthereum: 'Receive weekly rewards',
                    titleSolana:
                        'Receive rewards every ~{days, plural, one {# day} other {# days}}',
                    description: '~{apy}% APY',
                },
            },
            unstakeTimelineTitle: 'Unstake',
            unstakeTimeline: {
                first: {
                    title: 'Sign unstaking transaction',
                    description: 'Network fee',
                },
                second: {
                    titleEthereum: 'Staking deactivation',
                    titleSolana: 'Staking deactivation',
                    description: '~{unstakingPeriod, plural, one {# day} other {# days}}',
                },
                third: {
                    title: 'Claim unstaked {symbol}',
                    description: 'Network fee',
                },
                fourth: {
                    title: 'Receive {symbol} in account',
                    description: 'Instantly',
                },
            },
        },
        howYieldWorksScreen: {
            defiYieldTitle: 'How DeFi Yield works',
            defiYieldSubtitle: 'Put your assets to work and earn yield.',
            wrappedNativeVault: {
                defiYieldTitle: 'How {nativeSymbol} vaults work',
                defiYieldSubtitle:
                    'You deposit {nativeSymbol}, other people borrow it, and the interest they pay becomes your earnings.',
            },
            benefits: {
                first: {
                    title: 'The deposited amount of {tokenSymbol} is always available.',
                    description: 'Withdrawal is instant.',
                },
                second: {
                    title: 'Automatic compounding',
                    description: 'Yield is automatically added and compounded.',
                },
                third: {
                    title: 'Deposit {tokenSymbol} to receive {vaultTokenSymbol}',
                    description: 'This is your vault position.',
                },
                fourth: {
                    title: "You'll also earn bonus rewards in {bonusRewardTokenName}.",
                    description: 'These must be claimed separately.',
                },
                wrappedNativeVault: {
                    first: {
                        title: 'This vault takes wrapped {nativeSymbol}',
                        description: 'You can wrap your {nativeSymbol} during the deposit.',
                    },
                    second: {
                        title: 'You put in {nativeSymbol} and get {vaultTokenSymbol} back',
                        description:
                            'Your receipt for the position. Value builds up in the position, not in the token count.',
                    },
                    third: {
                        title: 'Return the {vaultTokenSymbol} to withdraw',
                        description:
                            'Any time you want. This is how earnings become {nativeSymbol} you can spend.',
                    },
                    fourth: {
                        title: 'Bonus rewards you claim yourself',
                        description:
                            '{bonusRewardTokenSymbol} tokens, for a limited time, in the Earn tab.',
                    },
                },
            },
            timelineCardTitle: 'Deposit timeline',
            timelineBottomSheetTitle: 'Deposit timeline',
            depositTimelineTitle: 'Deposit',
            depositTimeline: {
                wrap: {
                    title: 'Wrap {nativeSymbol} to {tokenSymbol}',
                    description: 'Network fee',
                },
                first: {
                    title: 'Approve spending transaction',
                    description: 'Network fee',
                },
                second: {
                    title: 'Sign deposit transaction',
                    description: 'Network fee',
                },
                third: {
                    title: 'Your {vaultTokenSymbol} amount stays the same, but its value grows with every block',
                    description: '~{apy}% Rate',
                },
            },
            withdrawTimelineTitle: 'Withdraw',
            withdrawTimeline: {
                first: {
                    title: 'Sign withdrawal transaction',
                    description: 'Network fee',
                },
                unwrap: {
                    title: 'Unwrap {tokenSymbol} to {nativeSymbol}',
                    description: 'Network fee',
                },
                second: {
                    title: 'Receive {tokenSymbol} in account',
                    description: 'Instantly',
                },
            },
            claimTimelineTitle: 'Claim rewards',
            claimTimeline: {
                first: {
                    title: 'Sign claim transaction',
                    description: 'Network fee',
                },
                second: {
                    title: 'Receive {bonusRewardTokenSymbol} in account',
                    description: 'Instantly',
                },
            },
        },
        yieldConsentsScreen: {
            terms: "By using the {providerName} protocol in this app, you agree to Trezor's <tos>Terms of Use</tos> and acknowledge <disclaimer>{providerName}'s Disclaimer</disclaimer>.",
            title: 'Before you continue',
            providerCard: {
                title: 'Deposit to {providerName}',
                firstItem:
                    '{providerName} maintains and protects your supplied {tokenSymbol} with their smart contracts, infrastructure, and technology.',
                secondItem:
                    "When you deposit, the responsibility for your funds' security transitions from your Trezor device to {providerName}.",
                thirdItem:
                    'Supplying assets involves smart contract risks. {providerName} applies rigorous security measures, but cannot guarantee against all losses.',
            },
        },
        yieldDepositFlowScreen: {
            step: 'Step {stepNumber} of {stepCount}',
            approvalStepTitle: 'Select amount & approve',
            modalTitle: 'Deposit',
            depositTransactionStepTitle: 'Deposit transaction',
            wrapStepTitle: 'Wrap {nativeSymbol} to {tokenSymbol}',
            wrapSubmitButton: 'Wrap {nativeSymbol}',
            wrapSkipButton: 'Skip',
            wrapReceivingLabel: 'Receiving',
            depositPendingTitle: 'Confirming deposit…',
            amountToDeposit: 'Amount to deposit',
            balance: 'Balance:',
            approvedAmount: 'Approved amount',
            approvalLimit: 'Approval limit',
            increaseApprovalLimit: 'Increase approval limit',
            revokeApproval: 'Revoke approval',
            skipApproval: 'Skip',
            perDeposit: 'Per deposit',
            estimatedRewardsLabel: 'Estimated yearly yield',
            approvalLimitSheet: {
                title: 'Select approval limit',
                perDeposit: {
                    description:
                        "Approve the exact amount for the vault. Valid until fully used or revoked, then you'll need to approve again and pay a network fee.",
                },
                unlimited: {
                    title: 'Unlimited',
                    description:
                        'Approve once and avoid future network fees. The vault can spend any amount until you revoke the approval.',
                    alert: 'If the vault is compromised, all your {tokenSymbol} may be lost.',
                },
            },
            validation: {
                amountIsZero: 'Amount must be greater than 0.',
                insufficientBalance: 'Insufficient {tokenSymbol} balance.',
                tooManyDecimals: 'Too many decimal places.',
            },
            alerts: {
                approvalUnavailable: {
                    title: 'Approval unavailable',
                    description: 'Approval failed. Check the amount and try again.',
                },
                approvalReviewUnavailable: {
                    title: 'Approval review unavailable',
                    description:
                        "Approval review couldn't be prepared. Check the selected fee and try again.",
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
                    description: "Deposit couldn't be prepared. Check the amount and try again.",
                },
                approvalTooLow: {
                    title: 'Approval is too low. Change approval or lower the deposit amount.',
                    primaryButton: 'Change approval',
                },
                approvalIncreaseRequiresRevoke: {
                    title: 'To increase your approval, you must first revoke the current allowance.',
                },
                insufficientFeeReserve: {
                    title: 'You need at least {amount} {nativeSymbol} to cover the network fees.',
                },
                feeReserveTopUp: {
                    title: 'We recommend holding at least {amount} {nativeSymbol} to cover future network fees, including withdrawal.',
                },
                transactionFailed: {
                    title: 'Transaction failed',
                    description: 'Transaction failed on the network. Review details and try again.',
                },
            },
        },
        yieldDepositRevokeScreen: {
            title: 'Revoke {tokenSymbol} spending',
            subtitle: 'Revoke this vault’s approved spending limit for your {tokenSymbol}.',
            lowLimitInfoAlert:
                'The spending limit is too low. Revoke the current spending limit and approve a higher amount.',
            account: 'Account',
            provider: 'Vault',
            limit: 'Limit',
            pendingTitle: 'Confirming revoke…',
        },
        yieldWithdrawFlowScreen: {
            withdrawalAmount: 'Withdrawal amount',
            deposited: 'Deposited:',
            withdrawPendingTitle: 'Confirming withdrawal…',
            modalTitle: 'Withdraw',
            withdrawStepTitle: 'Withdraw assets',
            unwrapStepTitle: 'Unwrap {tokenSymbol} to {nativeSymbol}',
            unwrapStepDescription:
                'You can also unwrap {tokenSymbol} anytime from the {networkName} account screen.',
            unwrapSubmitButton: 'Unwrap {tokenSymbol}',
            unwrapSkipButton: 'Skip',
            unwrapPendingTitle: 'Unwrapping in progress',
            amountToWithdraw: 'Amount to withdraw',
            amountExceedsDeposited: 'The amount exceeds your deposited balance.',
            networkFeeWarning:
                'Network fees may exceed this amount and your balance may decrease. Enter a higher amount.',
            maxWithdrawInfo:
                'Amount switched to {vaultTokenSymbol} to withdraw your entire balance, including yield earned up to the moment the transaction is processed.',
            validation: {
                amountIsZero: 'Amount must be greater than 0.',
                tooManyDecimals: 'Too many decimal places.',
            },
        },
        yieldClaimFlowScreen: {
            title: 'Claim rewards',
            rewards: 'Bonus rewards',
            noRewards: 'No rewards to claim.',
            claimPendingTitle: 'Confirming claim…',
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
                        "Reward details didn't match the transaction, so nothing was signed and no funds were moved. Tap Continue to retry with updated details. If the issue persists, contact Trezor Support.",
                },
            },
        },
        yieldDepositApprovalReviewScreen: {
            title: 'Confirm on Trezor',
            submitButton: 'Approve',
        },
        yieldDepositRevokeReviewScreen: {
            title: 'Confirm on Trezor',
            submitButton: 'Revoke approval',
        },
        yieldDepositReviewScreen: {
            title: 'Confirm on Trezor',
            submitButton: 'Deposit',
        },
        yieldWithdrawReviewScreen: {
            title: 'Confirm on Trezor',
            submitButton: 'Withdraw',
            redeemSubmitButton: 'Redeem',
        },
        yieldClaimReviewScreen: {
            title: 'Confirm on Trezor',
            submitButton: 'Claim now',
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
            subtitle: 'Bonus rewards added to your balance.',
        },
        yieldCompleteScreen: {
            status: 'Status',
            completed: 'Completed',
            apy: 'APY',
            received: 'Received',
            rewards: 'Bonus rewards',
            sent: 'Sent',
            deposited: 'Deposited',
            backToOverview: 'Back to overview',
        },
        transactionCompleteScreen: {
            doneButton: 'Done',
            stakeTitle: 'Staking complete',
            stakeAmountLabel: 'Staked',
            stakeDescription:
                "You'll earn rewards after staking activation ({days, plural, one {# day} other {# days}}).",
            unstakeTitle: 'Unstaking complete',
            unstakeAmountLabel: 'Unstaked',
            claimTitle: 'Claim complete',
            claimAmountLabel: 'Claimed',
        },
        yieldReview: {
            outputs: {
                claimTitle: 'Claim rewards from',
                depositAmount: 'Deposit amount',
                depositDescription: 'Review details to deposit to vault.',
                depositTitle: 'Deposit',
                depositTo: 'Deposit to',
                intentTitle: 'Intent',
                providerTitle: 'Provider',
                redeemAmount: 'Redeem amount',
                redeemDescription: 'Review details to redeem from vault.',
                redeemFrom: 'Redeem from',
                redeemTitle: 'Redeem',
                rewardTokens: 'Reward tokens',
                withdrawAmount: 'Withdraw amount',
                withdrawDescription: 'Review details to withdraw from vault.',
                withdrawFrom: 'Withdraw from',
                withdrawTitle: 'Withdraw',
                wrapAmount: 'Wrap amount',
                wrapDescription: 'Review details to wrap the native coin.',
                wrapIntent: 'Wrap {nativeSymbol} to {tokenSymbol}',
                wrapTitle: 'Wrap',
                wrapTo: 'Wrap via',
                unwrapAmount: 'Unwrap amount',
                unwrapDescription: 'Review details to unwrap back to the native coin.',
                unwrapFrom: 'Unwrap via',
                unwrapIntent: 'Unwrap {tokenSymbol} to {nativeSymbol}',
                unwrapTitle: 'Unwrap',
            },
            alerts: {
                wrap: {
                    signTransactionFailed: {
                        title: 'Transaction was not signed',
                        description: 'Review the transaction and sign it again.',
                    },
                    pushTransactionFailed: {
                        title: 'Wrap was not submitted',
                        description:
                            'The wrap transaction was signed but could not be submitted to the network.',
                    },
                    pendingTransactionConflict: {
                        title: 'Wrap was not submitted',
                        description:
                            'A transaction is already pending for this account. Wait for it to finish before trying again.',
                    },
                },
                unwrap: {
                    signTransactionFailed: {
                        title: 'Transaction was not signed',
                        description: 'Review the transaction and sign it again.',
                    },
                    pushTransactionFailed: {
                        title: 'Unwrap was not submitted',
                        description:
                            'The unwrap transaction was signed but could not be submitted to the network.',
                    },
                    pendingTransactionConflict: {
                        title: 'Unwrap was not submitted',
                        description:
                            'A transaction is already pending for this account. Wait for it to finish before trying again.',
                    },
                },
                approval: {
                    signTransactionFailed: {
                        title: 'Transaction was not signed',
                        description: 'Review the transaction and sign it again.',
                    },
                    pushTransactionFailed: {
                        title: 'Approval was not submitted',
                        description:
                            'The approval transaction was signed but could not be submitted to the network.',
                    },
                    pendingTransactionConflict: {
                        title: 'Approval was not submitted',
                        description:
                            'A transaction is already pending for this account. Wait for it to finish before trying again.',
                    },
                },
                revoke: {
                    signTransactionFailed: {
                        title: 'Transaction was not signed',
                        description: 'Review the transaction and sign it again.',
                    },
                    pushTransactionFailed: {
                        title: 'Approval revocation was not submitted',
                        description:
                            'The approval revocation transaction was signed but could not be submitted to the network.',
                    },
                    pendingTransactionConflict: {
                        title: 'Approval revocation was not submitted',
                        description:
                            'An approval revocation transaction is already pending for this account. Wait for it to finish before trying again.',
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
                            'The deposit transaction was signed but could not be sent to the network.',
                    },
                    pendingTransactionConflict: {
                        title: 'Deposit was not submitted',
                        description:
                            'A transaction is already pending for this account. Wait for it to finish before trying again.',
                    },
                },
                withdraw: {
                    signTransactionFailed: {
                        title: 'Transaction was not signed',
                        description: 'Review the transaction and sign it again.',
                    },
                    pushTransactionFailed: {
                        title: 'Withdrawal was not submitted',
                        description:
                            'The withdrawal transaction was signed but could not be sent to the network.',
                    },
                    pendingTransactionConflict: {
                        title: 'Withdrawal was not submitted',
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
        },
        rewards: 'Rewards',
        apyAbbr: 'APY',
        apyValueWithLabel: '{value} APY',
        aprValueWithLabel: '{value} APR',
        aprAbbr: 'APR',
        tron: {
            votes: 'Votes',
            allVotesAssigned: '{count, plural, one {# vote assigned} other {All # votes assigned}}',
            votesRemaining:
                '{count, plural, one {1 unassigned vote} other {{count} unassigned votes}}',
            votesBottomSheet: {
                title: 'Assign all votes to earn more rewards.',
            },
            votesAlertText:
                '{count, plural, one {You have 1 unassigned vote. Assign it to earn more rewards.} other {You have {count} unassigned votes. Assign them to earn more rewards.}}',
            readyToWithdrawAlert: '{amount} {displaySymbol} unstaked and ready to withdraw.',
            resources: {
                title: 'Resources',
                bandwidth: 'Bandwidth',
                energy: 'Energy',
                availableOfTotal: '{available} / {total}',
            },
            unstakingCard: {
                title: 'Unstaking',
                readyInDaysAndHours:
                    'In ~{days, plural, one {# day} other {# days}} {hours, plural, one {# hour} other {# hours}}',
                readyInHours: 'In ~{hours, plural, one {# hour} other {# hours}}',
            },
        },
        notAvailable: 'Not available',
        apyNotAvailable: 'APY not available',
        apyPercentage: '~{apy}% APY',
        aprPercentage: '~{apy}% APR',
        rewardsEveryBlock: 'Rewards every block',
        yearlyRewards: 'Your yearly yield',
        yearlyRewardsDeposited: '{amountWithSymbol} deposited',
        potentialRewards: 'Potential yearly yield',
        potentialRewardsIfYouAdd: 'If you add {amountWithSymbol}',
        tokenBalance: 'Token balance',
        notAvailableShort: 'N/A',
        yieldRateBadge: {
            apy: '{value}% APY',
            apr: '{value}% APR',
            rate: '{value}% Rate',
            upToApy: 'up to {value}% APY',
            upToApr: 'up to {value}% APR',
            upToRate: 'up to {value}% Rate',
        },
        zeroApyBadge: 'No rewards',
        messageSystem: {
            depositDisabled: 'Deposit is currently disabled.',
            withdrawDisabled: 'Withdrawal is currently disabled.',
            claimDisabled: 'Claim is currently disabled.',
            wrapDisabled: 'Wrapping is currently disabled.',
            unwrapDisabled: 'Unwrapping is currently disabled.',
        },
        claimReviewScreen: {
            title: 'Claim {displaySymbol}',
            reviewAndSignButton: 'Review & sign',
            amountLabel: 'Amount',
            instantClaimBanner: "You'll claim the {displaySymbol} instantly",
            accountLimitBanner:
                'Due to transaction size limits, you can claim from up to {limit} accounts per transaction. This transaction claims up to {amount} {symbol}. Repeat to claim the rest.',
        },
        claimTransactionDataReviewScreen: {
            title: 'Confirm on Trezor',
            pendingTitle: 'Confirming claim…',
            amountLabel: 'Claiming amount',
            viewTransactionButton: 'Claim now',
            pushTransactionFailedAlert: {
                title: 'Transaction failed',
                description: 'Failed to complete your claim transaction. Try again.',
            },
            pendingTransactionConflictAlert: {
                title: 'Pending transaction detected',
                description:
                    'A claim transaction is already pending for this account. Wait for it to confirm before claiming again.',
            },
            signTransactionFailedAlert: {
                title: 'Transaction was not signed',
                description: 'Your account balance may have changed. Review and try again.',
            },
        },
        stakingBottomSheet: {
            description:
                'Staking accounts can be viewed but not managed in the Trezor Suite mobile app.',
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
        kyc: {
            noRefund: 'KYC may be required in exceptional cases.',
            yesRefund: 'KYC may be required in exceptional cases.',
            kycRequired: 'KYC is required.',
        },
        tradingScreen: {
            footer: {
                providerDisclaimer: 'This service is offered by {companyName}, not Trezor.',
                termsApply: 'Terms apply',
                termsAndConditionsGeneric:
                    'This service is offered by a third-party provider, not Trezor. Provider’s terms apply.',
                howTradingWorksSheet: {
                    title: 'How trading works',
                    sheetTitle: 'How trading with Trezor works',
                    item1: 'Trezor compares trusted exchange providers to find the best offer.',
                    item2: 'Providers use your location to show relevant offers.',
                    item3: 'Trezor never sees your payment or KYC data.\n<text>It’s shared only with the provider if you complete your trade.</text>',
                    item4: 'How fees are calculated',
                    item5: "Trezor's Terms of Use",
                },
            },
            kycRequired: 'KYC is required.',
        },
        tradingSellPreviewScreen: {
            providerStatus: {
                cannotBeCompletedAlert: {
                    title: 'Sell failed',
                    description:
                        "We didn't receive confirmation from the provider. Your funds are safe in your account.",
                    button: 'Sell again',
                },
            },
        },
        tradingSellCompletionScreen: {
            finishingTitle: 'Finishing up with {companyName}',
            finishingSubtitle:
                'You’ll confirm on your Trezor once they’re done. Closed {companyName} early? Go back and start a new sell.',
        },
        tradingConfirmationScreen: {
            approveTitle: 'Confirming approval',
            date: 'Date',
            transactionId: 'Transaction ID',
            exploreInBlockchain: 'Explore on blockchain',
        },
        exchangeTradePreviewCard: {
            account: 'Account',
        },
        tradeHistory: {
            tabs: {
                all: 'All trades',
                exchange: 'Swaps',
                buy: 'Buys',
                sell: 'Sells',
            },
            filteredEmptyState: {
                exchange: 'No swaps yet',
                buy: 'No buys yet',
                sell: 'No sells yet',
                showAll: 'Show all trades',
            },
            emptyState: {
                title: 'No trades yet',
                description: 'Your trades will appear here and you can track their status.',
                button: 'Back to trade form',
            },
            export: {
                button: 'Export previous trades',
                confirmButton: 'Download CSV',
                exportSuccessfulToast: 'Trade history exported.',
                exportFailedToast: 'Trade history export failed.',
                fileSavingNotSupportedToast: 'Saving files is not supported on this device.',
                columns: {
                    orderId: 'Trade ID',
                    date: 'Date and time',
                    type: 'Type',
                    spentAmount: 'Spent amount',
                    spendTicker: 'Spend ticker',
                    spendNetwork: 'Spend network',
                    spendTransactionId: 'Spend transaction ID',
                    receiveAmount: 'Receive amount',
                    receiveTicker: 'Receive ticker',
                    receiveNetwork: 'Receive network',
                    provider: 'Provider',
                    status: 'Status',
                    receiveTransactionId: 'Receive transaction ID',
                    paymentId: 'Payment ID',
                },
            },
            statusIcon: {
                success: 'Successful trade',
                error: 'Failed trade',
                warning: 'Trade requires attention',
                pending: 'Trade in progress',
            },
            detail: {
                info: {
                    youPayLabel: 'You pay',
                    youGet: 'You get',
                    fromAccount: 'from {accountLabel}',
                    toAccount: 'to {accountLabel}',
                    tradeId: 'Trade ID',
                    paymentMethod: 'Payment method',
                    payoutMethod: 'Payout method',
                    provider: 'Provider',
                    placed: 'Placed',
                    rate: 'Rate',
                    fixed: 'Fixed',
                    floating: 'Floating',
                    mevProtection: 'MEV protection',
                    maximumSlippage: 'Maximum slippage',
                    minimumReceivedAmount: 'Minimum received amount',
                    explanation: {
                        fixedRate: {
                            title: 'Fixed-rate offer',
                            description: 'The final amount won’t change as the market moves.',
                        },
                        floatingRate: {
                            title: 'Floating-rate offer',
                            description: 'The final amount can change as the market moves.',
                        },
                        mevProtection: {
                            description:
                                'Helps protect your swap from manipulation and unfair price changes.',
                        },
                        maximumSlippage: {
                            description:
                                'The most the rate can change before the swap fails. Network fees still apply.',
                        },
                    },
                },
                actionButton: {
                    contactProvider: 'Contact {providerName}',
                    startNew: {
                        buy: 'Start new buy',
                        sell: 'Start new sell',
                        exchange: 'Start new swap',
                    },
                },
                paymentInterruptionBanner: {
                    title: "Left the provider's website before paying?",
                    description: "You haven't been charged. Go back and create a new trade.",
                },
                supportBanner: {
                    title: 'Need help with your trade?',
                },
                statusStepper: {
                    transactionId: 'Transaction ID',
                    customer: {
                        buy: {
                            processingTitle: 'Waiting for payment',
                            processingDescription:
                                'Payment confirmations reach us through the provider, so this can take a while.',
                            completedTitle: 'Payment received',
                        },
                        sell: {
                            processingTitle: 'Sending transaction',
                            completedTitle: 'Transaction sent',
                        },
                        exchange: {
                            processingTitle: 'Sending transaction',
                            dex: {
                                processingTitle: 'Swapping on {providerName}',
                                completedTitle: 'Swapped on {providerName}',
                            },
                        },
                    },
                    provider: {
                        label: 'Provider',
                        buy: {
                            pendingTitle: '{providerName} will process your buy',
                            processingTitle: '{providerName} is processing your buy',
                            completedTitle: '{providerName} has processed your buy',
                        },
                        sell: {
                            pendingTitle: '{providerName} will process your sell',
                            processingTitle: '{providerName} is processing your sell',
                            completedTitle: '{providerName} has processed your sell',
                            description:
                                'Your rate is locked, so you’ll get exactly what you see. Once your sell is processed, {providerName} will send the funds to your account. Check your account to see if they’ve arrived.',
                        },
                        exchange: {
                            pendingTitle: '{providerName} will process your swap',
                            processingTitle: '{providerName} is processing your swap',
                            completedTitle: '{providerName} has processed your swap',
                        },
                        checkStatus: 'Check status on {providerName}',
                    },
                },
                header: {
                    unknownProviderName: 'the provider',
                    buy: {
                        processing: {
                            title: 'Your buy is being processed',
                            description:
                                'You can leave this screen. View your buy status anytime in trade history.',
                        },
                        completed: {
                            title: 'Buy complete',
                            description:
                                'Funds are in your account. View your buy in trade history.',
                        },
                        failed: {
                            title: 'Buy failed',
                            description:
                                "Your transaction failed or was rejected. Your payment method hasn't been charged.",
                        },
                    },
                    sell: {
                        processing: {
                            title: 'Your sell is being processed',
                            description:
                                'You can leave this screen. View your sell status anytime in trade history.',
                        },
                        completed: {
                            title: 'Sell complete',
                            description:
                                'Funds are in your account. View your sell in trade history.',
                        },
                        failed: {
                            title: 'Sell failed',
                            description:
                                'Your transaction failed or was rejected. The funds are in your account.',
                        },
                    },
                    exchange: {
                        processing: {
                            title: 'Your swap is being processed',
                            description:
                                'You can leave this screen. Check swap status anytime in trade history.',
                        },
                        completed: {
                            title: 'Swap complete',
                            description:
                                'Funds are in your account. View your swap in trade history.',
                        },
                        kyc: {
                            title: 'KYC requested',
                            description:
                                'The provider has marked this transaction as “suspicious” and you may be required to complete their KYC process to finish the trade. Contact {providerName}’s support to proceed.',
                        },
                        returned: {
                            title: 'Swap returned',
                            description:
                                'Your funds have been returned to your account. Reach out to {providerName}’s support if you have any issues.',
                        },
                    },
                },
            },
        },
        defaultSearchLabel: 'Search',
        networkName: 'Network name',
        slippage: {
            title: 'Maximum slippage',
            description:
                'Limit how much the rate can change before the transaction fails. Network fees always apply.',
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
    },
    feedbackForm: {
        title: 'How was your experience?',
        description: 'Your feedback helps us improve. Tell us what you think.',
        submitButton: 'Send feedback',
        successTitle: 'Thanks!',
        successDescription: 'We value your feedback.',
    },
    firmware: {
        typeUniversal: 'Universal',
        typeBitcoinOnly: 'Bitcoin-only',
        seedBottomSheet: {
            title: 'We recommend checking your backup before updating device firmware.',
            description:
                'In the unlikely event of a firmware update issue, you may need your wallet backup to restore access. Check your wallet backup before you continue.',
            continueButton: 'Install firmware',
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
        changelog: {
            button: "See what's new",
            title: "See what's new",
            changelogUnavailable: 'No changelog available',
        },
        firmwareInfoScreen: {
            list: {
                item1: {
                    update: 'This firmware update may take some time to complete.',
                    install: 'Firmware installation may take a while.',
                },
                item2: '<b>Keep the app open during installation</b> —closing it could corrupt the firmware. ',
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
                    'Having your wallet backup is crucial. Troubleshooting might corrupt the firmware, requiring reinstallation.',
                continueButton: 'I have my wallet backup ready',
                closeButton: 'Cancel',
            },
            part2: {
                title: 'Troubleshooting tips',
                subtitle: 'Try the steps below to continue installing the firmware.',
                gotItButton: 'Got it',
                tip1: 'Reconnect the cable to your phone',
                tip2: 'Try a different cable',
                tip3: 'Check the cable fits the connector properly.',
            },
        },
    },
    banner: {
        blackFridayHolidayPromoBanner: {
            ts7AccessoryPack: 'Complete your setup',
            keepMetal: 'Back up your wallet',
            ts3Gift: 'A gift for someone close',
            ts3Backup: 'Get a backup device',
            ts7CompleteKit: 'Gift the full setup',
            egiftCard: 'Give a Trezor eGift Card',
            ts7Upgrade: 'Your next Trezor',
            button: 'Buy',
        },
        defiYieldPromoBanner: {
            title: 'Put your assets to work securely',
            button: 'Get started',
        },
        ethVaultPromoBanner: {
            title: 'Earn with ETH',
            button: 'Explore vault',
        },
        tradingExperiencePromoBanner: {
            title: 'Trading in Suite just got an upgrade',
            button: "See what's new",
        },
        trezorSafe7PromoBanner: {
            title: 'Introducing Trezor Safe 7',
            button: 'Learn more',
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
            levelUnavailable: 'Unavailable',
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
                bodyTron: 'The fee charged by the Tron network to process your transaction.',
                bodyTronAccountActivation:
                    'The fee charged by the Tron network to process your transaction. This also covers a 1 {networkDisplaySymbol} charge to activate an unused receiving address.',
                infoAccessibilityLabel: 'Network fee information',
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
                            invalid: 'Enter a positive whole number.',
                            unavailable:
                                'Cannot validate the fee limit without a transaction estimate.',
                        },
                        decimals: 'Too many decimal places.',
                        feePerUnit: {
                            low: 'Fee is too low.',
                            high: 'Fee is too high.',
                        },
                        maxFeePerGas: {
                            lessThanPriority: "This fee can't be lower than the Max priority fee.",
                            outOfRange: 'Enter a max fee per gas between {minFee} and {maxFee}',
                        },
                        maxPriorityFee: {
                            min: 'Max priority fee must be at least {minPriorityFee}',
                            higherThanMaxFee: "This fee can't be higher than the Max fee per gas",
                        },
                    },
                    total: 'Total fee',
                    confirmButton: 'Confirm custom fee',
                },
                card: {
                    label: 'Custom',
                },
            },
            error: 'Insufficient balance for this fee.',
            tabs: {
                standard: 'Standard fee',
                custom: 'Custom fee',
            },
            tron: {
                feeLimit: 'Fee Limit (SUN)',
                feeLimitBelowRecommended: 'Fee limit must be at least {minFeeLimit}',
            },
            confirmButton: 'Confirm fee',
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
                approveLabel: 'Approve',
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
                feeLabel: 'Fee',
                expectedFeeLabel: 'Expected fee',
                noteLabel: 'Note',
                transactionDataLabel: 'Data',
                opReturnLabel: 'Hexadecimal message (OP_RETURN)',
                transactionDataEmpty: 'No data',
                transactionDataShowMore: 'Show more',
                transactionDataShowLess: 'Show less',
                recipientProviderNameOutputLabel: 'Provider',
                tradedAssetsOutputLabel: 'My assets',
                swapIntentLabel: 'Intent',
                swapIntentValue: 'Swap',
                cardanoFingerprintLabel: 'Fingerprint',
                cardanoTrezorAmountLabel: 'Trezor amount',
                summary: {
                    label: 'Total including fee',
                    totalAmount: 'Total amount',
                    amount: 'Amount',
                    fee: 'incl. Transaction fee',
                    maxFee: 'Maximum fee',
                },
                approveMaxAmount: 'Unlimited',
            },
            cancelAlert: {
                title: 'Cancel transaction?',
                continueButton: 'Continue editing',
            },
        },
        precomposedTransaction: {
            errors: {
                amountNotEnoughCurrencyFee:
                    'Insufficient {networkDisplaySymbol} to cover the current transaction fee',
                amountIsNotEnough: "You don't have enough funds.",
                amountIsTooLow: 'Amount is too low.',
                amountIsLessThanReserve: 'Recipient account requires minimum reserve to activate.',
                stakeNotEnoughFunds: 'Insufficient funds for staking.',
                stakeTxPreparationFailed:
                    'The transaction could not be prepared. Make sure the account is up to date and try again.',
                stakedBalanceChanged:
                    'Your staked balance has changed. Check the updated amount and try again.',
                remainingBalanceLessThanRent:
                    'After sending this amount, your account will have SOL remaining lower than the rent.',
                amountNotEnoughCurrencyFeeWithEthAmount:
                    'Insufficient {networkDisplaySymbol} to cover the current transaction fee',
            },
        },
    },
    navigation: {
        tabs: {
            home: 'Home',
            accountsList: 'Accounts',
            earn: 'Earn',
            trade: 'Trade',
            settings: 'Settings',
            accounts: 'My assets',
        },
    },
    tradingAtoms: {
        error: {
            deviceOfflineTitle: 'Trading is not available offline',
            deviceOfflineDescription:
                'Trading requires an internet connection. Check your phone settings and try again.',
            serverOfflineTitle: "It's not you, it's us.",
            serverOfflineDescription: 'Something went wrong. Try again in a moment.',
            serverOfflineRetry: 'Try again',
            portfolioTrackerTitle: 'Portfolio Tracker',
            portfolioTrackerDescription:
                'Sell & Swap are disabled. Connect your device to enable all features.',
            btcOnlyFirmwareTitle: 'Bitcoin-only firmware',
            btcOnlyFirmwareDescription:
                'Swapping is not available with Bitcoin-only firmware. Switch to universal firmware to enable.',
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
    moduleClipboard: {
        copiedToClipboard: 'Copied to clipboard',
    },
    networks: {
        initialSetup: {
            title: 'Add your networks',
            subtitle: 'Enable networks to buy or receive assets. Change your selection anytime.',
        },
    },
    search: {
        noResults: 'No results',
    },
    signAndVerify: {
        tabs: {
            sign: 'Sign',
            verify: 'Verify',
        },
        format: {
            label: 'Format',
            values: {
                trezor: 'Trezor (BIP-137)',
                electrum: 'Electrum',
                rawKey: 'Raw key',
                cose: 'COSE (CIP-30)',
            },
        },
        address: {
            label: 'Address',
            badges: {
                stake: 'Stake',
                fresh: 'Fresh',
                change: 'Change',
            },
        },
        message: {
            label: 'Message',
        },
        hex: {
            label: 'Hex',
            invalid: 'Not a valid hex',
        },
        signature: {
            label: 'Signature',
            placeholder: 'Generated after signing',
        },
        buttons: {
            sign: 'Sign',
            verify: 'Verify',
            clear: 'Clear',
        },
        results: {
            signed: 'Message signed',
            verified: 'Message verified',
            failed: 'Verification failed',
        },
    },
};
