import React from 'react';

import { Translation } from '@suite/intl';
import { selectVotingDelegationOption } from '@suite-common/wallet-core';
import { Card, CollapsibleBox, Row, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

import { VotingDelegationsOptions } from './VotingDelegationsOptions';

export const VotingDelegations = () => {
    const account = useSelector(selectSelectedAccount);
    const selectedVotingDelegation = useSelector(selectVotingDelegationOption);

    if (!account || account.networkType !== 'cardano' || !selectedVotingDelegation) return null;

    return (
        <Card>
            <CollapsibleBox
                heading={
                    <Row gap={12} justifyContent="space-between">
                        <Text typographyStyle="hint">
                            <Translation id="TR_STAKING_DELEGATE_YOUR_VOTING_RIGHTS" />
                        </Text>
                    </Row>
                }
                toggleIconName="caretDown"
                toggleLabel={
                    <Text variant="default" typographyStyle="callout">
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
                <VotingDelegationsOptions />
            </CollapsibleBox>
        </Card>
    );
};
