import React, { useEffect, useState } from 'react';

import { Translation, TranslationKey, useTranslation } from '@suite/intl';
import { NetworkType } from '@suite-common/wallet-config';
import {
    DEFAULT_VOTING_OPTION,
    VotingDelegationOption,
    selectVotingDelegationOption,
    stakeActions,
} from '@suite-common/wallet-core';
import { validateCardanoDrep } from '@suite-common/wallet-utils';
import { Column, Input, Radio, Text } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';

const VOTING_OPTIONS: {
    key: VotingDelegationOption['type'];
    translationId: TranslationKey;
}[] = [
    { key: 'everstake', translationId: 'TR_STAKING_DELEGATE_TO_EVERSTAKE' },
    { key: 'another_drep', translationId: 'TR_STAKING_DELEGATE_TO_ANOTHER_DREP' },
];

export interface VotingDelegationsOptionsProps {
    networkType: NetworkType;
    initialValue?: VotingDelegationOption;
    hasTitle?: boolean;
    resetOnMount?: boolean;
}

export const VotingDelegationsOptions = ({
    networkType,
    initialValue = DEFAULT_VOTING_OPTION,
    hasTitle = false,
    resetOnMount = true,
}: VotingDelegationsOptionsProps) => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const selectedVotingDelegation = useSelector(selectVotingDelegationOption);
    const [hasError, setHasError] = useState<boolean>(false);

    // reset voting delegation option on modal open
    useEffect(() => {
        if (!resetOnMount) {
            return;
        }

        dispatch(stakeActions.setVotingDelegationOption(initialValue));
    }, [dispatch, initialValue, resetOnMount]);

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
                <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <Translation id="TR_STAKE_CHANGE_DELEGATE" />
                </Text>
            )}
            <Column gap={16} padding={8}>
                {VOTING_OPTIONS.map(({ key, translationId }) => (
                    <React.Fragment key={key}>
                        <Radio
                            key={key}
                            isChecked={selectedVotingDelegation.type === key}
                            onChange={() => handleOptionSelect(key)}
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
