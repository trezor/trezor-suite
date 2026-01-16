import React, { useEffect, useState } from 'react';

import { Translation, TranslationKey, useTranslation } from '@suite/intl';
import {
    VotingDelegationOption,
    selectVotingDelegationOption,
    stakeActions,
} from '@suite-common/wallet-core';
import { validateCardanoDrep } from '@suite-common/wallet-utils';
import { Card, CollapsibleBox, Column, Input, Radio, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

const VOTING_OPTIONS: {
    key: VotingDelegationOption['type'];
    translationId: TranslationKey;
}[] = [
    { key: 'everstake', translationId: 'TR_STAKING_DELEGATE_TO_EVERSTAKE' },
    { key: 'another_drep', translationId: 'TR_STAKING_DELEGATE_TO_ANOTHER_DREP' },
];

const DEFAULT_VOTING_OPTION: VotingDelegationOption = { type: 'everstake' };

export const VotingDelegations = () => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const account = useSelector(selectSelectedAccount);
    const selectedVotingDelegation = useSelector(selectVotingDelegationOption);
    const [hasError, setHasError] = useState<boolean>(false);

    // reset voting delegation option on modal open
    useEffect(() => {
        dispatch(stakeActions.setVotingDelegationOption(DEFAULT_VOTING_OPTION));
    }, [dispatch]);

    if (!account || account.networkType !== 'cardano') return null;

    const handleOptionSelect = (type: VotingDelegationOption['type']) => {
        setHasError(false);

        switch (type) {
            case 'everstake':
                dispatch(stakeActions.setVotingDelegationOption({ type: 'everstake' }));
                break;

            case 'another_drep':
                dispatch(
                    stakeActions.setVotingDelegationOption({ type: 'another_drep', drepId: '' }),
                );
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
                <Column gap={spacings.md} padding={spacings.xs}>
                    {VOTING_OPTIONS.map(({ key, translationId }) => (
                        <React.Fragment key={key}>
                            <Radio
                                key={key}
                                isChecked={selectedVotingDelegation.type === key}
                                onClick={() => handleOptionSelect(key)}
                            >
                                <Translation id={translationId} />
                            </Radio>
                            {selectedVotingDelegation.type === 'another_drep' &&
                                key === 'another_drep' && (
                                    <Input
                                        placeholder={translationString('TR_STAKING_DREP_ID')}
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
                <Text variant="tertiary" typographyStyle="hint" margin={{ top: spacings.xs }}>
                    <Translation id="TR_STAKING_DELEGATION_INFO_TEXT" />
                </Text>
            </CollapsibleBox>
        </Card>
    );
};
