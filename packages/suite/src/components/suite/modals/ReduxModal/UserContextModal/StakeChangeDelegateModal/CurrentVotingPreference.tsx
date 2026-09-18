import { Translation } from '@suite/intl';
import {
    CARDANO_ALWAYS_ABSTAIN_DREP_ID,
    CARDANO_EVERSTAKE_DREP,
    getCardanoAccountDrepId,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Card, Column, IconCircle, Row, Text } from '@trezor/components';
import { CheckCircleIcon } from '@trezor/icons';

type CurrentVotingPreferenceProps = {
    account: Account;
};

export const CurrentVotingPreference = ({ account }: CurrentVotingPreferenceProps) => {
    if (account.networkType !== 'cardano') return null;

    const currentDrepId = getCardanoAccountDrepId(account);

    const getCurrentPreferenceLabel = () => {
        switch (currentDrepId) {
            case null:
                return <Translation id="TR_STAKE_NONE" />;
            case CARDANO_ALWAYS_ABSTAIN_DREP_ID:
                return <Translation id="TR_STAKING_VOTE_ABSTAIN" />;
            case CARDANO_EVERSTAKE_DREP.bech32:
                return 'Everstake';
            default:
                return <Translation id="TR_STAKE_PROVIDER_UNKNOWN" />;
        }
    };

    return (
        <Card>
            <Row gap={20} justifyContent="space-between">
                <Column gap={2}>
                    <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                        <Translation id="TR_STAKING_CURRENT_PREFERENCE" />
                    </Text>
                    <Text typographyStyle="body-md-strong">{getCurrentPreferenceLabel()}</Text>
                    {!!currentDrepId && (
                        <Text
                            intent="neutral"
                            priority="secondary"
                            typographyStyle="body-sm"
                            isMonospaced
                            wordBreak="break-all"
                        >
                            {currentDrepId}
                        </Text>
                    )}
                </Column>
                <IconCircle icon={CheckCircleIcon} intent="brand" size={40} />
            </Row>
        </Card>
    );
};
