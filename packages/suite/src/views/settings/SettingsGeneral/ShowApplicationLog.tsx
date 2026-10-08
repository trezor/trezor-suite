import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { Anchor, SettingsAnchor } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { SectionItem } from '@trezor/product-components';

export const ShowApplicationLog = () => {
    const { dispatch } = useServices(injectDispatch);

    const handleClick = () => dispatch(openModal({ type: 'application-log' }));

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
