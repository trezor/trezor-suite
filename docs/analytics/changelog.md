# Analytics Changelog

This changelog lists all events that Suite tracks.

### 1.17

Added:

-   create-backup
    -   status: 'finished' | 'error'
    -   error: string
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
