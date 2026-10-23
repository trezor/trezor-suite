import { Translation } from '@suite/intl';
import { useServices } from '@trezor/dependency-injection';
import { HardDrivesIcon } from '@trezor/icons';
import { SectionItem, SettingsSection } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';
import { breakpoints } from '@trezor/theme';

import { resetCustomServersThunk } from 'src/actions/suite/suiteThunks';
import { useSelector } from 'src/hooks/suite';
import { selectHasCustomServers } from 'src/selectors/suite/backendSelectors';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

export const ResetCustomServers = () => {
    const { dispatch } = useServices(injectDispatch);
    const hasContentBelowTabletWidth = useIsContentBelowBreakpoint(breakpoints.tablet);
    const hasCustomServers = useSelector(selectHasCustomServers);

    if (!hasCustomServers) return null;

    return (
        <SettingsSection
            title={<Translation id="TR_CUSTOM_SERVERS" />}
            icon={HardDrivesIcon}
            hasVerticalLayout={hasContentBelowTabletWidth}
        >
            <SectionItem
                title={<Translation id="TR_RESET_CUSTOM_SERVERS" />}
                description={<Translation id="TR_RESET_CUSTOM_SERVERS_DESCRIPTION" />}
                actions={
                    <SectionItem.Button
                        onClick={() => dispatch(resetCustomServersThunk({ willReload: false }))}
                        intent="warning"
                        data-testid="@settings/reset-custom-servers-button"
                    >
                        <Translation id="TR_RESET_CUSTOM_SERVERS_BUTTON" />
                    </SectionItem.Button>
                }
            />
        </SettingsSection>
    );
};
