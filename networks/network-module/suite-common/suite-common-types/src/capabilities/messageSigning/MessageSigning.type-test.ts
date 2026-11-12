import type { Label } from '../Label';
import type {
    FamilyMessageSigning,
    MessageSigning,
    SignChoiceOptionId,
    SignMessageBaseParams,
    SignParamFields,
} from './MessageSigning';

declare const label: Label;
declare const base: SignMessageBaseParams;
type TestAccount = { readonly path: string };
type BitcoinLike = { readonly format: 'default' | 'electrum' };
type CardanoLike = { readonly publicKeyFormat: 'raw' | 'cose' };

// A family describes exactly the parameters it accepts, each with options of its own value type.
const _bitcoinLikeFields: SignParamFields<TestAccount, BitcoinLike> = {
    format: {
        kind: 'signature',
        label,
        getOptions: () => [
            { id: 'default', label, value: 'default' },
            { id: 'electrum', label, value: 'electrum' },
        ],
    },
};

// @ts-expect-error Every parameter needs a field.
const _missingField: SignParamFields<TestAccount, BitcoinLike> = {};

const _foreignValue: SignParamFields<TestAccount, BitcoinLike> = {
    format: {
        kind: 'signature',
        label,
        // @ts-expect-error A family cannot offer a value of another family.
        getOptions: () => [{ id: 'cose', label, value: 'cose' }],
    },
};

const _noOptions: SignParamFields<TestAccount, BitcoinLike> = {
    // @ts-expect-error A parameter always has at least one option to sign with.
    format: { kind: 'signature', label, getOptions: () => [] },
};

// @ts-expect-error A family parameter cannot reuse a name every family shares.
declare const _shadowing: FamilyMessageSigning<{ path: number }>;

// Narrowed to a family, signing takes that family's parameters as typed values.
declare const bitcoinSigning: FamilyMessageSigning<BitcoinLike>;
void bitcoinSigning.signWithParams({ ...base, format: 'electrum' });
// @ts-expect-error Bitcoin has no COSE format.
void bitcoinSigning.signWithParams({ ...base, format: 'cose' });
// @ts-expect-error Bitcoin's parameters are required, not guessed.
void bitcoinSigning.signWithParams(base);

// The shared contract takes no family values, so code for every network names no family.
declare const anySigning: MessageSigning;
// @ts-expect-error Shared code cannot pass a family's value.
void anySigning.sign({ ...base, format: 'electrum' });
// @ts-expect-error Nor invent an option id: only ids the family offered are accepted.
void anySigning.sign({ ...base, selection: { format: 'electrum' } });
declare const offeredId: SignChoiceOptionId;
void anySigning.sign({ ...base, selection: { format: offeredId } });

// Any family's signing serves where the shared contract is expected.
declare const cardanoSigning: FamilyMessageSigning<CardanoLike>;
const _asShared: readonly MessageSigning[] = [bitcoinSigning, cardanoSigning];

void _bitcoinLikeFields;
void _missingField;
void _foreignValue;
void _noOptions;
void _asShared;
