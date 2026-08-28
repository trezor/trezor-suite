import React, { useState } from 'react';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { type NetworkType } from '@suite-common/wallet-config';
import {
    type VotingDelegationOption,
    selectVotingDelegationOption,
    stakeActions,
} from '@suite-common/wallet-core';
import { validateCardanoDrep } from '@suite-common/wallet-utils';
import { Column, Input, Radio, Text } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';

export const VOTING_OPTION_LABELS = {
    everstake: 'TR_STAKING_DELEGATE_TO_EVERSTAKE',
    another_drep: 'TR_STAKING_DELEGATE_TO_ANOTHER_DREP',
    current: 'TR_STAKING_KEEP_CURRENT_DELEGATION',
} as const satisfies Record<VotingDelegationOption['type'], TranslationKey>;

const VOTING_OPTION_KEYS = ['everstake', 'another_drep'] as const;

const VOTING_OPTION_KEYS_WITH_CURRENT = ['current', ...VOTING_OPTION_KEYS] as const;

export interface VotingDelegationsOptionsProps {
    networkType: NetworkType;
    hasTitle?: boolean;
    hasKeepCurrentOption?: boolean;
}

export const VotingDelegationsOptions = ({
    networkType,
    hasTitle = false,
    hasKeepCurrentOption = false,
}: VotingDelegationsOptionsProps) => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const selectedVotingDelegation = useSelector(selectVotingDelegationOption);
    const [hasError, setHasError] = useState<boolean>(false);

    if (networkType !== 'cardano') return null;

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

            case 'current':
                dispatch(stakeActions.setVotingDelegationOption({ type: 'current' }));
                break;
        }
    };

    const handleDrepIdChange = (value: string) => {
        const isDrepValid = validateCardanoDrep(value);
        setHasError(!isDrepValid);

        dispatch(stakeActions.setVotingDelegationOption({ type: 'another_drep', drepId: value }));
    };

    const optionKeys = hasKeepCurrentOption ? VOTING_OPTION_KEYS_WITH_CURRENT : VOTING_OPTION_KEYS;

    return (
        <Column gap={8}>
            {hasTitle && (
                <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <Translation id="TR_STAKE_CHANGE_DELEGATE" />
                </Text>
            )}
            <Column gap={16} padding={8}>
                {optionKeys.map(key => (
                    <React.Fragment key={key}>
                        <Radio
                            isChecked={selectedVotingDelegation.type === key}
                            onChange={() => handleOptionSelect(key)}
                        >
                            <Translation id={VOTING_OPTION_LABELS[key]} />
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
            <Text
                intent="neutral"
                priority="secondary"
                typographyStyle="body-sm"
                margin={{ top: 8 }}
            >
                <Translation id="TR_STAKING_DELEGATION_INFO_TEXT" />
            </Text>
        </Column>
    );
};
