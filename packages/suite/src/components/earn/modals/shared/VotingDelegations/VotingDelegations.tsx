import { Translation } from '@suite/intl';
import { selectVotingDelegationOption } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Card, CollapsibleBox, Row, Text } from '@trezor/components';
import { CaretDownIcon } from '@trezor/icons';

import { useSeededCardanoVotingDelegation } from 'src/hooks/earn/useCardanoAccountVotingDelegation';
import { useSelector } from 'src/hooks/suite';

import { VOTING_OPTION_LABELS, VotingDelegationsOptions } from './VotingDelegationsOptions';

type VotingDelegationsProps = {
    account: Account;
};

export const VotingDelegations = ({ account }: VotingDelegationsProps) => {
    const selectedVotingDelegation = useSelector(selectVotingDelegationOption);

    const accountVotingDelegation = useSeededCardanoVotingDelegation(account);

    const isCardanoAccount = account.networkType === 'cardano';

    if (!isCardanoAccount) return null;

    return (
        <Card>
            <CollapsibleBox
                heading={
                    <Row gap={12} justifyContent="space-between">
                        <Text typographyStyle="body-sm">
                            <Translation id="TR_STAKING_DELEGATE_YOUR_VOTING_RIGHTS" />
                        </Text>
                    </Row>
                }
                toggleIcon={CaretDownIcon}
                toggleLabel={
                    <Text intent="neutral" typographyStyle="body-sm-strong">
                        <Translation id={VOTING_OPTION_LABELS[selectedVotingDelegation.type]} />
                    </Text>
                }
                fillType="none"
                paddingType="none"
                hasDivider={false}
            >
                <VotingDelegationsOptions
                    networkType={account.networkType}
                    hasKeepCurrentOption={!!accountVotingDelegation}
                />
            </CollapsibleBox>
        </Card>
    );
};
