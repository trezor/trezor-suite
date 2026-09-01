import { useDispatch } from 'react-redux';

import { type ConfirmKey, backupActions, selectBackup } from '@suite/backup';
import { Translation } from '@suite/intl';
import { Card, Checkbox, Column, Grid, Icon, Paragraph, Row } from '@trezor/components';
import { AnchorIcon, KeyIcon, PencilLineIcon } from '@trezor/icons';

import { useLayoutSize, useSelector } from 'src/hooks/suite';

const items = [
    {
        key: 'wrote-seed-properly',
        label: <Translation id="TR_BACKUP_CHECKBOX_1_TITLE" />,
        icon: KeyIcon,
    },
    {
        key: 'made-no-digital-copy',
        label: <Translation id="TR_BACKUP_CHECKBOX_2_TITLE" />,
        icon: PencilLineIcon,
    },
    {
        key: 'will-hide-seed',
        label: <Translation id="TR_BACKUP_CHECKBOX_3_TITLE" />,
        icon: AnchorIcon,
    },
] as const;

export const BackupSeedCards = () => {
    const backup = useSelector(selectBackup);
    const dispatch = useDispatch();
    const { isBelowTablet } = useLayoutSize();

    const isChecked = (key: ConfirmKey) => backup.userConfirmed.includes(key);

    return (
        <Column gap={16}>
            <Paragraph typographyStyle="body-sm" align="center">
                <Translation id="TR_ONBOARDING_CLICK_TO_CONFIRM" />
            </Paragraph>
            <Grid gap={16} columns={isBelowTablet ? 1 : 3}>
                {items.map(item => (
                    <Card
                        paddingType="normal"
                        height="100%"
                        minHeight="140px"
                        key={item.key}
                        onClick={() => dispatch(backupActions.toggleCheckboxByKey(item.key))}
                        data-testid={`@backup/check-item/${item.key}`}
                        type="contrast"
                    >
                        <Column height="100%" justifyContent="space-between">
                            <Row gap={16} alignItems="center" justifyContent="space-between">
                                <Checkbox
                                    isChecked={isChecked(item.key)}
                                    onChange={event => {
                                        event.preventDefault();
                                    }}
                                    onClick={event => {
                                        event.preventDefault();
                                    }}
                                />
                                <Icon as={item.icon} size={24} />
                            </Row>
                            <Paragraph typographyStyle="body-sm">{item.label}</Paragraph>
                        </Column>
                    </Card>
                ))}
            </Grid>
        </Column>
    );
};
