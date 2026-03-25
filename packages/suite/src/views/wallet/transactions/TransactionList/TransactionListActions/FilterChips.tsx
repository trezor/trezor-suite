import { Fragment } from 'react';

import styled from 'styled-components';

import { useTranslation } from '@suite/intl';
import { Button, Icon, Row } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

import { type ConditionLogic, type FilterCondition } from './useTransactionFilters';

// ─── Styled components ───────────────────────────────────────────────────────

const LogicToggle = styled.button`
    padding: 1px ${spacingsPx.xs};
    border-radius: 4px;
    border: 1px solid ${({ theme }) => theme.borderElevation2};
    background: transparent;
    color: ${({ theme }) => theme.textSubdued};
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    flex-shrink: 0;

    &:hover {
        background: ${({ theme }) => theme.backgroundSurfaceElevation2};
        color: ${({ theme }) => theme.textDefault};
    }
`;

const ChipWrapper = styled.button`
    display: inline-flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    padding: ${spacingsPx.xxs} ${spacingsPx.xs};
    border-radius: 99px;
    border: 1px solid ${({ theme }) => theme.borderElevation2};
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    color: ${({ theme }) => theme.textDefault};
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;
    max-width: 220px;

    &:hover {
        background: ${({ theme }) => theme.backgroundSurfaceElevation2};
        border-color: ${({ theme }) => theme.borderFocus};
    }
`;

const ChipLabel = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    line-height: 1.4;
`;

const Separator = styled.span`
    width: 1px;
    height: 12px;
    background: ${({ theme }) => theme.borderElevation2};
    flex-shrink: 0;
`;

const RemoveButton = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    color: ${({ theme }) => theme.textSubdued};
    flex-shrink: 0;

    &:hover {
        color: ${({ theme }) => theme.textDefault};
    }
`;

// ─── Label formatting ────────────────────────────────────────────────────────

type LabelStrings = {
    from: string;
    to: string;
    typeRecv: string;
    typeSent: string;
    typeSelf: string;
    statusConfirmed: string;
    statusPending: string;
};

const formatConditionLabel = (condition: FilterCondition, s: LabelStrings): string => {
    switch (condition.type) {
        case 'date': {
            if (condition.from && condition.to) return `${condition.from} – ${condition.to}`;
            if (condition.from) return `${s.from} ${condition.from}`;
            if (condition.to) return `${s.to} ${condition.to}`;

            return '';
        }
        case 'amount':
            return `${condition.operator} ${condition.value}`;
        case 'address':
        case 'txId':
            return condition.value.length > 14
                ? `${condition.value.slice(0, 6)}...${condition.value.slice(-4)}`
                : condition.value;
        case 'txType': {
            const typeMap: Record<typeof condition.value, string> = {
                recv: s.typeRecv,
                sent: s.typeSent,
                self: s.typeSelf,
            };

            return typeMap[condition.value];
        }
        case 'status':
            return condition.value === 'confirmed' ? s.statusConfirmed : s.statusPending;
    }
};

const getConditionIcon = (condition: FilterCondition) => {
    switch (condition.type) {
        case 'date':
            return 'calendarBlank' as const;
        case 'amount':
            return 'coins' as const;
        case 'address':
            return 'addressBook' as const;
        case 'txId':
            return 'hash' as const;
        case 'txType':
            return 'arrowsLeftRight' as const;
        case 'status':
            return 'checkCircle' as const;
    }
};

// ─── Component ───────────────────────────────────────────────────────────────

type FilterChipsProps = {
    conditions: FilterCondition[];
    logics: ConditionLogic[];
    onRemove: (id: string) => void;
    onToggleLogic: (index: number) => void;
    onClearAll: () => void;
    onEditCondition: (id: string) => void;
};

export const FilterChips = ({
    conditions,
    logics,
    onRemove,
    onToggleLogic,
    onClearAll,
    onEditCondition,
}: FilterChipsProps) => {
    const { translationString } = useTranslation();

    if (conditions.length === 0) return null;

    const labelStrings: LabelStrings = {
        from: translationString('TR_FROM'),
        to: translationString('TR_TO'),
        typeRecv: translationString('TR_TX_FILTER_TYPE_RECV'),
        typeSent: translationString('TR_TX_FILTER_TYPE_SENT'),
        typeSelf: translationString('TR_TX_FILTER_TYPE_SELF'),
        statusConfirmed: translationString('TR_TX_FILTER_STATUS_CONFIRMED'),
        statusPending: translationString('TR_TX_FILTER_STATUS_PENDING'),
    };

    return (
        <Row gap={spacings.xs} flexWrap="wrap" alignItems="center">
            {conditions.map((condition, index) => (
                <Fragment key={condition.id}>
                    <ChipWrapper onClick={() => onEditCondition(condition.id)}>
                        <Icon
                            name={getConditionIcon(condition)}
                            size={12}
                            intent="neutral"
                            priority="secondary"
                        />
                        <ChipLabel>{formatConditionLabel(condition, labelStrings)}</ChipLabel>
                        <Separator />
                        <RemoveButton
                            onClick={e => {
                                e.stopPropagation();
                                onRemove(condition.id);
                            }}
                            aria-label={translationString('TR_TX_FILTER_REMOVE')}
                        >
                            <Icon name="x" size={12} intent="neutral" />
                        </RemoveButton>
                    </ChipWrapper>
                    {index < conditions.length - 1 && (
                        <LogicToggle onClick={() => onToggleLogic(index)}>
                            {logics[index] ?? 'AND'}
                        </LogicToggle>
                    )}
                </Fragment>
            ))}
            <Button
                size="small"
                intent="neutral"
                priority="secondary"
                iconLeft="x"
                onClick={onClearAll}
            >
                {translationString('TR_TX_FILTER_CLEAR_ALL')}
            </Button>
        </Row>
    );
};
