import { type ReactElement } from 'react';

import { Translation } from '@suite/intl';
import { BottomText, Icon, Link } from '@trezor/components';
import { ClockCounterClockwiseIcon, WarningIcon } from '@trezor/icons';
import { RelativeTime } from '@trezor/product-components';
import { HELP_CENTER_ZERO_VALUE_ATTACKS } from '@trezor/urls';

import { type RecipientHistoryNoteVariant } from './useRecipientHistoryNote';

const DATA_TEST_ID = '@send/address/recipient-history-note';

type RecipientHistoryNoteProps = {
    variant: RecipientHistoryNoteVariant;
};

export const RecipientHistoryNote = ({ variant }: RecipientHistoryNoteProps): ReactElement => {
    switch (variant.type) {
        case 'possiblePoisoning':
            return (
                <BottomText
                    iconComponent={<Icon as={WarningIcon} size={16} intent="critical" />}
                    data-testid={DATA_TEST_ID}
                >
                    <Translation
                        id="TR_ADDRESS_POSSIBLE_POISONING"
                        values={{
                            a: chunks => (
                                <Link href={HELP_CENTER_ZERO_VALUE_ATTACKS}>{chunks}</Link>
                            ),
                        }}
                    />
                </BottomText>
            );
        case 'newRecipient':
            return (
                <BottomText
                    iconComponent={<Icon as={WarningIcon} size={16} intent="warning" />}
                    data-testid={DATA_TEST_ID}
                >
                    <Translation id="TR_ADDRESS_NEW_RECIPIENT" />
                </BottomText>
            );
        case 'lastSent':
            return (
                <BottomText icon={ClockCounterClockwiseIcon} data-testid={DATA_TEST_ID}>
                    <Translation
                        id="TR_ADDRESS_LAST_SENT"
                        values={{
                            relativeTime: (
                                <RelativeTime
                                    timestamp={variant.lastSentTime * 1000}
                                    hasLongUnits
                                />
                            ),
                        }}
                    />
                </BottomText>
            );
    }
};
