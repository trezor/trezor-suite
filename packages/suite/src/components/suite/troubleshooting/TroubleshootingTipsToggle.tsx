import { ReactNode } from 'react';

import { Collapsible, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from '../Translation';

type TroubleshootingTipsToggleProps = {
    children?: ReactNode;
};

export const TroubleshootingTipsToggle = ({ children }: TroubleshootingTipsToggleProps) => (
    <Row gap={spacings.xs} cursor="pointer">
        <Text variant="tertiary" typographyStyle="label">
            {children !== undefined ? children : <Translation id="TR_TROUBLE_SHOOTING_TIPS" />}
        </Text>
        <Collapsible.ToggleIcon
            data-testid="@onboarding/expand-troubleshooting-tips/toggle"
            size="medium"
            iconName="caretCircleDown"
        />
    </Row>
);
