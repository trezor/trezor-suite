import { Translation } from '@suite/intl';
import { BottomText, Icon } from '@trezor/components';
import { ClockCounterClockwiseIcon, WarningIcon } from '@trezor/icons';
import { RelativeTime } from '@trezor/product-components';

import { type RecipientHistoryNoteVariant } from './useRecipientHistoryNote';

const DATA_TEST_ID = '@send/address/recipient-history-note';

type RecipientHistoryNoteProps = {
    variant: RecipientHistoryNoteVariant;
};

export const RecipientHistoryNote = ({ variant }: RecipientHistoryNoteProps) =>
    variant.type === 'newRecipient' ? (
        <BottomText
            iconComponent={<Icon as={WarningIcon} size={16} intent="warning" />}
            data-testid={DATA_TEST_ID}
        >
            <Translation id="TR_ADDRESS_NEW_RECIPIENT" />
        </BottomText>
    ) : (
        <BottomText icon={ClockCounterClockwiseIcon} data-testid={DATA_TEST_ID}>
            <Translation
                id="TR_ADDRESS_LAST_SENT"
                values={{
                    relativeTime: (
                        <RelativeTime timestamp={variant.lastSentTime * 1000} hasLongUnits />
                    ),
                }}
            />
        </BottomText>
    );
