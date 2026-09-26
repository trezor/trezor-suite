# @suite-native/keyboard

Use a toolbar for actions that belong above the keyboard. `Screen` handles its placement. The app
already mounts the keyboard and portal providers.

```tsx
import { KeyboardToolbarPortal } from '@suite-native/keyboard';
import { Screen } from '@suite-native/navigation';

// Actions shared by the whole screen.
<Screen keyboardToolbar={<ToolbarActions />}>
    <Form form={form} />
</Screen>;

// Actions owned by an input deeper in the screen.
const toolbarHost = 'amount-toolbar';

<Screen keyboardToolbarHostName={toolbarHost}>
    <Form form={form}>
        <AmountInput />
        <KeyboardToolbarPortal hostName={toolbarHost} isVisible={isAmountFocused}>
            <AmountActions />
        </KeyboardToolbarPortal>
    </Form>
</Screen>;
```

The portal stays mounted when `isVisible` is false.

## Outside Screen

Render the toolbar directly, or mount a host when its actions live deeper in the tree.

```tsx
import { View } from 'react-native';

import {
    KeyboardToolbar,
    KeyboardToolbarHost,
    KeyboardToolbarPortal,
} from '@suite-native/keyboard';

<View style={{ flex: 1 }}>
    <Form form={form} />
    <KeyboardToolbar>
        <ToolbarActions />
    </KeyboardToolbar>
</View>;

const toolbarHost = 'amount-toolbar';

<View style={{ flex: 1 }}>
    <Form form={form}>
        <AmountInput />
        <KeyboardToolbarPortal hostName={toolbarHost} isVisible={isAmountFocused}>
            <AmountActions />
        </KeyboardToolbarPortal>
    </Form>
    <KeyboardToolbarHost name={toolbarHost} />
</View>;
```
