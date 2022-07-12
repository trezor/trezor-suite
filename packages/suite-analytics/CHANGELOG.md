# Analytics Changelog

This changelog lists changes in suite events.

### 1.21

Added:

-   suite-ready
    -   labeling: 'dropbox' | 'google' | 'fileSystem' | 'sdCard' | ''
-   settings/general/labeling
    -   value: boolean
-   settings/general/labeling-provider
    -   provider: 'dropbox' | 'google' | 'fileSystem' | 'sdCard' | ''
-   firmware-validate-hash-error
    -   error: string
-   firmware-validate-hash-mismatch

### 1.20

-   analytics 1.19 was never released due to a bug

### 1.19

Added:

-   settings/device/wipe
-   settings/coins

Renamed:

-   wallet/add-account to accounts/new-account
-   settings/coin-backend to settings/coins/backend
-   menu/toggle-onion-links to settings/tor/onion-links
-   menu/toggle-tor to settings/tor

Merged:

-   analytics/enable, analytics/dispose to settings/analytics
    -   value: boolean
-   check-seed/error, check-seed/success to settings/device/check-seed
    -   error: string
    -   status: 'finished' | 'error'

Removed:

-   session-end
-   menu/goto/early-access
-   menu/goto/tor
-   settings/general/goto/early-access
-   settings/general/early-access/check-for-updates
-   settings/general/early-access/download-stable
-   menu/settings/dropdown
-   menu/settings/toggle
-   dashboard/security-card/create-backup
-   dashboard/security-card/seed-link
-   dashboard/security-card/set-pin
-   dashboard/security-card/change-pin
-   dashboard/security-card/enable-passphrase
-   dashboard/security-card/create-hidden-wallet
-   dashboard/security-card/enable-discreet
-   dashboard/security-card/toggle-discreet
-   menu/goto/switch-device
-   menu/goto/suite-index
-   menu/goto/wallet-index
-   menu/goto/notifications-index
-   menu/goto/settings-index
-   settings/device/goto/background
-   settings/device/goto/backup
-   settings/device/goto/recovery
-   settings/device/goto/firmware
-   switch-device/add-wallet
-   switch-device/add-hidden-wallet
-   settings/device/goto/wipe

### 1.18

Added:

-   device-connect (mode !== bootloader)
    -   firmwareRevision: string
    -   bootloaderHash: string
-   device-connect (mode === bootloader)
    -   firmware: string
    -   bootloader: string

### 1.17

Added:

-   create-backup
    -   status: 'finished' | 'error'
    -   error: string
-   app-update
    -   fromVersion: string
    -   toVersion: string
    -   status: 'finished' | 'cancelled' | 'error'
    -   version: 'stable' | 'beta'
    -   status: 'downloaded' | 'cancelled' | 'error'
    -   earlyAccessProgram: boolean
    -   isPrerelease: boolean
-   suite-ready
    -   customBackends: ['btc', 'eth', 'ada', ...] (array of coins with custom backend)
    -   autodetectLanguage: boolean;
    -   autodetectTheme: boolean;
-   suite-ready
    -   customBackends: ['btc', 'eth', 'ada', ...] (array of coins with custom backend)
    -   autodetectLanguage: boolean;
    -   autodetectTheme: boolean;
-   settings/coin-backend
    -   symbol: 'btc', 'eth', 'ada', ...
    -   type: 'default' | 'blockbook' | 'electrum' | 'ripple' | 'blockfrost'
    -   totalRegular: number
    -   totalOnion: number
-   settings/general/change-language
    -   previousLanguage: string
    -   previousAutodetectLanguage: boolean
    -   autodetectLanguage: boolean
    -   platformLanguages: string
-   settings/general/change-theme
    -   previousTheme: 'light' | 'dark'
    -   previousAutodetectTheme: boolean;
    -   theme: 'light' | 'dark'
    -   autodetectTheme: boolean;
    -   platformTheme: 'light' | 'dark'

