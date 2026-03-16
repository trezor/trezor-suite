import { Translation } from '@suite/intl';
import { Card, Checkbox, Column, Grid, Icon, Paragraph, Row } from '@trezor/components';

import { type ConfirmKey, toggleCheckboxByKey } from 'src/actions/backup/backupActions';
import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';

const items = [
    {
        key: 'wrote-seed-properly',
        label: <Translation id="TR_BACKUP_CHECKBOX_1_TITLE" />,
        icon: 'key',
    },
    {
        key: 'made-no-digital-copy',
        label: <Translation id="TR_BACKUP_CHECKBOX_2_TITLE" />,
        icon: 'pencilLine',
    },
    {
        key: 'will-hide-seed',
        label: <Translation id="TR_BACKUP_CHECKBOX_3_TITLE" />,
        icon: 'anchor',
    },
] as const;

export const BackupSeedCards = () => {
    const backup = useSelector(state => state.backup);
    const dispatch = useDispatch();
    const { isBelowTablet } = useLayoutSize();

    const isChecked = (key: ConfirmKey) => backup.userConfirmed.includes(key);

    return (
        <Column gap={16}>
            <Paragraph
                typographyStyle="body-sm"
                intent="neutral"
                priority="secondary"
                align="center"
            >
                <Translation id="TR_ONBOARDING_CLICK_TO_CONFIRM" />
            </Paragraph>
            <Grid gap={16} columns={isBelowTablet ? 1 : 3}>
                {items.map(item => (
                    <Card
                        paddingType="large"
                        key={item.key}
                        onClick={() => dispatch(toggleCheckboxByKey(item.key))}
                        data-testid={`@backup/check-item/${item.key}`}
                    >
                        <Column gap={16}>
                            <Row gap={16} alignItems="flex-start" justifyContent="space-between">
                                <Icon name={item.icon} intent="neutral" priority="secondary" />
                                <Checkbox
                                    isChecked={isChecked(item.key)}
                                    onChange={event => {
                                        event.preventDefault();
                                    }}
                                />
                            </Row>
                            <Paragraph typographyStyle="body-sm">{item.label}</Paragraph>
                        </Column>
                    </Card>
                ))}
            </Grid>
        </Column>
    );
};
