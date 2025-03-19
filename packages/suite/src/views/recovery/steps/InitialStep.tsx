import { getCheckBackupUrl, isDeviceWithButtons } from '@suite-common/suite-utils';
import { BulletList, Card, Paragraph } from '@trezor/components';
import { DeviceModelInternal, getNarrowedDeviceModelInternal } from '@trezor/device-utils';
import { spacings } from '@trezor/theme';

import { CheckItem, Translation } from 'src/components/suite';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { TranslationKey } from 'src/components/suite/Translation';
import { useDevice } from 'src/hooks/suite/useDevice';

const enterSeedInstructionsMap: Record<DeviceModelInternal, TranslationKey> = {
    [DeviceModelInternal.T1B1]: 'TR_SEED_WORDS_ENTER_COMPUTER',
    [DeviceModelInternal.T2T1]: 'TR_SEED_WORDS_ENTER_TOUCHSCREEN',
    [DeviceModelInternal.T2B1]: 'TR_SEED_WORDS_ENTER_BUTTONS',
    [DeviceModelInternal.T3B1]: 'TR_SEED_WORDS_ENTER_BUTTONS',
    [DeviceModelInternal.T3T1]: 'TR_SEED_WORDS_ENTER_TOUCHSCREEN',
    [DeviceModelInternal.T3W1]: 'TR_SEED_WORDS_ENTER_TOUCHSCREEN',
    [DeviceModelInternal.UNKNOWN]: 'TR_SEED_WORDS_ENTER_TOUCHSCREEN',
};

type InitialStepProps = {
    isUnderstood: boolean;
    setIsUnderstood: (isUnderstood: boolean) => void;
};

export const InitialStep = ({ isUnderstood, setIsUnderstood }: InitialStepProps) => {
    const { device } = useDevice();
    const deviceModelInternal = device?.features?.internal_model;

    if (!deviceModelInternal) {
        return null;
    }

    const isShamirBackupAvailable = device?.features?.capabilities?.includes('Capability_Shamir');
    const learnMoreUrl = getCheckBackupUrl(device);
    const descriptionSuffix = isDeviceWithButtons(deviceModelInternal)
        ? getNarrowedDeviceModelInternal(deviceModelInternal)
        : 'TOUCHSCREEN';

    return (
        <>
            <BulletList gap={spacings.xl} titleGap={spacings.xxxs} bulletGap={spacings.lg}>
                <BulletList.Item
                    title={
                        <Paragraph typographyStyle="hint" textWrap="pretty">
                            <Translation id={`TR_CHECK_RECOVERY_SEED_DESC_${descriptionSuffix}`} />
                        </Paragraph>
                    }
                >
                    <Paragraph
                        typographyStyle="label"
                        variant="tertiary"
                        margin={{ top: spacings.xxs }}
                    >
                        <Translation
                            id={
                                isShamirBackupAvailable
                                    ? 'TR_SEED_BACKUP_LENGTH_INCLUDING_SHAMIR'
                                    : 'TR_SEED_BACKUP_LENGTH'
                            }
                        />
                    </Paragraph>
                </BulletList.Item>
                <BulletList.Item
                    title={
                        <Paragraph typographyStyle="hint" textWrap="pretty">
                            <Translation id={enterSeedInstructionsMap[deviceModelInternal]} />
                        </Paragraph>
                    }
                >
                    <Paragraph
                        typographyStyle="label"
                        variant="tertiary"
                        margin={{ top: spacings.xxs }}
                    >
                        <Translation id="TR_ENTER_ALL_WORDS_IN_CORRECT" />
                    </Paragraph>
                </BulletList.Item>
            </BulletList>
            <Card margin={{ top: spacings.xxl }}>
                <CheckItem
                    data-testid="@recovery/user-understands-checkbox"
                    title={<Translation id="TR_DRY_RUN_CHECK_ITEM_TITLE" />}
                    description={<Translation id="TR_DRY_RUN_CHECK_ITEM_DESCRIPTION" />}
                    isChecked={isUnderstood}
                    link={learnMoreUrl && <LearnMoreButton url={learnMoreUrl} />}
                    onClick={() => setIsUnderstood(!isUnderstood)}
                />
            </Card>
        </>
    );
};
