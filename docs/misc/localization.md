# Localization

Suite uses [react-intl](https://github.com/formatjs/formatjs) package for all in-app localization needs.
Definitions of all messages are stored in [messages.ts](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/messages.ts).

To allow non-developers to edit these messages through user-friendly interface, we upload them to [Crowdin](https://crowdin.com/project/trezor-suite) via [trezor-translations-manager](https://github.com/trezor/trezor-suite/tree/develop/packages/translations-manager) (TTM) which takes care of conversion to CSV file format before the upload. *Be aware that TTM is rather legacy project and most likely could be replaced with `formatjs` cli.*

After strings have been translated we use TTM again to download the messages and generate language json files. They are automatically copied to [suite-data package](https://github.com/trezor/trezor-suite/tree/develop/packages/suite-data/files/translations).
To finish the process these files need to be commited to the repository.

## Message definitions
[messages.ts](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/messages.ts) is the place where you add new messages to be used in Suite. It's basically just a huge object where a key is an ID of the message and a value is the message definition.

*Do not manually edit language json files in `suite-data/files/translations/` directory. These are auto-generated, changing them directly is plausible only for development purposes.*

### Structure

- `id`: We don't have strict conventions for generating these IDs, although using a prefix `TR_`, or expanded variant `TR_<SCOPE>`, where scope is, for example, "ONBOARDING" is really handy. ID must be the same as the object's key.
- `defaultMessage`: Used as a source string for translator. It's also a text that is shown in the app as a fallback till someone changes/improves it in Crowdin.
- `description`: Optional. Useful for describing the context in which the message occurs, especially if it is not clear from a `defaultMessage` field.

Example:

```js
{
  ...
  TR_ADDRESS: {
      id: 'TR_ADDRESS',
      defaultMessage: 'Address',
      description: 'Used as label for receive/send address input',
  },
  ...
}
```


## Usage in Suite

To render a message use our wrapper for react-intl's `FormattedMessage`, [Translation](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/Translation/index.tsx). It will always return `JSX.Element`. If, for some reason, you need to render the message as a string (for example for passing it as a placeholder prop to an input) use [useTranslation](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/suite/useTranslation.ts) hook.


`Translation` accepts the same parameters as `FormattedMessage` and adds a little bit of magic.

Most straightforward usage is to just pass message's ID to `id` prop:
```jsx
<Translation id="TR_CONTINUE" />
```
or for string variant using hook:
```jsx
const { translationString } = useTranslation();
translationString('TR_CONTINUE');
```

There are cases where you need to pass a variable which needs to be part of the translated message:
```jsx
<Translation id="TR_ENTERED_PIN_NOT_CORRECT" values={{ deviceLabel: device.label }} />
```
or for string variant using hook:
```jsx
const { translationString } = useTranslation();
translationString('TR_ENTERED_PIN_NOT_CORRECT', {deviceLabel: device.label});
```
Definition for `TR_ENTERED_PIN_NOT_CORRECT`:
```
TR_ENTERED_PIN_NOT_CORRECT: {
    defaultMessage: 'Entered PIN for "{deviceLabel}" is not correct',
    id: 'TR_ENTERED_PIN_NOT_CORRECT',
}
```

Sometimes you need to provide a translator the ability to emphasize some words in a sentence AKA rich text formatting. In this example a text enclosed in `<strong>` will be wrapped in `StrongStyling` component.
```jsx
 <Translation
    id="TR_TRANSACTIONS_SEARCH_TIP_2"
    values={{
        strong: chunks => <StrongStyling>{chunks}</StrongStyling>, // search string is wrapped in strong tag for additional styling
    }}
/>
```
Definition for `TR_TRANSACTIONS_SEARCH_TIP_2`:
```
TR_TRANSACTIONS_SEARCH_TIP_2: {
  id: 'TR_TRANSACTIONS_SEARCH_TIP_2',
  defaultMessage:
      'Tip: You can use the greater than (>) and lesser than (<) symbols on amount searches. For example <strong>> 1<strong> will show all transactions that have an amount of 1 or higher.',
},
```

For even more shenanigans (like handling plural form) check this great overview on [ICU Message syntax](https://support.crowdin.com/icu-message-syntax/).

### Translation mode
*Section shamelessly stolen from [Crowdin contributions](https://www.notion.so/Crowdin-contributions-c6b56ef6a0424de8b4d8ce9190bdcd19)*.

There's a hidden feature in Suite, intended for translators, called Translation mode that redirects you into Crowdin upon clicking any particular string. This is immensely handy in comparison to blindly translating strings within Crowdin as it allows you to understand the context of a certain string before being taken to Crowdin to translate it.

1.  Go to Settings in Suite
2. **Rapidly click** on the *"Settings"* heading 5 times
3. Click the three dot context menu on the right
4. *"Debug Settings"* should've appeared. Click it.
If *"Debug Settings"* hasn't appeared, repeat step 2.
5. Enable "*Translation mode*"

After enabling it each string, which is rendered via `Translation` component, is now underlined with red and shows a popup with the message's ID when you hover the mouse over it.

To join the ranks of translators follow [Crowdin contributions](https://www.notion.so/Crowdin-contributions-c6b56ef6a0424de8b4d8ce9190bdcd19) guide.

## Synchronization with Crowdin
All work is done via [trezor-translations-manager](https://github.com/trezor/trezor-suite/tree/develop/packages/translations-manager) with time-saving shortcuts defined in [package.json scripts](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/package.json#L5) section. In order to work with Suite project in Crowdin you need to set environment variables:
- `CROWDIN_LOGIN` which is your username set in [profile page](https://crowdin.com/settings#account)
- `CROWDIN_API_KEY` which can be generated in [account settings](https://crowdin.com/settings#api-key). 

*As of now TTM works with Crowdin API v1. For more insights on TTM I recommend checking its superb documentation.*

To upload message definitions from Suite to Crowdin run:
```bash
yarn workspace @trezor/suite translations:upload
```
You can even do that from your branch with messages that are not yet merged in develop branch, just be sure you have rebased your branch on latest develop before doing so. This process replaces all definitions in Crowdin, meaning if your branch is missing some definitions, that are already in develop branch and uploaded in Crowdin, they will be removed.

To download new translations from Crowdin:
```bash
yarn workspace @trezor/suite translations:download
```
and then open a PR with updated language files.


## Workflow for regular Crowdin Synchronization

```bash
BRANCH_NAME=feat/crowdin-sync

git checkout develop
git pull
git checkout -b $BRANCH_NAME

# Upload first to sync the key set.
yarn workspace @trezor/suite translations:upload
# Download second to fetch values for all keys.
yarn workspace @trezor/suite translations:download

git add packages/suite-data/files/translations
git commit -m 'feat(translations): Sync with Crowdin'
git push origin $BRANCH_NAME
```

Plus creating, reviewing and merging the PR.
