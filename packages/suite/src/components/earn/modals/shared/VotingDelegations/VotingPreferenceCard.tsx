import React, { type ReactNode } from 'react';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import {
    type VotingDelegationOption,
    selectVotingDelegationOption,
    stakeActions,
    validateCardanoDrep,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    Badge,
    type BadgeIntent,
    Card,
    Column,
    Divider,
    Icon,
    Input,
    Radio,
    Row,
    Text,
    Tooltip,
} from '@trezor/components';
import { QuestionIcon } from '@trezor/icons';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite';

export type VotingPreferenceOption = {
    type: VotingDelegationOption['type'];
    label: TranslationKey;
    description?: TranslationKey;
    badge?: { label: TranslationKey; intent: BadgeIntent };
};

export const BASE_VOTING_PREFERENCE_OPTIONS: VotingPreferenceOption[] = [
    {
        type: 'abstain',
        label: 'TR_STAKING_VOTE_ABSTAIN',
        description: 'TR_STAKING_VOTE_ABSTAIN_DESCRIPTION',
    },
    {
        type: 'everstake',
        label: 'TR_STAKING_VOTE_LET_EVERSTAKE_VOTE',
        description: 'TR_STAKING_VOTE_LET_EVERSTAKE_VOTE_DESCRIPTION',
    },
    {
        type: 'another_drep',
        label: 'TR_STAKING_VOTE_CHOOSE_OWN_DREP',
        description: 'TR_STAKING_VOTE_CHOOSE_OWN_DREP_DESCRIPTION',
    },
];

const getVotingOption = (type: VotingDelegationOption['type']): VotingDelegationOption => {
    switch (type) {
        case 'abstain':
            return { type: 'abstain' };
        case 'everstake':
            return { type: 'everstake' };
        case 'another_drep':
            return { type: 'another_drep', drepId: '' };
        case 'current':
            return { type: 'current' };
        default:
            return exhaustive(type);
    }
};

type VotingPreferenceCardProps = {
    account: Account;
    heading: ReactNode;
    description: ReactNode;
    options: VotingPreferenceOption[];
};

export const VotingPreferenceCard = ({
    account,
    heading,
    description,
    options,
}: VotingPreferenceCardProps) => {
    const selectedVotingDelegation = useSelector(state =>
        selectVotingDelegationOption(state, account.key),
    );
    const { dispatch } = useServices(selectDispatch);
    const { translationString } = useTranslation();

    if (account.networkType !== 'cardano') return null;

    const hasError =
        selectedVotingDelegation.type === 'another_drep' &&
        selectedVotingDelegation.drepId !== '' &&
        !validateCardanoDrep(selectedVotingDelegation.drepId);

    const handleOptionSelect = (type: VotingDelegationOption['type']) => {
        dispatch(
            stakeActions.setAccountVotingDelegation({
                accountKey: account.key,
                option: getVotingOption(type),
            }),
        );
    };

    const handleDrepIdChange = (value: string) => {
        dispatch(
            stakeActions.setAccountVotingDelegation({
                accountKey: account.key,
                option: { type: 'another_drep', drepId: value },
            }),
        );
    };

    return (
        <Card>
            <Column gap={16}>
                <Column gap={4}>
                    <Row gap={8}>
                        <Text typographyStyle="body-md-strong">{heading}</Text>
                        <Tooltip content={<Translation id="TR_STAKING_DELEGATION_INFO_TEXT" />}>
                            <Icon
                                as={QuestionIcon}
                                size={16}
                                intent="neutral"
                                priority="secondary"
                            />
                        </Tooltip>
                    </Row>
                    <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                        {description}
                    </Text>
                </Column>
                <Column>
                    {options.map((option, index) => (
                        <React.Fragment key={option.type}>
                            {index > 0 && <Divider margin={{ vertical: 16 }} />}
                            <Column gap={12}>
                                <Radio
                                    isChecked={selectedVotingDelegation.type === option.type}
                                    verticalAlignment="center"
                                    onChange={() => handleOptionSelect(option.type)}
                                >
                                    <Column gap={2}>
                                        <Row gap={8}>
                                            <Text typographyStyle="body-md-strong">
                                                <Translation id={option.label} />
                                            </Text>
                                            {option.badge && (
                                                <Badge size="small" intent={option.badge.intent}>
                                                    <Text case="uppercase">
                                                        <Translation id={option.badge.label} />
                                                    </Text>
                                                </Badge>
                                            )}
                                        </Row>
                                        {option.description && (
                                            <Text
                                                intent="neutral"
                                                priority="secondary"
                                                typographyStyle="body-sm"
                                            >
                                                <Translation id={option.description} />
                                            </Text>
                                        )}
                                    </Column>
                                </Radio>
                                {selectedVotingDelegation.type === 'another_drep' &&
                                    option.type === 'another_drep' && (
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
                            </Column>
                        </React.Fragment>
                    ))}
                </Column>
            </Column>
        </Card>
    );
};
