import { Translation } from '@suite/intl';
import { Card, Column, Divider, Icon, Row, Text } from '@trezor/components';

import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeInfoRow } from '../TronStakeInfoRow';
import { formatApr, resolveVotedRepresentativeAddress } from '../voteUtils';

export const TronVoteSummaryCard = () => {
    const { form, representatives } = useTronStakeContext();

    const votedAddress = resolveVotedRepresentativeAddress(form.methods.getValues());
    const apr = (representatives.data ?? []).find(({ address }) => address === votedAddress)?.apr;

    return (
        <Card fillType="flat" paddingType="none">
            <Column gap={0}>
                <TronStakeInfoRow label={<Translation id="TR_EARN_YIELD_STATUS" />}>
                    <Row alignItems="center" gap={8}>
                        <Icon name="checkCircleFilled" intent="brand" />
                        <Text typographyStyle="body-md" intent="brand">
                            <Translation id="TR_EARN_YIELD_COMPLETED" />
                        </Text>
                    </Row>
                </TronStakeInfoRow>

                <Divider color="borderNeutral" margin={0} />

                <TronStakeInfoRow label={<Translation id="TR_EARN_TRON_APR_LABEL" />}>
                    <Text typographyStyle="body-md-strong">{formatApr(apr)}</Text>
                </TronStakeInfoRow>
            </Column>
        </Card>
    );
};
