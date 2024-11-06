import { satisfies } from 'semver';

import { Badge, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { selectDevice } from '@suite-common/wallet-core';
import { getFirmwareVersion } from '@trezor/device-utils';

import { Translation } from '../../../../components/suite';
import { useLayoutSize, useSelector } from '../../../../hooks/suite';
import { BackupType } from '../../../../reducers/onboarding/onboardingReducer';
import { DefaultTag } from './DefaultTag';
import { OptionWithContent } from './OptionWithContent';

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

export const ShamirOptions = ({ defaultType, onSelect, selected }: ShamirOptionsProps) => {
    const device = useSelector(selectDevice);
    const firmwareVersion = getFirmwareVersion(device);

    const is1of1shamirSupportedByFirmware = satisfies(firmwareVersion, '>=2.7.1');

    return (
        <>
            <OptionWithContent
                onSelect={onSelect}
                selected={selected}
                value="shamir-single"
                disabled={!is1of1shamirSupportedByFirmware}
                tooltip={
                    is1of1shamirSupportedByFirmware ? undefined : (
                        <Translation id="TR_CREATE_WALLET_DEFAULT_OPTION_DISABLED_TOOLTIP" />
                    )
                }
                tags={
                    defaultType === 'shamir-single' ? (
                        <Tooltip
                            content={<Translation id="TR_CREATE_WALLET_DEFAULT_OPTION_TOOLTIP" />}
                        >
                            <DefaultTag />
                        </Tooltip>
                    ) : (
                        <UpgradableToMultiTag />
                    )
                }
            >
                <Translation id="TR_ONBOARDING_SEED_TYPE_SINGLE_SEED_DESCRIPTION" />
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
                <Translation id="TR_ONBOARDING_SEED_TYPE_ADVANCED_DESCRIPTION" />
            </OptionWithContent>
        </>
    );
};
