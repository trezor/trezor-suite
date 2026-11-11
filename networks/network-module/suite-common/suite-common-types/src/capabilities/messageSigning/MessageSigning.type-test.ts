import type { Label } from '../Label';
import type { MessageSigningFormatsDefinition, SignFormat } from './MessageSigning';

declare const label: Label;
type TestAccount = { readonly path: string };

// A family labels exactly the formats it offers.
const _bitcoinLikeFormats: MessageSigningFormatsDefinition<TestAccount, 'default' | 'electrum'> = {
    kind: 'signature',
    label,
    options: { default: label, electrum: label },
    getAvailable: () => ['default', 'electrum'],
};

const _missingLabel: MessageSigningFormatsDefinition<TestAccount, 'default' | 'electrum'> = {
    kind: 'signature',
    label,
    // @ts-expect-error Every offered format needs a label.
    options: { default: label },
    getAvailable: () => ['default'],
};

const _foreignFormat: MessageSigningFormatsDefinition<TestAccount, 'default' | 'electrum'> = {
    kind: 'signature',
    label,
    // @ts-expect-error A family cannot label a format of another family.
    options: { default: label, electrum: label, cose: label },
    // @ts-expect-error Nor offer it.
    getAvailable: () => ['cose'],
};

// @ts-expect-error A format cannot be made up by the UI, only received from a family.
const _inventedFormat: SignFormat = 'electrum';

void _bitcoinLikeFormats;
void _missingLabel;
void _foreignFormat;
void _inventedFormat;
