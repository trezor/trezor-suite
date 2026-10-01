import { Translation } from '@suite/intl';
import { Icon, Row, Tooltip } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

export const TronVoteAprLabel = () => (
    <Row gap={4} alignItems="center" justifyContent="flex-end">
        <Translation id="TR_EARN_TRON_APR_LABEL" />
        <Tooltip content={<Translation id="TR_EARN_TRON_APR_TOOLTIP" />}>
            <Icon as={InfoIcon} size={14} intent="neutral" priority="secondary" />
        </Tooltip>
    </Row>
);
