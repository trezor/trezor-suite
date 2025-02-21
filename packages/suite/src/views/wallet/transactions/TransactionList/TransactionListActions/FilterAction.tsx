import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

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

import { toggleHideSuspiciousTransactions } from 'src/actions/settings/walletSettingsActions';
import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';
import { selectIsHideSuspiciousTransactions } from 'src/reducers/wallet/settingsReducer';

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
                <Row gap={spacings.sm} margin={{ horizontal: spacings.xs, vertical: spacings.sm }}>
                    <Box maxWidth={290}>
                        <Text>
                            <Translation id="TR_HIDE_SCAM_TRANSACTIONS_TOOLTIP" />
                        </Text>
                    </Box>
                    <Box>
                        <Button
                            minWidth={70}
                            variant="tertiary"
                            size="small"
                            onClick={handleClose}
                            data-testid="@hideScamTransactionsTooltip/gotIt"
                        >
                            <Translation id="TR_GOT_IT_BUTTON" />
                        </Button>
                    </Box>
                </Row>
            }
        >
            <Dropdown
                icon="funnelSimple"
                ref={dropdownRef}
                placement={{ position: 'bottom', alignment: 'end' }}
                isDisabled={false}
                content={
                    <Column
                        maxWidth={272}
                        margin={{ horizontal: spacings.xxs, vertical: spacings.xxs }}
                        gap={spacings.md}
                    >
                        {options.map(option => (
                            <Row
                                key={option.id}
                                cursor="pointer"
                                justifyContent="space-between"
                                gap={spacings.md}
                                onClick={() => {
                                    handleToggleSuspiciousTransactionsRequest(Boolean(option.id));
                                }}
                            >
                                <Box>
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
                                            typographyStyle="hint"
                                            variant="tertiary"
                                            textWrap="balance"
                                        >
                                            {option.description}
                                        </Paragraph>
                                    )}
                                </Box>
                                <Box>
                                    <Radio
                                        isChecked={
                                            Boolean(suspiciousTransactionsHidden) ===
                                            Boolean(option.id)
                                        }
                                        data-testid={dataTest}
                                        onClick={event => {
                                            event.stopPropagation();
                                            handleToggleSuspiciousTransactionsRequest(
                                                Boolean(option.id),
                                            );
                                        }}
                                    />
                                </Box>
                            </Row>
                        ))}
                    </Column>
                }
                data-testid={`${dataTest}/dropdown`}
            />
        </Tooltip>
    );
};
