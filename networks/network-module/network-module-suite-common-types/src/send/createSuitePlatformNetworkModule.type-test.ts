import type { NetworkConfiguration } from './NetworkConfiguration';
import type { SendStrategy } from './SendStrategy';
import { createSuitePlatformNetworkModule } from './createSuitePlatformNetworkModule';

// A platform fixes its component types; two distinct stand-ins keep the slots apart.
type FieldComponent = (props: { value: string }) => null;
type FeeSelectorComponent = (props: { selectedLevelId: string }) => null;
type TestComponents = { sendField: FieldComponent; sendFeeSelector: FeeSelectorComponent };

declare const strategy: SendStrategy;
declare const fieldComponent: FieldComponent;
declare const feeSelectorComponent: FeeSelectorComponent;

const selectable = {
    key: 'test',
    supportedNetworks: ['aaa'],
    send: {
        fields: [{ id: 'memo', kind: 'text' }],
        fee: { model: 'priority', unit: 'lamports', selectable: true },
    },
} as const satisfies NetworkConfiguration;

const fixed = {
    key: 'test',
    supportedNetworks: ['aaa'],
    send: {
        fields: [],
        fee: { model: 'per-transaction', unit: 'drops', selectable: false },
    },
} as const satisfies NetworkConfiguration;

// --- a complete implementation is accepted ---

const _complete = createSuitePlatformNetworkModule<typeof selectable, TestComponents>(selectable, {
    send: { strategy, fields: { memo: fieldComponent }, feeSelector: feeSelectorComponent },
});

const _fixedFee = createSuitePlatformNetworkModule<typeof fixed, TestComponents>(fixed, {
    send: { strategy, fields: {} },
});

// --- the declaration drives what the platform must supply ---

const _missingField = createSuitePlatformNetworkModule<typeof selectable, TestComponents>(
    selectable,
    {
        // @ts-expect-error every declared field needs a component
        send: { strategy, fields: {}, feeSelector: feeSelectorComponent },
    },
);

const _extraField = createSuitePlatformNetworkModule<typeof selectable, TestComponents>(
    selectable,
    {
        send: {
            strategy,
            // @ts-expect-error a component for an undeclared field is rejected
            fields: { memo: fieldComponent, note: fieldComponent },
            feeSelector: feeSelectorComponent,
        },
    },
);

const _missingFeeSelector = createSuitePlatformNetworkModule<typeof selectable, TestComponents>(
    selectable,
    {
        // @ts-expect-error a selectable fee needs a selector
        send: { strategy, fields: { memo: fieldComponent } },
    },
);

const _unexpectedFeeSelector = createSuitePlatformNetworkModule<typeof fixed, TestComponents>(
    fixed,
    {
        // @ts-expect-error a fixed fee has no selector slot
        send: { strategy, fields: {}, feeSelector: feeSelectorComponent },
    },
);

const _wrongSlotKind = createSuitePlatformNetworkModule<typeof selectable, TestComponents>(
    selectable,
    {
        send: {
            strategy,
            // @ts-expect-error a fee selector is not a field component
            fields: { memo: feeSelectorComponent },
            feeSelector: feeSelectorComponent,
        },
    },
);

void _complete;
void _fixedFee;
void _missingField;
void _extraField;
void _missingFeeSelector;
void _unexpectedFeeSelector;
void _wrongSlotKind;
