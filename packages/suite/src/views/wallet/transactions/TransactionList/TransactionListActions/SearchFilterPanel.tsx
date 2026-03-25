import { useEffect, useRef, useState } from 'react';

import styled from 'styled-components';

import { useTranslation } from '@suite/intl';
import {
    Button,
    Column,
    Icon,
    type IconName,
    Input,
    Popover,
    type PopoverRef,
    SelectBar,
    Text,
    Timerange,
} from '@trezor/components';
import { borders, spacings, spacingsPx } from '@trezor/theme';

import { useLocales } from 'src/hooks/suite';

import {
    type AmountOperator,
    type FilterCondition,
    type NewFilterCondition,
    type TxStatusFilter,
    type TxTypeFilter,
} from './useTransactionFilters';

// ─── Styled components ───────────────────────────────────────────────────────

const PanelWrapper = styled.div`
    width: 280px;
    border-radius: ${borders.radii.md};
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
    outline: 1px solid ${({ theme }) => theme.baseBorderSurfaceAction};
    overflow: hidden;
`;

const PanelHeader = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
    padding: ${spacingsPx.sm} ${spacingsPx.md};
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation2};
`;

const BackButton = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: ${({ theme }) => theme.textSubdued};
    border-radius: ${borders.radii.xs};
    flex-shrink: 0;

    &:hover {
        color: ${({ theme }) => theme.textDefault};
        background: ${({ theme }) => theme.backgroundSurfaceElevation2};
    }
`;

const FilterTypeItem = styled.button`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.sm};
    width: 100%;
    padding: ${spacingsPx.sm} ${spacingsPx.md};
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    color: ${({ theme }) => theme.textDefault};
    font-size: 14px;
    line-height: 1.4;

    &:hover {
        background: ${({ theme }) => theme.backgroundSurfaceElevation2};
    }

    &:not(:last-child) {
        border-bottom: 1px solid ${({ theme }) => theme.borderElevation1};
    }
`;

const FilterTypeChevron = styled.div`
    margin-left: auto;
    color: ${({ theme }) => theme.textSubdued};
`;

const ConfigBody = styled.div`
    padding: ${spacingsPx.md};
`;

const DateInput = styled.input`
    width: 100%;
    height: 36px;
    padding: 0 ${spacingsPx.sm};
    border-radius: ${borders.radii.xs};
    border: 1px solid ${({ theme }) => theme.borderElevation2};
    background: ${({ theme }) => theme.backgroundSurfaceElevation2};
    color: ${({ theme }) => theme.textDefault};
    font-size: 13px;
    outline: none;
    cursor: pointer;
    box-sizing: border-box;

    &:focus {
        border-color: ${({ theme }) => theme.borderFocus};
    }

    &::-webkit-calendar-picker-indicator {
        opacity: 0.6;
        cursor: pointer;
    }
`;

const ToggleGroup = styled.div`
    display: flex;
    gap: ${spacingsPx.xxs};
    flex-wrap: wrap;
`;

const PresetGroup = styled.div`
    display: flex;
    gap: ${spacingsPx.xxs};
    flex-wrap: wrap;
`;

const PresetButton = styled.button`
    padding: 2px ${spacingsPx.xs};
    border-radius: ${borders.radii.xs};
    border: 1px solid ${({ theme }) => theme.borderElevation2};
    background: transparent;
    color: ${({ theme }) => theme.textSubdued};
    cursor: pointer;
    font-size: 12px;

    &:hover {
        background: ${({ theme }) => theme.backgroundSurfaceElevation2};
        color: ${({ theme }) => theme.textDefault};
        border-color: ${({ theme }) => theme.borderFocus};
    }
`;

