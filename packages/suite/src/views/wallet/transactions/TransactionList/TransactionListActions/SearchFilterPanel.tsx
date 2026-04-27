import { useEffect, useRef, useState } from 'react';

import styled from 'styled-components';

import { useTranslation } from '@suite/intl';
import {
    Button,
    Column,
    type DropdownMenuItemProps,
    IconButton,
    type IconName,
    Input,
    Menu,
    Popover,
    type PopoverRef,
    Row,
    Select,
    SelectBar,
    Text,
    TextButton,
    Timerange,
} from '@trezor/components';
import { borders, spacings, spacingsPx, zIndices } from '@trezor/theme';

import { useLocales } from 'src/hooks/suite';

import {
    type AmountOperator,
    type FilterCondition,
    type NewFilterCondition,
    type TxStatusFilter,
    type TxTypeFilter,
} from './useTransactionFilters';

// ─── Styled components ───────────────────────────────────────────────────────

const DateRangeTrigger = styled.button`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
    width: 100%;
    height: 36px;
    padding: 0 ${spacingsPx.sm};
    border-radius: ${borders.radii.xs};
    border: 1px solid ${({ theme }) => theme.borderElevation2};
    background: ${({ theme }) => theme.backgroundSurfaceElevation2};
    color: ${({ theme }) => theme.textDefault};
    font-size: 13px;
    cursor: pointer;
    box-sizing: border-box;

    &:hover,
    &:focus-visible {
        border-color: ${({ theme }) => theme.borderFocus};
        outline: none;
    }
`;

const DateRangePart = styled.span<{ $hasValue: boolean }>`
    flex: 1;
    text-align: center;
    color: ${({ theme, $hasValue }) => ($hasValue ? theme.textDefault : theme.textSubdued)};
    font-size: 13px;
`;

const DateRangeSeparator = styled.span`
    color: ${({ theme }) => theme.textSubdued};
    flex-shrink: 0;
`;

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterType = NewFilterCondition['type'];

type FilterTypeConfig = {
    type: FilterType;
    labelKey:
        | 'TR_TX_FILTER_DATE'
        | 'TR_TX_FILTER_AMOUNT'
        | 'TR_TX_FILTER_ADDRESS'
        | 'TR_TX_FILTER_TX_TYPE'
        | 'TR_TX_FILTER_TX_ID'
        | 'TR_TX_FILTER_STATUS';
    icon: IconName;
};

const FILTER_TYPES: FilterTypeConfig[] = [
    { type: 'date', labelKey: 'TR_TX_FILTER_DATE', icon: 'calendarBlank' },
    { type: 'amount', labelKey: 'TR_TX_FILTER_AMOUNT', icon: 'coins' },
    { type: 'txType', labelKey: 'TR_TX_FILTER_TX_TYPE', icon: 'arrowsLeftRight' },
    { type: 'status', labelKey: 'TR_TX_FILTER_STATUS', icon: 'checkCircle' },
    { type: 'address', labelKey: 'TR_TX_FILTER_ADDRESS', icon: 'addressBook' },
    { type: 'txId', labelKey: 'TR_TX_FILTER_TX_ID', icon: 'hash' },
];

const AMOUNT_OPERATOR_LABEL_KEYS = {
    '>': 'TR_TX_FILTER_OPERATOR_GT',
    '<': 'TR_TX_FILTER_OPERATOR_LT',
    '=': 'TR_TX_FILTER_OPERATOR_EQ',
    '!=': 'TR_TX_FILTER_OPERATOR_NEQ',
} as const satisfies Record<AmountOperator, string>;

// ─── Date preset helpers ──────────────────────────────────────────────────────

const fmt = (d: Date) => d.toISOString().split('T')[0];

const getDatePreset = (preset: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear') => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    switch (preset) {
        case 'thisMonth':
            return { from: fmt(new Date(y, m, 1)), to: fmt(new Date(y, m + 1, 0)) };
        case 'lastMonth':
            return { from: fmt(new Date(y, m - 1, 1)), to: fmt(new Date(y, m, 0)) };
        case 'thisYear':
            return { from: fmt(new Date(y, 0, 1)), to: fmt(new Date(y, 11, 31)) };
        case 'lastYear':
            return { from: fmt(new Date(y - 1, 0, 1)), to: fmt(new Date(y - 1, 11, 31)) };
    }
};

