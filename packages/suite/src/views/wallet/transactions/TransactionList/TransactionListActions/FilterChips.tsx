import { Fragment } from 'react';

import { useTranslation } from '@suite/intl';
import { Button, ButtonGroup, IconButton, Row, TextButton } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { type ConditionLogic, type FilterCondition } from './useTransactionFilters';

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
    onEditCondition: (id: string) => void;
};

export const FilterChips = ({
    conditions,
    logics,
    onRemove,
    onToggleLogic,
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
        <Row gap={spacings.xs} flexWrap="wrap" alignItems="center" justifyContent="flex-end">
            {conditions.map((condition, index) => (
                <Fragment key={condition.id}>
                    <ButtonGroup intent="neutral" priority="secondary" size="small">
                        <Button
                            iconLeft={getConditionIcon(condition)}
                            onClick={() => onEditCondition(condition.id)}
                        >
                            {formatConditionLabel(condition, labelStrings)}
                        </Button>
                        <IconButton
                            icon="x"
                            aria-label={translationString('TR_TX_FILTER_REMOVE')}
                            onClick={e => {
                                e.stopPropagation();
                                onRemove(condition.id);
                            }}
                        />
                    </ButtonGroup>
                    {index < conditions.length - 1 && (
                        <TextButton
                            size="small"
                            intent="neutral"
                            priority="secondary"
                            onClick={() => onToggleLogic(index)}
                        >
                            {logics[index] ?? 'AND'}
                        </TextButton>
                    )}
                </Fragment>
            ))}
        </Row>
    );
};
