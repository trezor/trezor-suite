# Changelog

## [Unreleased]
### Fixed
- minor TS types fixes
- CoinLogo: removed `width` and `height` props and replaced with `size` prop
- Button prop `prop.isWhite` changed to `prop.variant` == 'white'
- Link: removed props `isGray`, `isGreen`, `hasNoStyle` and replaced with `variant?: 'gray' | 'nostyle'` (default is green)

## [1.0.0-beta.20]
### Fixed
- react-router-dom as peer dependency 

## [1.0.0-beta.19]
### Added
- typescript
- snapshot tests

## [1.0.0-beta.18]
### Added
- Button: new props `isLoading` and `variant`. https://github.com/trezor/trezor-ui-components/pull/184
- new Storybook's stories displaying all Buttons and notifications

### Changed
- Notification now uses generic `Button` instead of `ButtonNotification` https://github.com/trezor/trezor-ui-components/pull/184
- Renamed colors SUCCESS_SECONDARY, INFO_SECONDARY, WARNING_SECONDARY, ERROR_SECONDARY to *_LIGHT (used as a background for notification)  https://github.com/trezor/trezor-ui-components/pull/184
- Added new colors SUCCESS_SECONDARY, INFO_SECONDARY, WARNING_SECONDARY, ERROR_SECONDARY (used as hover color on Button color variants) https://github.com/trezor/trezor-ui-components/pull/184
- refactored utils https://github.com/trezor/trezor-ui-components/pull/184
- renamed Input/Textarea prop `trezorAction` to `tooltipAction` https://github.com/trezor/trezor-ui-components/pull/186
- Notification prop `type` renamed to `variant` https://github.com/trezor/trezor-ui-components/pull/185
- Notification now has `flex-wrap: wrap` that allow action buttons to be pushed under message  https://github.com/trezor/trezor-ui-components/pull/185

### Fixed
- Input: `bottomText` proptype now accepts react node instead of just a string https://github.com/trezor/trezor-ui-components/pull/182

### Removed
- `ButtonNotification` component https://github.com/trezor/trezor-ui-components/pull/184
- Notification's `loading` prop  https://github.com/trezor/trezor-ui-components/pull/184

## [1.0.0-beta.17]
Changed:
- Header: Does not depends on react-router anymore, accepts new prop `logoLinkComponent`. https://github.com/trezor/trezor-ui-components/pull/180

## [1.0.0-beta.16]
### Changed
- Reverted change from beta15: Select: hide already selected items https://github.com/trezor/trezor-ui-components/pull/176


## [1.0.0-beta.15]
### Added
- Header component https://github.com/trezor/trezor-ui-components/pull/173

### Changed
- Select: hide already selected items https://github.com/trezor/trezor-ui-components/pull/172
- exact match version for react https://github.com/trezor/trezor-ui-components/pull/174

## [1.0.0-beta.13]
### Fixed
- pass isSearchable prop to react-select https://github.com/trezor/trezor-ui-components/pull/168
- checkbox children proptype https://github.com/trezor/trezor-ui-components/pull/166

## [1.0.0-beta.12]
### Fixed
- Input padding with state icon https://github.com/trezor/trezor-ui-components/pull/163

### Changed
- Tooltip z-index https://github.com/trezor/trezor-ui-components/pull/162


## [1.0.0-beta.11]
### Fixed
- focus styles on button https://github.com/trezor/trezor-ui-components/pull/157
- Roboto as a first font in `FONT_FAMILY` const https://github.com/trezor/trezor-ui-components/pull/158

### Changed
- New tooltip lib https://github.com/trezor/trezor-ui-components/pull/159


## [1.0.0-beta.10]
### Changed
Button positioning changed to `position: relative` https://github.com/trezor/trezor-ui-components/pull/155

## [1.0.0-beta.9]
### Added
- Icon: ability to pass a  name of the icon in `icon` prop in addition to icon object https://github.com/trezor/trezor-ui-components/pull/141
- Select: new prop`withDropdownIndicator` that allows to show dropdown in `isSearchable` select https://github.com/trezor/trezor-ui-components/pull/148
- Button: new prop `additionalClassName` https://github.com/trezor/trezor-ui-components/pull/150
- Add snapshots tests to Gitlab, prettier and eslint unification https://github.com/trezor/trezor-ui-components/pull/149

### Changed
- Updated xlm logo https://github.com/trezor/trezor-ui-components/pull/138

