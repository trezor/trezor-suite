import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { resetSuiteAppThunk } from 'src/actions/suite/suiteThunks';
import { useDispatch } from 'src/hooks/suite';

export const ClearStorage = () => {
    const dispatch = useDispatch();

    const handleClick = async () => {
        await dispatch(resetSuiteAppThunk());
    };

    return (
        <Anchor anchorId={SettingsAnchor.ClearStorage}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_SUITE_STORAGE" />}
                        description={<Translation id="TR_CLEAR_STORAGE_DESCRIPTION" />}
                    />
                    <ActionColumn>
                        <ActionButton
                            onClick={handleClick}
                            intent="warning"
                            data-testid="@settings/reset-app-button"
                        >
                            <Translation id="TR_CLEAR_STORAGE" />
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
