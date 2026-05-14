import { Translation, type TranslationKey } from '@suite/intl';
import {
    Banner,
    Card,
    Column,
    Grid,
    H4,
    Icon,
    type IconName,
    List,
    Paragraph,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

type CalloutProps = {
    title: TranslationKey;
    items: { iconName: IconName; label: TranslationKey }[];
};

const Callout = ({ items, title }: CalloutProps) => (
    <Card>
        <Column gap={spacings.sm}>
            <H4>
                <Translation id={title} />
            </H4>
            <List gap={spacings.xs} typographyStyle="body-sm" intent="neutral" priority="secondary">
                {items.map(({ iconName, label }, index) => (
                    <List.Item key={index} bulletComponent={<Icon name={iconName} />}>
                        <Translation id={label} />
                    </List.Item>
                ))}
            </List>
        </Column>
    </Card>
);

export const MultiShareBackupStep5 = () => (
    <Column gap={spacings.xl}>
        <Column>
            <H4>
                <Translation id="TR_MULTI_SHARE_BACKUP_GREAT" />
            </H4>
            <Paragraph intent="neutral" priority="secondary">
                <Translation id="TR_CREATE_MULTI_SHARE_BACKUP_CREATED_INFO_TEXT" />
            </Paragraph>
        </Column>

        <Grid columns={2} gap={spacings.md}>
            <Callout
                title="TR_MULTI_SHARE_BACKUP_SUCCESS_LEFT"
                items={[
                    { iconName: 'coins', label: 'TR_MULTI_SHARE_BACKUP_SUCCESS_LEFT_LINE1' },
                    { iconName: 'eyeSlash', label: 'TR_MULTI_SHARE_BACKUP_SUCCESS_LEFT_LINE2' },
                ]}
            />
            <Callout
                title="TR_MULTI_SHARE_BACKUP_SUCCESS_RIGHT"
                items={[
                    { iconName: 'coins', label: 'TR_MULTI_SHARE_BACKUP_SUCCESS_RIGHT_LINE1' },
                    { iconName: 'eyeSlash', label: 'TR_MULTI_SHARE_BACKUP_SUCCESS_RIGHT_LINE2' },
                ]}
            />
        </Grid>

        <Column gap={spacings.sm}>
            <H4>
                <Translation id="TR_MULTI_SHARE_BACKUP_SUCCESS_WHY_IS_BACKUP_IMPORTANT" />
            </H4>

            <Grid columns={2} gap={spacings.md}>
                <Banner
                    intent="brand"
                    icon="trezorDevicesFilled"
                    title={<Translation id="TR_MULTI_SHARE_BACKUP_LOST_YOUR_TREZOR" />}
                    description={
                        <Translation id="TR_MULTI_SHARE_BACKUP_LOST_YOUR_TREZOR_INFO_TEXT" />
                    }
                />
                <Banner
                    intent="warning"
                    icon="recoverySeed"
                    title={<Translation id="TR_MULTI_SHARE_BACKUP_LOST_YOUR_BACKUP" />}
                    description={
                        <Translation id="TR_MULTI_SHARE_BACKUP_LOST_YOUR_BACKUP_INFO_TEXT" />
                    }
                />
            </Grid>
        </Column>
    </Column>
);
