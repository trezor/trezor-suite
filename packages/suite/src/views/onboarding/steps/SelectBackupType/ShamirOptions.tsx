import { Badge, Text, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';
import styled from 'styled-components';
import { Translation } from '../../../../components/suite';
import { useLayoutSize } from '../../../../hooks/suite';
import { BackupType } from '../../../../reducers/onboarding/onboardingReducer';
import { DefaultTag } from './DefaultTag';
import { OptionWithContent } from './OptionWithContent';

const Nowrap = styled.span`
    white-space: nowrap;
`;

const UpgradableToMultiTag = () => {
    const { isMobileLayout } = useLayoutSize();

    return (
        <Badge
            variant="tertiary"
            inline
            margin={{ left: spacings.xs }}
            size={isMobileLayout ? 'tiny' : undefined}
        >
            <Translation id="TR_ONBOARDING_BACKUP_TYPE_UPGRADABLE_TO_MULTI" />
        </Badge>
    );
};

const AdvancedTag = () => {
    const { isMobileLayout } = useLayoutSize();

    return (
        <Badge
            variant="tertiary"
            inline
            margin={{ left: spacings.xs }}
            size={isMobileLayout ? 'tiny' : undefined}
        >
            <Translation id="TR_ONBOARDING_BACKUP_TYPE_ADVANCED" />
        </Badge>
    );
};

type ShamirOptionsProps = {
    selected: BackupType;
    onSelect: (value: BackupType) => void;
    defaultType: BackupType;
};

export const ShamirOptions = ({ defaultType, onSelect, selected }: ShamirOptionsProps) => (
    <>
        <OptionWithContent
            onSelect={onSelect}
            selected={selected}
            value="shamir-single"
            tags={
                defaultType === 'shamir-single' ? (
                    <Tooltip
                        content={
                            <Translation
                                id="TR_CREATE_WALLET_DEFAULT_OPTION_TOOLTIP"
                                values={{ nowrap: chunks => <Nowrap>{chunks}</Nowrap> }}
                            />
                        }
                    >
                        <DefaultTag />
                    </Tooltip>
                ) : (
                    <UpgradableToMultiTag />
                )
            }
        >
            <Text typographyStyle="hint">
                <Translation id="TR_ONBOARDING_SEED_TYPE_SINGLE_SEED_DESCRIPTION" />
            </Text>
        </OptionWithContent>

        <OptionWithContent
            onSelect={onSelect}
            selected={selected}
            value="shamir-advanced"
            tags={
                <>
                    {defaultType === 'shamir-advanced' && <DefaultTag />}
                    <AdvancedTag />
                </>
            }
        >
            <Text typographyStyle="hint">
                <Translation id="TR_ONBOARDING_SEED_TYPE_ADVANCED_DESCRIPTION" />
            </Text>
        </OptionWithContent>
    </>
);