// ─── Configuration views ─────────────────────────────────────────────────────

type DateConfigProps = {
    initial?: { from?: string; to?: string };
    locale: ReturnType<typeof useLocales>;
    onSubmit: (condition: Extract<NewFilterCondition, { type: 'date' }>) => void;
};

const DateConfig = ({ initial, locale, onSubmit }: DateConfigProps) => {
    const { translationString } = useTranslation();
    const timerangePopoverRef = useRef<PopoverRef>(undefined);
    const [from, setFrom] = useState(initial?.from ?? '');
    const [to, setTo] = useState(initial?.to ?? '');

    const canSubmit = from.trim() !== '' || to.trim() !== '';

    const handleTimerangeSubmit = (startDate: Date, endDate: Date) => {
        setFrom(fmt(startDate));
        setTo(fmt(endDate));
        timerangePopoverRef.current?.close();
    };

    const presets: {
        key: Parameters<typeof getDatePreset>[0];
        labelKey:
            | 'TR_TX_FILTER_PRESET_THIS_MONTH'
            | 'TR_TX_FILTER_PRESET_LAST_MONTH'
            | 'TR_TX_FILTER_PRESET_THIS_YEAR'
            | 'TR_TX_FILTER_PRESET_LAST_YEAR';
    }[] = [
        { key: 'thisMonth', labelKey: 'TR_TX_FILTER_PRESET_THIS_MONTH' },
        { key: 'lastMonth', labelKey: 'TR_TX_FILTER_PRESET_LAST_MONTH' },
        { key: 'thisYear', labelKey: 'TR_TX_FILTER_PRESET_THIS_YEAR' },
        { key: 'lastYear', labelKey: 'TR_TX_FILTER_PRESET_LAST_YEAR' },
    ];

    return (
        <Column gap={12}>
            <Row gap={20} flexWrap="wrap">
                {presets.map(p => (
                    <TextButton
                        key={p.key}
                        size="small"
                        intent="neutral"
                        priority="secondary"
                        onClick={() => {
                            const range = getDatePreset(p.key);
                            setFrom(range.from);
                            setTo(range.to);
                        }}
                    >
                        {translationString(p.labelKey)}
                    </TextButton>
                ))}
            </Row>
            <Popover
                ref={timerangePopoverRef}
                content={
                    <Timerange
                        startDate={from ? new Date(`${from}T00:00:00`) : undefined}
                        endDate={to ? new Date(`${to}T00:00:00`) : undefined}
                        onSubmit={handleTimerangeSubmit}
                        onCancel={() => timerangePopoverRef.current?.close()}
                        ctaSubmit={translationString('TR_CONFIRM')}
                        ctaCancel={translationString('TR_CANCEL')}
                        locale={locale}
                    />
                }
            >
                <DateRangeTrigger>
                    <DateRangePart $hasValue={!!from}>
                        {from || translationString('TR_FROM')}
                    </DateRangePart>
                    <DateRangeSeparator>–</DateRangeSeparator>
                    <DateRangePart $hasValue={!!to}>
                        {to || translationString('TR_TO')}
                    </DateRangePart>
                </DateRangeTrigger>
            </Popover>
            <Button
                margin={{ top: 8 }}
                intent="brand"
                priority="primary"
                isDisabled={!canSubmit}
                width="100%"
                onClick={() =>
                    onSubmit({
                        type: 'date',
                        from: from.trim() || undefined,
                        to: to.trim() || undefined,
                    })
                }
            >
                {translationString('TR_TX_FILTER_APPLY')}
            </Button>
        </Column>
    );
};

type AmountConfigProps = {
    initial?: { operator: AmountOperator; value: string };
    symbol: string;
    onSubmit: (condition: Extract<NewFilterCondition, { type: 'amount' }>) => void;
};

