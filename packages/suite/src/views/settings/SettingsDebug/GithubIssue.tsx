import { useDevice } from '@suite/device';
import { openGithubIssue } from '@suite/github';
import { SectionItem } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';
import { selectActiveTransports } from 'src/selectors/suite/suiteSelectors';

export const GithubIssue = () => {
    const transports = useSelector(selectActiveTransports);
    const { device } = useDevice();

    const handleClick = () => openGithubIssue({ device, transports });

    return (
        <SectionItem
            title="Open issue on Github"
            description="Open issue on Github with pre-filled details. Do not use with sensitive data!"
            actions={
                <SectionItem.Button intent="brand" onClick={handleClick}>
                    Open issue
                </SectionItem.Button>
            }
        />
    );
};
