import { type ReactNode } from 'react';

import { selectFlags, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { selectHasActiveModal } from '@suite/modal';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectIsHideSuspiciousTransactions,
    toggleHideSuspiciousTransactions,
} from '@suite-common/wallet-core';
import {
    Badge,
    Box,
    Button,
    Column,
    ComponentWithSubIcon,
    Divider,
    Dropdown,
    Paragraph,
    Radio,
    Row,
    Text,
    TextButton,
    Tooltip,
} from '@trezor/components';
import { FunnelSimpleIcon } from '@trezor/icons';
import { zIndices } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';

type FilterValue = boolean | string;

type FilterOption = {
    value: FilterValue;
    label: ReactNode;
    description?: ReactNode;
    isDefault?: boolean;
};

type FilterSection = {
    key: string;
    title: ReactNode;
    options: readonly FilterOption[];
    value: FilterValue;
    onChange: (value: FilterValue) => void;
};

const suspiciousTransactionsOptions: readonly FilterOption[] = [
    {
        value: false,
        label: <Translation id="TR_SHOW_ALL" />,
        isDefault: true,
    },
    {
        value: true,
        label: <Translation id="TR_HIDE_SUSPICIOUS" />,
        description: <Translation id="TR_HIDE_SUSPICIOUS_TRANSACTIONS_DESCRIPTION" />,
    },
];

const getSectionDefaultValue = (section: FilterSection) =>
    section.options.find(option => option.isDefault)?.value;

type FilterActionProps = {
    symbol: NetworkSymbol;
};

export const FilterAction = ({ symbol }: FilterActionProps) => {
    const { suspiciousTransactionsTooltipClosed } = useSelector(selectFlags);
    const suspiciousTransactionsHidden = useSelector(state =>
        selectIsHideSuspiciousTransactions(state, symbol),
    );
    const hasActiveModal = useSelector(selectHasActiveModal);
    const dispatch = useDispatch();

    const isOpen = !suspiciousTransactionsTooltipClosed && !hasActiveModal;

    const handleClose = () => {
        dispatch(setFlag({ key: 'suspiciousTransactionsTooltipClosed', value: true }));
    };
    const dataTest = '@wallet/accounts/hide-scam-transactions';

    const handleToggleSuspiciousTransactionsRequest = (requestedHidden: FilterValue) => {
        if (requestedHidden === suspiciousTransactionsHidden) return;
        dispatch(toggleHideSuspiciousTransactions(symbol));
    };

    const filterSections: FilterSection[] = [
        {
            key: 'suspiciousTransactions',
            title: <Translation id="TR_SUSPICIOUS_TRANSACTIONS" />,
            options: suspiciousTransactionsOptions,
            value: suspiciousTransactionsHidden,
            onChange: handleToggleSuspiciousTransactionsRequest,
        },
    ];

    const activeFilterCount = filterSections.filter(
        section => section.value !== getSectionDefaultValue(section),
    ).length;

    const handleClearAll = () => {
        filterSections.forEach(section => {
            const defaultValue = getSectionDefaultValue(section);
            if (defaultValue !== undefined && section.value !== defaultValue) {
                section.onChange(defaultValue);
            }
        });
    };

    return (
        <Tooltip
            disableFlip
            isOpen={isOpen}
            placement="bottom-end"
            zIndex={zIndices.popover}
            content={
                <Row gap={12} padding={8}>
                    <Box maxWidth={290}>
                        <Paragraph>
                            <Translation id="TR_HIDE_SCAM_TRANSACTIONS_TOOLTIP" />
                        </Paragraph>
                    </Box>
                    <Button
                        intent="neutral"
                        priority="secondary"
                        size="small"
                        onClick={handleClose}
                        data-testid="@hideScamTransactionsTooltip/gotIt"
                    >
                        <Translation id="TR_GOT_IT_BUTTON" />
                    </Button>
                </Row>
            }
        >
            <ComponentWithSubIcon
                intent="brand"
                subContent={activeFilterCount > 0 ? activeFilterCount : undefined}
            >
                <Dropdown
                    icon={FunnelSimpleIcon}
                    intent={activeFilterCount > 0 ? 'brand' : 'neutral'}
                    placement={{ position: 'bottom', alignment: 'end' }}
                    isDisabled={false}
                    tooltip={{ content: <Translation id="TR_FILTERS" />, placement: 'left' }}
                    content={
                        <Column width={250} padding={4} gap={16}>
                            <Row justifyContent="space-between" gap={16}>
                                <Text typographyStyle="body-md-strong">
                                    <Translation id="TR_FILTERS" />
                                </Text>
                                <TextButton
                                    size="small"
                                    isDisabled={activeFilterCount === 0}
                                    onClick={handleClearAll}
                                    data-testid={`${dataTest}/clear-all`}
                                >
                                    <Translation id="TR_CLEAR_ALL" />
                                </TextButton>
                            </Row>
                            <Divider margin={{ vertical: 0 }} />
                            {filterSections.map(section => (
                                <Column key={section.key} gap={16}>
                                    <Text
                                        typographyStyle="body-xs"
                                        intent="neutral"
                                        priority="secondary"
                                    >
                                        {section.title}
                                    </Text>
                                    {section.options.map(option => {
                                        const isChecked = section.value === option.value;

                                        return (
                                            <Radio
                                                key={String(option.value)}
                                                isChecked={isChecked}
                                                onChange={() => {
                                                    section.onChange(option.value);
                                                }}
                                                data-testid={dataTest}
                                                verticalAlignment="center"
                                            >
                                                <Column>
                                                    <Row gap={8}>
                                                        <Text
                                                            typographyStyle="body-sm-strong"
                                                            intent={isChecked ? 'brand' : 'neutral'}
                                                        >
                                                            {option.label}
                                                        </Text>
                                                        {option.isDefault && (
                                                            <Badge size="small">
                                                                <Translation id="TR_DEFAULT" />
                                                            </Badge>
                                                        )}
                                                    </Row>
                                                    {option.description && (
                                                        <Paragraph
                                                            typographyStyle="body-xs"
                                                            intent="neutral"
                                                            priority="secondary"
                                                            textWrap="pretty"
                                                        >
                                                            {option.description}
                                                        </Paragraph>
                                                    )}
                                                </Column>
                                            </Radio>
                                        );
                                    })}
                                </Column>
                            ))}
                        </Column>
                    }
                    data-testid={`${dataTest}/dropdown`}
                />
            </ComponentWithSubIcon>
        </Tooltip>
    );
};
