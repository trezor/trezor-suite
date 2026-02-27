import React from 'react';

import { Translation } from '@suite/intl';
import { selectVotingDelegationOption } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { Card, CollapsibleBox, Row, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { VotingDelegationsOptions } from './VotingDelegationsOptions';

type VotingDelegationsProps = {
    account: Account;
};

export const VotingDelegations = ({ account }: VotingDelegationsProps) => {
    const selectedVotingDelegation = useSelector(selectVotingDelegationOption);

    if (account.networkType !== 'cardano' || !selectedVotingDelegation) return null;

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
                toggleIconName="caretDown"
                toggleLabel={
                    <Text intent="neutral" typographyStyle="body-sm-strong">
                        <Translation
                            id={
                                selectedVotingDelegation.type === 'another_drep'
                                    ? 'TR_STAKING_DELEGATE_TO_ANOTHER_DREP'
                                    : 'TR_STAKING_DELEGATE_TO_EVERSTAKE'
                            }
                        />
                    </Text>
                }
                fillType="none"
                paddingType="none"
                hasDivider={false}
            >
                <VotingDelegationsOptions networkType={account.networkType} resetOnMount />
            </CollapsibleBox>
        </Card>
    );
};
