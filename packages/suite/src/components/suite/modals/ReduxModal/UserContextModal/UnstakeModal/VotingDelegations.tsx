import React, { JSX, useState } from 'react';

import {
    VotingDelegationOption,
    selectVotingDelegationOption,
    stakeActions,
} from '@suite-common/wallet-core';
import { validateCardanoDrep } from '@suite-common/wallet-utils';
import { Card, CollapsibleBox, Column, Input, Radio, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

export const VotingDelegations = () => {
    const dispatch = useDispatch();
    const account = useSelector(selectSelectedAccount);
    const selectedVotingDelegation = useSelector(selectVotingDelegationOption);
    const [hasError, setHasError] = useState<boolean>(false);

    if (!account || account.networkType !== 'cardano') return null;

    const VOTING_OPTIONS: {
        key: VotingDelegationOption['type'];
        text: JSX.Element;
    }[] = [
        { key: 'everstake', text: <Translation id="TR_STAKING_DELEGATE_TO_EVERSTAKE" /> },
        { key: 'another_drep', text: <Translation id="TR_STAKING_DELEGATE_TO_ANOTHER_DREP" /> },
    ];

    const handleOptionSelect = (type: VotingDelegationOption['type']) => {
        switch (type) {
            case 'everstake':
                dispatch(stakeActions.setVotingDelegationOption({ type: 'everstake' }));
                break;

            case 'another_drep':
                dispatch(
                    stakeActions.setVotingDelegationOption({ type: 'another_drep', drepId: '' }),
                );
                break;

            default:
                break;
        }
    };

    const handleDrepIdChange = (value: string) => {
        const isDrepValid = validateCardanoDrep(value);
        setHasError(!isDrepValid);

        dispatch(stakeActions.setVotingDelegationOption({ type: 'another_drep', drepId: value }));
    };

    return (
        <Card>
            <CollapsibleBox
                heading={
                    <Row gap={spacings.sm} justifyContent="space-between">
                        <Text>
                            <Translation id="TR_STAKING_DELEGATE_YOUR_VOTING_RIGHTS" />
                        </Text>
                    </Row>
                }
                toggleIconName="caretDown"
                fillType="none"
                paddingType="none"
                hasDivider={false}
            >
                <Column gap={spacings.md} padding={spacings.xs}>
                    {VOTING_OPTIONS.map(({ key, text }) => (
                        <React.Fragment key={key}>
                            <Radio
                                key={key}
                                isChecked={selectedVotingDelegation.type === key}
                                onClick={() => handleOptionSelect(key)}
                            >
                                {text}
                            </Radio>
                            {selectedVotingDelegation.type === 'another_drep' &&
                                key === 'another_drep' && (
                                    <Input
                                        placeholder="DRep ID"
                                        value={selectedVotingDelegation.drepId}
                                        inputMode="text"
                                        inputState={hasError ? 'error' : 'default'}
                                        bottomText={
                                            hasError ? (
                                                <Translation id="TR_STAKING_INVALID_DREP_ID" />
                                            ) : null
                                        }
                                        onChange={e => handleDrepIdChange(e.target.value)}
                                    />
                                )}
                        </React.Fragment>
                    ))}
                </Column>
                <Text variant="tertiary">
                    <Translation id="TR_STAKING_DELEGATION_INFO_TEXT" />
                </Text>
            </CollapsibleBox>
        </Card>
    );
};
