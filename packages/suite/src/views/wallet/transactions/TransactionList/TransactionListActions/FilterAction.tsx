import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    selectIsHideSuspiciousTransactions,
    toggleHideSuspiciousTransactions,
} from '@suite-common/wallet-core';
import {
    Box,
    Button,
    Column,
    Dropdown,
    DropdownRef,
    Paragraph,
    Radio,
    Row,
    Text,
    Tooltip,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';

const options = [
    {
        id: 0,
        label: <Translation id="TR_SHOW_SUSPICIOUS_TRANSACTIONS" />,
    },
    {
        id: 1,
        label: <Translation id="TR_HIDE_SUSPICIOUS_TRANSACTIONS" />,
        description: <Translation id="TR_HIDE_SUSPICIOUS_TRANSACTIONS_DESCRIPTION" />,
    },
] as const;

export const FilterAction = () => {
    const { suspiciousTransactionsTooltipClosed } = useSelector(selectSuiteFlags);
    const suspiciousTransactionsHidden = useSelector(selectIsHideSuspiciousTransactions);
    const dispatch = useDispatch();

    const isOpen = !suspiciousTransactionsTooltipClosed;

    const handleClose = () => {
        dispatch(setFlag('suspiciousTransactionsTooltipClosed', true));
    };
    const dataTest = '@wallet/accounts/hide-scam-transactions';

    const dropdownRef = useRef<DropdownRef>();

    const handleToggleSuspiciousTransactionsRequest = (requestedHidden: boolean) => {
        if (requestedHidden === suspiciousTransactionsHidden) return;
        dropdownRef.current?.close();
        dispatch(toggleHideSuspiciousTransactions());
    };

    return (
        <Tooltip
            disableFlip
            hasArrow
            isOpen={isOpen}
            placement="bottom-end"
            content={
                <Row gap={spacings.sm} padding={spacings.xs}>
                    <Box maxWidth={290}>
                        <Paragraph>
                            <Translation id="TR_HIDE_SCAM_TRANSACTIONS_TOOLTIP" />
                        </Paragraph>
                    </Box>
                    <Button
                        variant="tertiary"
                        size="small"
                        textWrap={false}
                        onClick={handleClose}
                        data-testid="@hideScamTransactionsTooltip/gotIt"
                    >
                        <Translation id="TR_GOT_IT_BUTTON" />
                    </Button>
                </Row>
            }
        >
            <Dropdown
                iconName="funnelSimple"
                ref={dropdownRef}
                placement={{ position: 'bottom', alignment: 'end' }}
                isDisabled={false}
                content={
                    <Column maxWidth={250} padding={spacings.xxs} gap={spacings.md}>
                        {options.map(option => (
                            <Radio
                                key={option.id}
                                isChecked={
                                    Boolean(suspiciousTransactionsHidden) === Boolean(option.id)
                                }
                                onClick={() => {
                                    handleToggleSuspiciousTransactionsRequest(Boolean(option.id));
                                }}
                                data-testid={dataTest}
                                verticalAlignment="center"
                            >
                                <Column>
                                    <Text
                                        typographyStyle="callout"
                                        variant={
                                            Boolean(suspiciousTransactionsHidden) ===
                                            Boolean(option.id)
                                                ? 'primary'
                                                : undefined
                                        }
                                    >
                                        {option.label}
                                    </Text>
                                    {'description' in option && option.description && (
                                        <Paragraph
                                            typographyStyle="label"
                                            variant="tertiary"
                                            textWrap="pretty"
                                        >
                                            {option.description}
                                        </Paragraph>
                                    )}
                                </Column>
                            </Radio>
                        ))}
                    </Column>
                }
                data-testid={`${dataTest}/dropdown`}
            />
        </Tooltip>
    );
};
