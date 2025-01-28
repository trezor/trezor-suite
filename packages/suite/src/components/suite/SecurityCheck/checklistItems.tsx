import styled from 'styled-components';

import { Icon } from '@trezor/components';
import { borders, spacingsPx } from '@trezor/theme';

import { SecurityChecklistItem } from 'src/views/onboarding/steps/SecurityCheck/types';

import { Translation } from '../Translation';

const IconBackground = styled.div`
    border-radius: ${borders.radii.full};
    background-color: ${({ theme }) => theme.backgroundTertiaryDefaultOnElevation0};
    padding: ${spacingsPx.xs};
`;

export const hardFailureChecklistItems: SecurityChecklistItem[] = [
    {
        icon: <Icon size={24} variant="default" name="hand" />,
        content: <Translation id="TR_AVOID_USING_DEVICE" />,
    },
    {
        icon: <Icon size={24} variant="default" name="chat" />,
        content: <Translation id="TR_USE_CHAT" values={{ b: chunks => <b>{chunks}</b> }} />,
    },
];

export const softFailureChecklistItems: SecurityChecklistItem[] = [
    {
        icon: (
            <IconBackground>
                <Icon size={20} variant="default" name="numberOne" />
            </IconBackground>
        ),
        content: <Translation id="TR_DISCONNECT_YOUR_TREZOR" />,
        subtitle: <Translation id="TR_DISCONNECT_YOUR_TREZOR_SUBTITLE" />,
    },
    {
        icon: (
            <IconBackground>
                <Icon size={20} variant="default" name="numberTwo" />
            </IconBackground>
        ),
        content: <Translation id="TR_PROBLEM_PERSISTS" />,
        subtitle: <Translation id="TR_PROBLEM_PERSISTS_SUBTITLE" />,
    },
];