### Fixed
- Notification layout with cta button and close button https://github.com/trezor/trezor-ui-components/pull/144
- Notification `title` and `message` proptype https://github.com/trezor/trezor-ui-components/pull/151
- Build script now uses sync version of `fs.copy` to copy images https://github.com/trezor/trezor-ui-components/pull/154 

## [1.0.0-beta.8]
### Added
- TrezorImage component https://github.com/trezor/trezor-ui-components/pull/132

### Changed
- Prompt: `model` prop type changed to number https://github.com/trezor/trezor-ui-components/pull/135
- Prompt: accepts `children` component instead of `text` https://github.com/trezor/trezor-ui-components/pull/134

### Fixed
- CoinLogo https://github.com/trezor/trezor-ui-components/pull/129
- Prompt: fixed pulse animation shape https://github.com/trezor/trezor-ui-components/pull/134
- Paragraph: css `text-align` is set only when textAlign prop is passed https://github.com/trezor/trezor-ui-components/pull/133
- build system https://github.com/trezor/trezor-ui-components/pull/129

## [1.0.0-beta.6]
### Fixed
- Icon: fix typo in prop name https://github.com/trezor/trezor-ui-components/pull/126
- export variables https://github.com/trezor/trezor-ui-components/pull/125
- Storybook fixes https://github.com/trezor/trezor-ui-components/pull/119

### Known issues
- missing images for `CoinLogo` component


## [1.0.0-beta.5]
### Added
- iSmall prop to Switch component https://github.com/trezor/trezor-ui-components/pull/113
- Tooltip: Added `catText` prop to allow passing custom text to call-to-action button  https://github.com/trezor/trezor-ui-components/pull/116
- CoinLogo component https://github.com/trezor/trezor-ui-components/pull/115

### Changed
- Don't show unnecessary props like `isDisabled={false}` in storybook https://github.com/trezor/trezor-ui-components/pull/111
- Tooltip: Renamed `readMoreLink` to `catLink`  https://github.com/trezor/trezor-ui-components/pull/116
- Icons are now cropped and each icon has defined viewbox https://github.com/trezor/trezor-ui-components/pull/107

### Fixed
- Tooltip: Passing `...rest` props to rc-tooltip https://github.com/trezor/trezor-ui-components/pull/116
- Paragraph: `text-align: initial` as a default instead of `left` https://github.com/trezor/trezor-ui-components/pull/117
- Button: icon position (issue https://github.com/trezor/trezor-ui-components/issues/90) https://github.com/trezor/trezor-ui-components/pull/107

## [1.0.0-beta.4]
### Added
- Prompt component https://github.com/trezor/trezor-ui-components/pull/97
- Switch component https://github.com/trezor/trezor-ui-components/pull/106
- T2 icon https://github.com/trezor/trezor-ui-components/pull/98

### Changed
- icons refactoring in storybook https://github.com/trezor/trezor-ui-components/pull/96
- removed `CHECKED` icon https://github.com/trezor/trezor-ui-components/pull/102

### Fixed
- broken loader animation https://github.com/trezor/trezor-ui-components/pull/109
- storybook/react is now a dev dependency https://github.com/trezor/trezor-ui-components/pull/101

## [1.0.0-beta.3]
### Added
- Paragraph:  added `textAlign` prop (https://github.com/trezor/trezor-ui-components/pull/80)
- Heading: added `texAlign` prop (https://github.com/trezor/trezor-ui-components/pull/81)
- added missing icons (WALLET_STANDARD, WALLET_HIDDEN, QRCODE, MENU) (https://github.com/trezor/trezor-ui-components/pull/87)
- Prettier (https://github.com/trezor/trezor-ui-components/pull/88)

### Changed
- Paragraph: `size` prop now accepts  `small`, `medium` (old base), `large`, `xlarge` instead of font size (https://github.com/trezor/trezor-ui-components/pull/80)
- Textarea: removed icons for state (https://github.com/trezor/trezor-ui-components/pull/86)
- update docs for `Select`, `AsyncSelect` components (https://github.com/trezor/trezor-ui-components/pull/71)
- more strict proptypes (https://github.com/trezor/trezor-ui-components/pull/73)

### Fixed
- Focus on disabled button, disabled focus styles on inverse button (https://github.com/trezor/trezor-ui-components/pull/83)
- added border for every button for consistency (https://github.com/trezor/trezor-ui-components/pull/83)