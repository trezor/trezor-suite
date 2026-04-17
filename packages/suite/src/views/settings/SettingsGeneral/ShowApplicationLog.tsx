import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { Anchor, SettingsAnchor } from '@suite/router';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch } from 'src/hooks/suite';

export const ShowApplicationLog = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(openModal({ type: 'application-log' }));

    return (
        <Anchor anchorId={SettingsAnchor.ShowLog}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_LOG" />}
                        description={<Translation id="TR_LOG_DESCRIPTION" />}
                    />
                    <ActionColumn>
                        <ActionButton
                            onClick={handleClick}
                            intent="brand"
                            data-testid="@settings/show-log-button"
                        >
                            <Translation id="TR_SHOW_LOG" />
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
