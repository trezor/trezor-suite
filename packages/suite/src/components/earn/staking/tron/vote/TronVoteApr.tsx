import { useWatch } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { Icon, Row, Text } from '@trezor/components';

import { useTronStakeContext } from '../TronStakeContext';
import { formatApr } from '../voteUtils';

export const TronVoteApr = () => {
    const { representatives, form } = useTronStakeContext();

    const representative = useWatch({ control: form.methods.control, name: 'representative' });

    if (!representative) {
        return null;
    }

    const selected = (representatives.data ?? []).find(({ address }) => address === representative);

    return (
        <Row gap={4} alignItems="center">
            <Icon name="info" size={16} intent="neutral" priority="secondary" />
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_EARN_TRON_APR_LABEL" /> {formatApr(selected?.apr)}
            </Text>
        </Row>
    );
};
