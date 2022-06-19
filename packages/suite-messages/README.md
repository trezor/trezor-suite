# suite-messages

This package is place where all messages, for all suite projects are defined. Also there is everything related to messages upload, download etc.

### Adding new message domain

Now we have something called message domains which are basically subset of translations for specific app. For example if you will want to add new messages for `exampleApp` app, follow these steps:

1. Create file `exampleAppMessages.json` in `src/` folder.
2. Then you need to edit file `src/messages.ts`:

```tsx
// add domain to MessageDomain union type
export type MessagesDomain = 'web' | 'mobile' | 'exampleApp';

// create react-intl compatible message object + type
export const exampleAppMessages = prepareMessages({
    ...sharedMessagesJson,
    ...exampleAppMessagesJson,
});
export type ExampleAppMessageId = keyof typeof exampleAppMessages;
```

3. Add paths to utility scripts config in `packages/suite-messages/scripts/utils/messagesFiles.ts`:

```tsx
    mobile: {
        translatedMessages: require('../../translations/exampleApp/en.json'),
        sourceMessages: require('../../src/exampleAppMessages.json'),
        sourceMessagesPath: path.join(__dirname, '../../src/exampleAppMessages.json'),
        unusedPathPattern: '**/connect-popup/**',
    },
```

4. Now you can create your customize Translation component in your app (not in this package!):

```tsx
import { messages, ExampleAppMessageId, TranslationProps, BaseTranslation } from '@suite/messages';

export const Translation = (props: TranslationProps<ExampleAppMessageId>) => (
    <BaseTranslation messages={messages} {...props} />
);
```

5. Don't forget to wrap your app to `IntlProvider` from `react-intl`