### 1.16

Added:

-   device-setup-completed
    -   duration: number (in ms)
    -   device: 'T' | '1'
    -   firmware?: 'install' | 'update' | 'skip' | 'up-to-date' (empty if seed === 'recovery-in-progress')
    -   seed: 'create' | 'recovery' | 'recovery-in-progress'
    -   seedType?: 'standard' | 'shamir' (empty seed === 'recovery')
    -   recoveryType?: 'standard' | 'advanced' (empty if seed === 'create' || device === 'T')
    -   backup?: 'create' | 'skip' (empty if seed === 'recovery')
    -   pin: 'create' | 'skip'

Removed:

-   initial-run-completed (in favor of device-setup-completed, analytics/enable, and analytics/dispose)
-   suite-ready
    -   platform
    -   platformLanguage

### 1.15

Added:

-   suite-ready
    -   earlyAccessProgram: boolean
-   menu/goto/early-access
-   settings/general/early-access
    -   allowPrerelease: boolean
-   settings/general/early-access/check-for-updates
    -   checkNow: boolean
-   settings/general/early-access/download-stable
-   settings/general/goto/early-access
    -   allowPrerelease: boolean

### 1.14

Fixed:

-   suite-ready
    -   osName: android is now correctly detected, added chromeos

### 1.13

Added:

-   switch-device/add-hidden-wallet

Changed:

-   wallet/created renamed to select-wallet-type

Removed:

-   desktop-init

### 1.12

Changed:

-   device-update-firmware
    -   toFwVersion and toBtcOnly made optional as we don't know them when installing custom firmware

Added:

-   guide/tooltip-link/navigation
    -   id: string

### 1.11

Added:

-   c_timestamp: number (time of created in ms sent with every event)
-   menu/settings/dropdown
    -   option: 'guide' (+ old ones)
-   menu/guide
-   guide/feedback/navigation
    -   type: 'overview' | 'bug' | 'suggestion'
-   guide/feedback/submit
    -   type: 'bug' | 'suggestion'
-   guide/header/navigation
    -   type: 'back' | 'close' | 'category'
    -   id?: string
-   guide/report
    -   type: 'overview' | 'bug' | 'suggestion'
-   guide/node/navigation
    -   type: 'category' | 'page'
    -   id: string

### 1.10

Removed:

-   initial-run-completed
    -   newDevice
    -   usedDevice

### 1.9

Changed:

-   use `stable.log` for codesign builds and `develop.log` otherwise
-   `suite-ready` is now also tracked on initial run

Added:

-   suite-ready
    -   platformLanguages: string
-   device-connect
    -   language: string
    -   model: string
-   settings/device/goto/background
    -   custom: boolean
-   settings/device/background
    -   image: string | undefined (gallery image)
    -   format: string | undefined (custom image)
    -   size: number | undefined (custom image)
    -   resolutionWidth: number | undefined (custom image)
    -   resolutionHeight: number | undefined (custom image)
-   add-token
    -   token: string
-   transaction-created
    -   action: 'sent' | 'copied' | 'downloaded' | 'replace'
    -   symbol: string
    -   tokens: string
    -   outputsCount: number
    -   broadcast: boolean
    -   bitcoinRbf: boolean
    -   bitcoinLockTime: boolean
    -   ethereumData: boolean
    -   rippleDestinationTag: boolean
    -   ethereumNonce: boolean
    -   selectedFee: string
-   menu/notifications/toggle
    -   value: boolean
-   menu/settings/toggle
    -   value: boolean
-   menu/settings/dropdown
    -   option: 'all' | 'general' | 'device' | 'coins'
-   menu/goto/tor
-   accounts/empty-account/receive

Fixed:

-   device-update-firmware
    -   toBtcOnly
-   accounts/empty-account/buy
    -   symbol (lowercase instead of uppercase)

### 1.0 - 1.8

-   initial version (<1.8 events are discarded)
