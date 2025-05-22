import { satisfies } from 'semver';

import { BackupType } from '@suite-common/suite-types';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Badge, Tooltip } from '@trezor/components';
import { getFirmwareVersion } from '@trezor/device-utils';
import { spacings } from '@trezor/theme';

import { DefaultTag } from './DefaultTag';
import { OptionWithContent } from './OptionWithContent';
import { Translation } from '../../../../components/suite';
import { useLayoutSize, useSelector } from '../../../../hooks/suite';

const UpgradableToMultiTag = () => {
    const { isBelowTablet } = useLayoutSize();

    return (
        <Badge
            variant="tertiary"
            inline
            margin={{ left: spacings.xs }}
            size={isBelowTablet ? 'tiny' : undefined}
        >
            <Translation id="TR_ONBOARDING_BACKUP_TYPE_UPGRADABLE_TO_MULTI" />
        </Badge>
    );
};

const AdvancedTag = () => {
    const { isBelowTablet } = useLayoutSize();

    return (
        <Badge
            variant="tertiary"
            inline
            margin={{ left: spacings.xs }}
            size={isBelowTablet ? 'tiny' : undefined}
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
    const device = useSelector(selectSelectedDevice);
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