const AmountConfig = ({ initial, symbol, onSubmit }: AmountConfigProps) => {
    const { translationString } = useTranslation();
    const [operator, setOperator] = useState<AmountOperator>(initial?.operator ?? '>');
    const [value, setValue] = useState(initial?.value ?? '');

    const canSubmit = value.trim() !== '' && !Number.isNaN(Number(value.trim()));

    const operatorOptions = (Object.keys(AMOUNT_OPERATOR_LABEL_KEYS) as AmountOperator[]).map(
        op => ({ value: op, label: translationString(AMOUNT_OPERATOR_LABEL_KEYS[op]) }),
    );

    return (
        <Column gap={spacings.sm}>
            <Select
                size="small"
                value={operatorOptions.find(o => o.value === operator)}
                options={operatorOptions}
                onChange={option => setOperator(option.value as AmountOperator)}
                isSearchable={false}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                menuPortalZIndex={zIndices.popover}
            />
            <Input
                size="small"
                value={value}
                onChange={e => setValue(e.target.value)}
                rightContent={
                    <Text intent="neutral" priority="secondary">
                        {symbol.toUpperCase()}
                    </Text>
                }
            />
            <Button
                intent="brand"
                priority="primary"
                isDisabled={!canSubmit}
                width="100%"
                onClick={() => onSubmit({ type: 'amount', operator, value: value.trim() })}
            >
                {translationString('TR_TX_FILTER_APPLY')}
            </Button>
        </Column>
    );
};

type TextConfigProps = {
    filterType: 'address' | 'txId';
    initial?: string;
    onSubmit: (
        condition:
            | Extract<NewFilterCondition, { type: 'address' }>
            | Extract<NewFilterCondition, { type: 'txId' }>,
    ) => void;
};

const TextConfig = ({ filterType, initial, onSubmit }: TextConfigProps) => {
    const { translationString } = useTranslation();
    const [value, setValue] = useState(initial ?? '');

    const placeholder =
        filterType === 'address'
            ? translationString('TR_ADDRESS')
            : translationString('TR_TX_FILTER_TX_ID_PLACEHOLDER');

    return (
        <Column gap={spacings.sm}>
            <Input
                size="small"
                placeholder={placeholder}
                value={value}
                onChange={e => setValue(e.target.value)}
                onClear={() => setValue('')}
                showClearButton={value !== ''}
            />
            <Button
                intent="brand"
                priority="primary"
                isDisabled={value.trim() === ''}
                width="100%"
                onClick={() =>
                    onSubmit({ type: filterType, value: value.trim() } as
                        | Extract<NewFilterCondition, { type: 'address' }>
                        | Extract<NewFilterCondition, { type: 'txId' }>)
                }
            >
                {translationString('TR_TX_FILTER_APPLY')}
            </Button>
        </Column>
    );
};

type TxTypeConfigProps = {
    initial?: TxTypeFilter;
    onSubmit: (condition: Extract<NewFilterCondition, { type: 'txType' }>) => void;
};

const TxTypeConfig = ({ initial, onSubmit }: TxTypeConfigProps) => {
    const { translationString } = useTranslation();
    const [selected, setSelected] = useState<TxTypeFilter | undefined>(initial);

    const options: { value: TxTypeFilter; label: string }[] = [
        { value: 'recv', label: translationString('TR_TX_FILTER_TYPE_RECV') },
        { value: 'sent', label: translationString('TR_TX_FILTER_TYPE_SENT') },
        { value: 'self', label: translationString('TR_TX_FILTER_TYPE_SELF') },
    ];

    return (
        <Column gap={spacings.sm}>
            <SelectBar
                options={options}
                selectedOption={selected}
                onChange={v => setSelected(v as TxTypeFilter)}
                size="small"
                isFullWidth
            />
            <Button
                intent="brand"
                priority="primary"
                isDisabled={selected === undefined}
                width="100%"
                onClick={() => selected && onSubmit({ type: 'txType', value: selected })}
            >
                {translationString('TR_TX_FILTER_APPLY')}
            </Button>
        </Column>
    );
};

type StatusConfigProps = {
    initial?: TxStatusFilter;
    onSubmit: (condition: Extract<NewFilterCondition, { type: 'status' }>) => void;
};

const StatusConfig = ({ initial, onSubmit }: StatusConfigProps) => {
    const { translationString } = useTranslation();
    const [selected, setSelected] = useState<TxStatusFilter | undefined>(initial);

    const options: { value: TxStatusFilter; label: string }[] = [
        { value: 'confirmed', label: translationString('TR_TX_FILTER_STATUS_CONFIRMED') },
        { value: 'pending', label: translationString('TR_TX_FILTER_STATUS_PENDING') },
    ];

    return (
        <Column gap={spacings.sm}>
            <SelectBar
                options={options}
                selectedOption={selected}
                onChange={v => setSelected(v as TxStatusFilter)}
                size="small"
                isFullWidth
            />
            <Button
                intent="brand"
                priority="primary"
                isDisabled={selected === undefined}
                width="100%"
                onClick={() => selected && onSubmit({ type: 'status', value: selected })}
            >
                {translationString('TR_TX_FILTER_APPLY')}
            </Button>
        </Column>
    );
};

