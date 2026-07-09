import { FormattedNumber } from 'react-intl';

import { Icon, Paragraph, Row } from '@trezor/components';

/**
 * Rough default estimate of how long a just-broadcast transaction stays pending,
 * covering block inclusion, backend indexing, and the pending-transaction polling interval.
 */
export const PENDING_TRANSACTION_TIME_ESTIMATE_SECONDS = 30;

export type PendingTransactionTimeEstimateProps = {
    seconds: number;
};

export const PendingTransactionTimeEstimate = ({
    seconds,
}: PendingTransactionTimeEstimateProps) => {
    const isInMinutes = seconds >= 60;

    return (
        <Row gap={4} alignItems="center">
            <Icon name="clock" size={16} intent="neutral" priority="secondary" />

            <Paragraph typographyStyle="body-md" intent="neutral" priority="secondary">
                ~
                <FormattedNumber
                    value={isInMinutes ? Math.round(seconds / 60) : seconds}
                    style="unit"
                    unit={isInMinutes ? 'minute' : 'second'}
                    unitDisplay="narrow"
                />
            </Paragraph>
        </Row>
    );
};
