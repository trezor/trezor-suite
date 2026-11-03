import { type ReactNode } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { InfoItem, Row, Text, TextButton } from '@trezor/components';
import { PencilSimpleIcon } from '@trezor/icons';

type AllowanceStepRowProps = {
    label: TranslationKey;
    icon?: ReactNode;
    children: ReactNode;
    onEdit?: () => void;
    'data-testid'?: string;
};

export const AllowanceStepRow = ({
    label,
    icon,
    children,
    onEdit,
    'data-testid': dataTest,
}: AllowanceStepRowProps) => (
    <InfoItem label={<Translation id={label} />} direction="row">
        <Row gap={8}>
            {icon}
            {onEdit ? (
                <TextButton
                    onClick={onEdit}
                    size="small"
                    iconRight={PencilSimpleIcon}
                    intent="brand"
                    isUnderlined
                    data-testid={dataTest}
                >
                    {children}
                </TextButton>
            ) : (
                <Text typographyStyle="body-sm-strong" data-testid={dataTest}>
                    {children}
                </Text>
            )}
        </Row>
    </InfoItem>
);
