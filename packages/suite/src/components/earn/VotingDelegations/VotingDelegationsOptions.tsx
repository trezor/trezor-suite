import React, { useEffect, useState } from 'react';

import { Translation, TranslationKey, useTranslation } from '@suite/intl';
import {
    DEFAULT_VOTING_OPTION,
    VotingDelegationOption,
    selectVotingDelegationOption,
    stakeActions,
} from '@suite-common/wallet-core';
import { validateCardanoDrep } from '@suite-common/wallet-utils';
import { Column, Input, Radio, Text } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

const VOTING_OPTIONS: {
    key: VotingDelegationOption['type'];
    translationId: TranslationKey;
}[] = [
    { key: 'everstake', translationId: 'TR_STAKING_DELEGATE_TO_EVERSTAKE' },
    { key: 'another_drep', translationId: 'TR_STAKING_DELEGATE_TO_ANOTHER_DREP' },
];

export interface VotingDelegationsOptionsProps {
    initialValue?: VotingDelegationOption;
    hasTitle?: boolean;
}

export const VotingDelegationsOptions = ({
    initialValue = DEFAULT_VOTING_OPTION,
    hasTitle = false,
}: VotingDelegationsOptionsProps) => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const account = useSelector(selectSelectedAccount);
    const selectedVotingDelegation = useSelector(selectVotingDelegationOption);
    const [hasError, setHasError] = useState<boolean>(false);

    // reset voting delegation option on modal open
    useEffect(() => {
        dispatch(stakeActions.setVotingDelegationOption(initialValue));
    }, [dispatch, initialValue]);

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
        <Column gap={8}>
            {hasTitle && (
                <Text variant="tertiary" typographyStyle="hint">
                    <Translation id="TR_STAKE_CHANGE_DELEGATE" />
                </Text>
            )}
            <Column gap={16} padding={8}>
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
                                    hasError={hasError}
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
            <Text variant="tertiary" typographyStyle="hint" margin={{ top: 8 }}>
                <Translation id="TR_STAKING_DELEGATION_INFO_TEXT" />
            </Text>
        </Column>
    );
};