// ─── Main panel ──────────────────────────────────────────────────────────────

type SearchFilterPanelProps = {
    onAdd: (condition: NewFilterCondition) => void;
    onUpdate: (condition: NewFilterCondition) => void;
    editingCondition?: FilterCondition;
    onClose: () => void;
    symbol: string;
};

export const SearchFilterPanel = ({
    onAdd,
    onUpdate,
    editingCondition,
    onClose,
    symbol,
}: SearchFilterPanelProps) => {
    const { translationString } = useTranslation();
    const locale = useLocales();
    const [filterType, setFilterType] = useState<FilterType | null>(editingCondition?.type ?? null);

    // When editingCondition changes (new edit session), reset to its type
    useEffect(() => {
        setFilterType(editingCondition?.type ?? null);
    }, [editingCondition?.id, editingCondition?.type]);

    const handleSubmit = (condition: NewFilterCondition) => {
        if (editingCondition) {
            onUpdate(condition);
        } else {
            onAdd(condition);
        }
        onClose();
    };

    const selectedTypeConfig = FILTER_TYPES.find(ft => ft.type === filterType);

    const getHeaderTitle = () => {
        if (filterType) return translationString(selectedTypeConfig!.labelKey);
        if (editingCondition) return translationString('TR_TX_FILTER_EDIT');

        return translationString('TR_TX_FILTER_ADD');
    };

    // ── Level 1: build items array ───────────────────────────────────────────
    const filterTypeItems: DropdownMenuItemProps[] = FILTER_TYPES.map(ft => ({
        label: translationString(ft.labelKey),
        icon: ft.icon as IconName,
        iconRight: 'caretRight' as IconName,
        closeOnClick: false,
        onClick: () => setFilterType(ft.type),
    }));

    // ── Level 2: config form shown as content ────────────────────────────────
    console.log('filterType', filterType);
    console.log('editingCondition', editingCondition);
    console.log('filterTypeItems', filterTypeItems);
    const configContent =
        filterType !== null ? (
            <Column gap={spacings.sm}>
                <Row gap={spacings.xs} alignItems="center">
                    <IconButton
                        icon="arrowLeft"
                        size="small"
                        intent="neutral"
                        priority="secondary"
                        onClick={() => setFilterType(null)}
                    />
                    <Text typographyStyle="body-sm-strong">{getHeaderTitle()}</Text>
                </Row>
                {filterType === 'date' && (
                    <DateConfig
                        initial={
                            editingCondition?.type === 'date'
                                ? { from: editingCondition.from, to: editingCondition.to }
                                : undefined
                        }
                        locale={locale}
                        onSubmit={handleSubmit}
                    />
                )}
                {filterType === 'amount' && (
                    <AmountConfig
                        initial={
                            editingCondition?.type === 'amount'
                                ? {
                                      operator: editingCondition.operator,
                                      value: editingCondition.value,
                                  }
                                : undefined
                        }
                        symbol={symbol}
                        onSubmit={handleSubmit}
                    />
                )}
                {(filterType === 'address' || filterType === 'txId') && (
                    <TextConfig
                        filterType={filterType}
                        initial={
                            editingCondition?.type === filterType
                                ? editingCondition.value
                                : undefined
                        }
                        onSubmit={handleSubmit}
                    />
                )}
                {filterType === 'txType' && (
                    <TxTypeConfig
                        initial={
                            editingCondition?.type === 'txType' ? editingCondition.value : undefined
                        }
                        onSubmit={handleSubmit}
                    />
                )}
                {filterType === 'status' && (
                    <StatusConfig
                        initial={
                            editingCondition?.type === 'status' ? editingCondition.value : undefined
                        }
                        onSubmit={handleSubmit}
                    />
                )}
            </Column>
        ) : undefined;

    return (
        <Menu
            minWidth={300}
            items={filterType === null ? filterTypeItems : undefined}
            content={configContent}
        />
    );
};
