# Changelog
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). [YY.MM.MICRO]

## 21.4.0 [to be released 14th April 2021]

### Added

### Changed

### Fixed

## 21.3.1 [to be released 10th March 2021]

### Added
- Discovery progress bar in electron
- OpenGraph meta tags for Suite (web version)
- Option to hide dashboard graph
- Instructions for verifying linux binary (landing page)
- Ethereum replace-by-fee feature

### Changed
- Don't allow to run multiple instances of Suite desktop app

### Fixed
- Check if IDB is supported before each operation (no idb support in FF incognito/tor browser)
- Account with non-zero balance could be marked as empty (eth)
- OpenGraph meta tags for Suite landing page
- Incorrect fiat rates for tokens sharing the same symbol
- Include tokens in portfolio value showed on the Dashboard
- Potential crash when switching active wallet in Send form
- Upgrading idb between releases should not lead to "Loading takes too long" error
- Browser icons in non-supported browser fallback page

## 21.2.3 [17th February 2021]

### Added
- Pagination on transaction list

### Fixed
- Freeze when using transaction search while discovery is running
- Fix exchange between eth and tokens
- Correctly estimate Gas price for ERC20 tokens

## 21.2.2 [10th February 2021]

### Fixed
- Device in bootloader not recognized on Windows due to Bridge v2.0.30 (replaced by 2.0.27)

## 21.2.1 [10th February 2021]

### Added

- RBF with on-device support
- Transaction search
- Spend crypto through Bitrefill vouchers
- Option to add custom ERC20 tokens
- Custom fee in ETH

### Changed
- Redesigned review and send transaction modal

### Fixed
- M1 Mac compatibility

## 20.12.1 [9th December 2020]

### Added
- Dark mode
- Exchange (crypto to crypto)
- Time range in graphs
- Export transactions
- Labeling: Google Drive sync

### Changed

### Fixed
- Bugs with displaying correct hidden wallet number (#2467, #2578). Remembered devices will stick to the old numbering until recreated.

## 20.11.2 [12th November 2020]

### Fixed
- Don't trigger Bridge update for 2.0.27 and newer.

## 20.11.1 [11th November 2020]

### Added
- Metadata (labeling) may now be saved locally. This feature is available only for desktop version.

### Changed
- Improved metadata (labeling) input

### Fixed
- Account search bug fixes and various small improvements
- Passphrase input backspace/delete keys behavior

## 20.10.1 [14th October 2020]

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
