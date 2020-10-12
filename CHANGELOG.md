# Changelog
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). [YY.MM.MICRO]

## [Unreleased]

### Added


### Changed
- Improved metadata (labeling) input

### Fixed
- Account search bug fixes and various small improvements

## [20.10.1]

### Added
- Auto updater for desktop version.
- Logging of previous device firmware in firmware update procedure if analytics is enabled

### Changed
- Oauth flow in desktop now opens in default browser.
- Oauth is now implemented using "authorization code flow with PKCE" method, instead of previously used implicit flow.
- Firmware update flow redesigned. User is required to connect device in 'normal' mode before updating.
- New design: toast notifications, modals, passphrase modal,...

### Fixed
- Send form "setMax" inconsistent behavior. Fix of #2314, #2327
- Metadata (labeling) flow with passphrase enabled.
- Metadata (labeling) fix overflow of long labels.

## [20.9.1-beta]

### Added
- Labelling
- Account Search
- Graph: Toggle between linear and logarithmic scale

### Changed
- Update trezor-connect
- Graph: responsivity improvements

### Fixed
 - Detection of unsupported browsers
 - Various UI fixes and improvements

## [20.8.1-beta]

### Added
- Historical balance in account graph

### Changed
- Design: improved Dashboard, Modal for switching wallets and list of transactions
- Update trezor-connect

### Fixed
- Synchronizing state of multiple remembered devices to local storage
- Desktop build now correctly offers latest firmware version
- Firmware changelog formatting

## [20.7.1-beta]

### Added
- Send: Compatibility with Zcash Heartwood upgrade

### Changed
- Update trezor-connect and electron dependencies
- Change Blockbook backends for BTC, BTH, ETH and LTC from the beta back to stable
- Bump minimal supported chrome/firefox version
- Design: General layout and navigation overhaul
- Design: Dashboard news design refresh

### Fixed
- Recovery: Handle device reconnect during Shamir recovery
- Recovery: Handle cancelling recovery by a device communicating through WebUSB
- Modal: Clicking on tooltip won't close the modal window anymore

### Removed
- Landing page: Remove "become tester" button

## [20.6.1-beta]

### Added
- Error page: option to clear storage
- Error page: if initial loading takes more than 20s show Error page
- Desktop FW 2.3.1/1.9.1 update available

### Changed
- Better looking Y axis in dashboard/account graph (linear scale)
- Update dependencies (Electron, trezor-connect, Styled Components, Next,...)
- Update landing page

### Fixed
- Graph: rounding small negative values in dashboard/account graph
- Graph: slow animation on resizing
- Recovery: fix continue in recovery mode modal
- Recovery: passphrase enabled after recovery by default
- Backup: better handling of already failed, already finished edge case
- Transactions: Fiat amounts next to the graph overflowing outside of container
- Fiat Rates: Fix hitting API limits
- Crash on formatting small negative values
- Submitting too long passphrase with Enter

### Removed
- ConnectDevice: remove udev installers on android (mobile)


## [20.5.1-beta]
### Added
- Initial beta release
