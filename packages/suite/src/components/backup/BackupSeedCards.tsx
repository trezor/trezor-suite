import { Card, Checkbox, Column, Icon, Paragraph, Row } from '@trezor/components';

import { ConfirmKey, toggleCheckboxByKey } from 'src/actions/backup/backupActions';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';

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

    const isChecked = (key: ConfirmKey) => backup.userConfirmed.includes(key);

    return (
        <Column gap={16}>
            <Paragraph typographyStyle="hint" variant="tertiary" align="center">
                <Translation id="TR_ONBOARDING_CLICK_TO_CONFIRM" />
            </Paragraph>
            <Column gap={16}>
                {items.map(item => (
                    <Card
                        paddingType="large"
                        key={item.key}
                        onClick={() => dispatch(toggleCheckboxByKey(item.key))}
                    >
                        <Checkbox
                            isChecked={isChecked(item.key)}
                            data-testid={`@backup/check-item/${item.key}`}
                            labelAlignment="start"
                            onClick={event => {
                                event.preventDefault();
                            }}
                        >
                            <Row gap={16}>
                                <Icon name={item.icon} />
                                {item.label}
                            </Row>
                        </Checkbox>
                    </Card>
                ))}
            </Column>
        </Column>
    );
};
