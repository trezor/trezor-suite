import { useDevice } from '@suite/device';
import { openGithubIssue } from '@suite/github';
import { useSelector } from '@suite-common/redux-utils';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { selectActiveTransports } from 'src/selectors/suite/suiteSelectors';

export const GithubIssue = () => {
    const transports = useSelector(selectActiveTransports);
    const { device } = useDevice();

    const handleClick = () => openGithubIssue({ device, transports });

    return (
        <SectionItem>
            <TextColumn
                title="Open issue on Github"
                description="Open issue on Github with pre-filled details. Do not use with sensitive data!"
            />
            <ActionColumn>
                <ActionButton intent="brand" onClick={handleClick}>
                    Open issue
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