const ToggleButton = styled.button<{ $selected: boolean }>`
    padding: ${spacingsPx.xs} ${spacingsPx.sm};
    border-radius: ${borders.radii.xs};
    border: 1px solid
        ${({ theme, $selected }) => ($selected ? theme.borderFocus : theme.borderElevation2)};
    background: ${({ theme, $selected }) =>
        $selected ? theme.backgroundPrimarySubtleOnElevation1 : theme.backgroundSurfaceElevation2};
    color: ${({ theme, $selected }) => ($selected ? theme.textPrimaryDefault : theme.textDefault)};
    cursor: pointer;
    font-size: 13px;
    font-weight: ${({ $selected }) => ($selected ? 600 : 400)};

    &:hover {
        border-color: ${({ theme }) => theme.borderFocus};
    }
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

const AMOUNT_OPERATORS = ['>', '<', '=', '!='] as const satisfies AmountOperator[];

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
        <Column gap={spacings.sm}>
            <PresetGroup>
                {presets.map(p => (
                    <PresetButton
                        key={p.key}
                        onClick={() => {
                            const range = getDatePreset(p.key);
                            setFrom(range.from);
                            setTo(range.to);
                        }}
                    >
                        {translationString(p.labelKey)}
                    </PresetButton>
                ))}
            </PresetGroup>
            <Column gap={spacings.xs}>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {translationString('TR_FROM')}
                </Text>
                <DateInput
                    type="date"
                    value={from}
                    max={to || undefined}
                    onChange={e => setFrom(e.target.value)}
                />
            </Column>
            <Column gap={spacings.xs}>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {translationString('TR_TO')}
                </Text>
                <DateInput
                    type="date"
                    value={to}
                    min={from || undefined}
                    onChange={e => setTo(e.target.value)}
                />
            </Column>
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
                <Button
                    size="small"
                    intent="neutral"
                    priority="secondary"
                    iconLeft="calendarBlank"
                    width="100%"
                >
                    {translationString('TR_TX_FILTER_PICK_DATES')}
                </Button>
            </Popover>
            <Button
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
    onSubmit: (condition: Extract<NewFilterCondition, { type: 'amount' }>) => void;
};

const AmountConfig = ({ initial, onSubmit }: AmountConfigProps) => {
    const { translationString } = useTranslation();
    const [operator, setOperator] = useState<AmountOperator>(initial?.operator ?? '>');
    const [value, setValue] = useState(initial?.value ?? '');

    const canSubmit = value.trim() !== '' && !Number.isNaN(Number(value.trim()));

    return (
        <Column gap={spacings.sm}>
            <SelectBar
                options={AMOUNT_OPERATORS.map(op => ({ label: op, value: op }))}
                selectedOption={operator}
                onChange={v => setOperator(v as AmountOperator)}
                size="small"
                isFullWidth
            />
            <Input
                size="small"
                type="number"
                placeholder="0.00"
                value={value}
                onChange={e => setValue(e.target.value)}
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
    const [selected, setSelected] = useState<TxTypeFilter | null>(initial ?? null);

    const options: { value: TxTypeFilter; label: string }[] = [
        { value: 'recv', label: translationString('TR_TX_FILTER_TYPE_RECV') },
        { value: 'sent', label: translationString('TR_TX_FILTER_TYPE_SENT') },
        { value: 'self', label: translationString('TR_TX_FILTER_TYPE_SELF') },
    ];

    return (
        <Column gap={spacings.sm}>
            <ToggleGroup>
                {options.map(opt => (
                    <ToggleButton
                        key={opt.value}
                        $selected={selected === opt.value}
                        onClick={() => setSelected(opt.value)}
                    >
                        {opt.label}
                    </ToggleButton>
                ))}
            </ToggleGroup>
            <Button
                intent="brand"
                priority="primary"
                isDisabled={selected === null}
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
    const [selected, setSelected] = useState<TxStatusFilter | null>(initial ?? null);

    const options: { value: TxStatusFilter; label: string }[] = [
        { value: 'confirmed', label: translationString('TR_TX_FILTER_STATUS_CONFIRMED') },
        { value: 'pending', label: translationString('TR_TX_FILTER_STATUS_PENDING') },
    ];

    return (
        <Column gap={spacings.sm}>
            <ToggleGroup>
                {options.map(opt => (
                    <ToggleButton
                        key={opt.value}
                        $selected={selected === opt.value}
                        onClick={() => setSelected(opt.value)}
                    >
                        {opt.label}
                    </ToggleButton>
                ))}
            </ToggleGroup>
            <Button
                intent="brand"
                priority="primary"
                isDisabled={selected === null}
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
};

export const SearchFilterPanel = ({
    onAdd,
    onUpdate,
    editingCondition,
    onClose,
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

    return (
        <PanelWrapper>
            <PanelHeader>
                {filterType !== null && (
                    <BackButton onClick={() => setFilterType(null)} aria-label="Back">
                        <Icon name="arrowLeft" size={16} intent="neutral" />
                    </BackButton>
                )}
                <Text typographyStyle="body-sm-strong">{getHeaderTitle()}</Text>
            </PanelHeader>

            {filterType === null ? (
                // ── Level 1: filter type selection ──────────────────────────
                FILTER_TYPES.map(ft => (
                    <FilterTypeItem key={ft.type} onClick={() => setFilterType(ft.type)}>
                        <Icon name={ft.icon} size={16} intent="neutral" priority="secondary" />
                        <span>{translationString(ft.labelKey)}</span>
                        <FilterTypeChevron>
                            <Icon name="caretRight" size={12} intent="neutral" />
                        </FilterTypeChevron>
                    </FilterTypeItem>
                ))
            ) : (
                // ── Level 2: filter configuration ───────────────────────────
                <ConfigBody>
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
                                editingCondition?.type === 'txType'
                                    ? editingCondition.value
                                    : undefined
                            }
                            onSubmit={handleSubmit}
                        />
                    )}
                    {filterType === 'status' && (
                        <StatusConfig
                            initial={
                                editingCondition?.type === 'status'
                                    ? editingCondition.value
                                    : undefined
                            }
                            onSubmit={handleSubmit}
                        />
                    )}
                </ConfigBody>
            )}
        </PanelWrapper>
    );
};
