import { useDebugModeActivator } from '@suite/debug';
import { Translation, useTranslation } from '@suite/intl';
import { gotoThunk, selectIsOnboardingSettings } from '@suite/router';
import { IconButton, Row } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CaretLeftIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';

import { BasicName } from './BasicName';

export const SettingsName = () => {
    const handleTitleClick = useDebugModeActivator();
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();
    const isOnboardingSettings = useSelector(selectIsOnboardingSettings);

    return (
        <Row alignItems="center" gap={16}>
            {isOnboardingSettings && (
                <IconButton
                    icon={CaretLeftIcon}
                    intent="neutral"
                    priority="secondary"
                    size="large"
                    onClick={() => dispatch(gotoThunk({ routeName: 'onboarding-index' }))}
                    data-testid="@settings/back"
                    aria-label={translationString('TR_BACK')}
                    tooltip={{ content: <Translation id="TR_BACK" /> }}
                />
            )}
            <BasicName onClick={handleTitleClick} data-testid="@settings/menu/title">
                <Translation id="TR_SETTINGS" />
            </BasicName>
        </Row>
    );
};
