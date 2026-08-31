import React, { useEffect } from 'react';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import {
    DEFAULT_VOTING_OPTION,
    type VotingDelegationOption,
    selectVotingDelegationOption,
    stakeActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
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
    account: Account;
    initialValue?: VotingDelegationOption;
    hasTitle?: boolean;
    resetOnMount?: boolean;
}

export const VotingDelegationsOptions = ({
    account,
    initialValue = DEFAULT_VOTING_OPTION,
    hasTitle = false,
    resetOnMount = true,
}: VotingDelegationsOptionsProps) => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const accountKey = account.key;
    const selectedVotingDelegation = useSelector(state =>
        selectVotingDelegationOption(state, accountKey),
    );

    const hasError =
        selectedVotingDelegation.type === 'another_drep' &&
        selectedVotingDelegation.drepId !== '' &&
        !validateCardanoDrep(selectedVotingDelegation.drepId);

    // reset voting delegation option on modal open
    useEffect(() => {
        if (!resetOnMount) {
            return;
        }

        dispatch(stakeActions.setVotingDelegationOption({ accountKey, option: initialValue }));
    }, [dispatch, accountKey, initialValue, resetOnMount]);

    if (account.networkType !== 'cardano') return null;

    const setOption = (option: VotingDelegationOption) =>
        dispatch(stakeActions.setVotingDelegationOption({ accountKey, option }));

    const handleOptionSelect = (type: VotingDelegationOption['type']) => {
        switch (type) {
            case 'everstake':
                setOption({ type: 'everstake' });
                break;

            case 'another_drep':
                setOption({ type: 'another_drep', drepId: '' });
                break;
        }
    };

    const handleDrepIdChange = (value: string) => {
        setOption({ type: 'another_drep', drepId: value });
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
