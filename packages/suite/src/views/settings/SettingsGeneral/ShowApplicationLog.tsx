import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { SectionItem } from '@trezor/product-components';

import { useModalLoader } from '#src/hooks/suite/useModalLoader';

export const ShowApplicationLog = () => {
    const { open, preload, isLoading } = useModalLoader();

    const handleClick = () => open({ type: 'application-log' });
    const handlePreload = () => preload('application-log');

    return (
        <Anchor anchorId={SettingsAnchor.ShowLog}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                    title={<Translation id="TR_LOG" />}
                    description={<Translation id="TR_LOG_DESCRIPTION" />}
                    actions={
                        <SectionItem.Button
                            onClick={handleClick}
                            onMouseEnter={handlePreload}
                            onFocus={handlePreload}
                            isLoading={isLoading}
                            intent="brand"
                            data-testid="@settings/show-log-button"
                        >
                            <Translation id="TR_SHOW_LOG" />
                        </SectionItem.Button>
                    }
                />
            )}
        </Anchor>
    );
};
