# Localization

Suite uses [react-intl](https://github.com/formatjs/formatjs) package for all in-app localization needs.

To allow non-developers to edit these messages through user-friendly interface, we upload them to [Crowdin](https://crowdin.com/project/trezor-suite) via their [CLI](https://github.com/crowdin/crowdin-cli).

After strings have been translated we use Crowdin CLI again to download the translated json files to [suite-data package](https://github.com/trezor/trezor-suite/tree/develop/packages/suite-data/files/translations).
To finish the process these files need to be commited to the repository.

## Message definitions

You can find all message definitions files in `@suite/messages` package.

We need to know that there two locations in package, where we can find messages. First location is `packages/suite-messages/translations`. These folder and all subfolder contains already translated messages downloaded from CrowdIn.

If you want for example source messages for desktop and web Suite, you need go to file `src/webMessages.json` or some messages could be also in `src/sharedMessages.json`.

> ❗❗ Warning ❗❗ Do not manually edit files in `suite-messages/translations/` directory. These are auto-generated, changing them directly is plausible only for development purposes.

Another location is `packages/suite-messages/src` where you can find bunch JSON files. These are files that are you should edit in case you want add or change some messages.

Files are split by domains:

-   `webMessages.json` - for desktop or web suite messages
-   `mobileMessages.json` - for mobile app messages
-   `sharedMessages.json` - for messages shared between all other domains

### Message definition structure

We are using simple JSON with `key: "value"` structure:

-   `id`: We don't have strict conventions for generating these IDs, although using a prefix `TR_`, or expanded variant `TR_<SCOPE>`, where scope is, for example, "ONBOARDING" is really handy. ID must be the same as the object's key.
-   `value`: Used as a source string for translator. It's also a text that is shown in the app as a fallback till someone changes/improves it in Crowdin.

Example:

```json
{
    "TR_ADDRESS": "Address",
    "TR_NAME": "Name"
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
translationString('TR_ENTERED_PIN_NOT_CORRECT', { deviceLabel: device.label });
```

Definition for `TR_ENTERED_PIN_NOT_CORRECT`:

```
TR_ENTERED_PIN_NOT_CORRECT: 'Entered PIN for "{deviceLabel}" is not correct'
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
TR_TRANSACTIONS_SEARCH_TIP_2: 'Tip: You can use the greater than (>) and lesser than (<) symbols on amount searches. For example <strong>> 1<strong> will show all transactions that have an amount of 1 or higher.',
```

For even more shenanigans (like handling plural form) check this great overview on [ICU Message syntax](https://support.crowdin.com/icu-message-syntax/).

### Shared messages between multiple apps

If you need messages that will be shared across all projects, simply place it to `sharedMessages.json` instead of domain specific file. Could be useful for some simple button labels like `Cancel` etc.

### Translation mode

_Section shamelessly stolen from [Crowdin contributions](https://www.notion.so/Crowdin-contributions-c6b56ef6a0424de8b4d8ce9190bdcd19)_.

There's a hidden feature in Suite, intended for translators, called Translation mode that redirects you into Crowdin upon clicking any particular string. This is immensely handy in comparison to blindly translating strings within Crowdin as it allows you to understand the context of a certain string before being taken to Crowdin to translate it.

1.  Go to Settings in Suite
1.  **Rapidly click** on the _"Settings"_ heading 5 times
1.  Click the three dot context menu on the right
1.  _"Debug Settings"_ should've appeared. Click it.
    If _"Debug Settings"_ hasn't appeared, repeat step 2.
1.  Enable "_Translation mode_"

After enabling it each string, which is rendered via `Translation` component, is now underlined with red and shows a popup with the message's ID when you hover the mouse over it.

To join the ranks of translators follow [Crowdin contributions](https://www.notion.so/Crowdin-contributions-c6b56ef6a0424de8b4d8ce9190bdcd19) guide.

## Synchronization with Crowdin

### With the automated CI job from GitHub.

Navigate to the [Crowdin translations update](https://github.com/trezor/trezor-suite/actions/workflows/crowdin_sync.yml) action and trigger manual job with a base branch `develop`
Before triggering the job, make sure there is no pull request already opened with the title `Crowdin translations update`

Action will create a pull request with the title `Crowdin translations update`, review it and merge.

### Locally

All work could be done with shortcuts defined in [package.json scripts](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/package.json#L5) section. In order to interact with Crowdin you need to ask the project owner for access token and either store it in your `$HOME/.crowdin.yml` file:

```yaml
'api_token': xxxx
```

or, alternatively, add it as an option for each called script:

```
yarn workspace @suite/messages translations:download --token xxxx
```

### Upload

To upload source messages files with updated messages definitions from Suite to Crowdin run:

```bash
yarn workspace @suite/messages translations:upload
```

You can even do that from your branch with messages that are not yet merged in develop branch, just be sure you have rebased your branch on latest develop before doing so. This process replaces all definitions in Crowdin, meaning if your branch is missing some definitions, that are already in develop branch and uploaded in Crowdin, they will be removed.

### Download

To download new translations from Crowdin run:

```bash
yarn workspace @suite/messages translations:download
```

and then open a PR with updated language files.

## Workflow for regular Crowdin Synchronization

```bash
BRANCH_NAME=feat/crowdin-sync

git checkout develop
git pull
git checkout -b $BRANCH_NAME

# Upload to sync the key set.
yarn workspace @suite/messages translations:upload
# Download to fetch values for all keys.
yarn workspace @suite/messages translations:download

git add packages/suite-data/files/translations
git commit -m 'feat(translations): Sync with Crowdin'
git push origin $BRANCH_NAME
```

Plus creating, reviewing and merging the PR.
