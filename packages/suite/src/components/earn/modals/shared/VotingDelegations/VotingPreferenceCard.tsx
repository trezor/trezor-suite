import React, { type ReactNode, useState } from 'react';

import { TrezorLink } from '@suite/external-links';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import {
    type VotingDelegationOption,
    areCardanoDrepIdsEqual,
    getCardanoAccountDrepId,
    isCardanoDrepIdCip129,
    normalizeCardanoDrepId,
    selectVotingDelegationOption,
    stakeActions,
    validateCardanoDrep,
} from '@suite-common/wallet-core';
import { type Account, type AccountWithNetworkType } from '@suite-common/wallet-types';
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
import { useServices } from '@trezor/dependency-injection';
import { CheckIcon, QuestionIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';
import { HELP_CENTER_ADA_STAKING } from '@trezor/urls';

import { InputError } from 'src/components/wallet';
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

const getConvertedDrepId = (drepId: string, account: AccountWithNetworkType<'cardano'>) => {
    const normalizedDrepId = normalizeCardanoDrepId(drepId);
    if (normalizedDrepId === null) return null;

    // The backend's legacy id needs its has_script flag to preserve the credential type.
    return drepId.toLowerCase() === account.misc?.staking?.drep?.drep_id?.toLowerCase()
        ? getCardanoAccountDrepId(account)
        : normalizedDrepId;
};

const getDrepIdErrorId = (
    drepId: string,
    convertedDrepId: string | null,
    currentDrepId?: string | null,
): TranslationKey | null => {
    if (drepId === '') return null;

    if (areCardanoDrepIdsEqual(convertedDrepId ?? drepId, currentDrepId)) {
        return 'TR_STAKING_DREP_ID_IS_CURRENT_DELEGATE';
    }

    if (!validateCardanoDrep(drepId)) return 'TR_STAKING_INVALID_DREP_ID';

    if (!isCardanoDrepIdCip129(drepId)) return 'TR_STAKING_DREP_ID_LEGACY_FORMAT';

    return null;
};

type VotingPreferenceCardProps = {
    account: Account;
    heading: ReactNode;
    description: ReactNode;
    options: VotingPreferenceOption[];
    currentDrepId?: string | null;
};

export const VotingPreferenceCard = ({
    account,
    heading,
    description,
    options,
    currentDrepId,
}: VotingPreferenceCardProps) => {
    const selectedVotingDelegation = useSelector(state =>
        selectVotingDelegationOption(state, account.key),
    );
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();
    const [isDrepIdConverted, setIsDrepIdConverted] = useState(false);

    if (account.networkType !== 'cardano') return null;

    const drepId =
        selectedVotingDelegation.type === 'another_drep' ? selectedVotingDelegation.drepId : '';
    const convertedDrepId = getConvertedDrepId(drepId, account);
    const drepIdErrorId = getDrepIdErrorId(drepId, convertedDrepId, currentDrepId);

    const handleOptionSelect = (type: VotingDelegationOption['type']) => {
        setIsDrepIdConverted(false);
        dispatch(
            stakeActions.setAccountVotingDelegation({
                accountKey: account.key,
                option: getVotingOption(type),
            }),
        );
    };

    const handleDrepIdChange = (value: string) => {
        setIsDrepIdConverted(false);
        dispatch(
            stakeActions.setAccountVotingDelegation({
                accountKey: account.key,
                option: { type: 'another_drep', drepId: value },
            }),
        );
    };

    const handleDrepIdConvert = () => {
        if (convertedDrepId === null) return;

        handleDrepIdChange(convertedDrepId);
        setIsDrepIdConverted(true);
    };

    const getDrepIdBottomText = () => {
        if (drepIdErrorId === 'TR_STAKING_DREP_ID_LEGACY_FORMAT') {
            return (
                <InputError
                    message={translationString(drepIdErrorId)}
                    buttonProps={{
                        onClick: handleDrepIdConvert,
                        text: translationString('TR_STAKING_CONVERT_DREP_ID'),
                    }}
                />
            );
        }
        if (drepIdErrorId) return <Translation id={drepIdErrorId} />;
        if (isDrepIdConverted) return <Translation id="TR_STAKING_DREP_ID_CONVERTED" />;

        return null;
    };

    return (
        <Card>
            <Column gap={16}>
                <Column gap={4}>
                    <Row gap={8}>
                        <Text
                            typographyStyle="body-md-strong"
                            data-testid="@staking/voting-preference/heading"
                        >
                            {heading}
                        </Text>
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
                        {description}{' '}
                        <TrezorLink href={HELP_CENTER_ADA_STAKING} typographyStyle="body-sm">
                            <Translation id="TR_LEARN_MORE" />
                        </TrezorLink>
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
                                            <Text
                                                typographyStyle="body-md-strong"
                                                data-testid="@staking/voting-preference/option-label"
                                            >
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
                                            hasError={drepIdErrorId !== null}
                                            bottomText={getDrepIdBottomText()}
                                            bottomTextIconComponent={
                                                isDrepIdConverted && !drepIdErrorId ? (
                                                    <Icon as={CheckIcon} size={16} isDisabled />
                                                ) : undefined
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
