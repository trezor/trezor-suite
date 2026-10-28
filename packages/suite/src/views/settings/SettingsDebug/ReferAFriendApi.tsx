import { useState } from 'react';

import { selectIsTorEnabled } from '@suite/tor';
import {
    getReferAFriendApiDefaultUrl,
    getReferAFriendApiUrl,
    referAFriendActions,
    selectReferAFriendApiCustomUrl,
} from '@suite-common/refer-a-friend';
import { Button, ButtonGroup, Code, Column, Input, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

export const ReferAFriendApi = () => {
    const { dispatch } = useServices(injectDispatch);
    const isTorEnabled = useSelector(selectIsTorEnabled);
    const customUrl = useSelector(selectReferAFriendApiCustomUrl);
    const [apiUrl, setApiUrl] = useState(customUrl ?? '');

    const saveApiUrl = (baseUrl: string) => {
        setApiUrl(baseUrl);
        dispatch(referAFriendActions.setReferAFriendApiBaseUrl({ baseUrl }));
    };

    return (
        <SectionItem
            title="Refer a Friend API"
            description="Run the local server: yarn workspace @trezor/e2e-utils refer-a-friend-server --scenario=allStates"
            actions={
                <Column gap={4}>
                    <Input
                        data-testid="@settings/debug/refer-a-friend/api-url-input"
                        value={apiUrl}
                        onChange={event => setApiUrl(event.target.value)}
                        rightContent={
                            <Button
                                data-testid="@settings/debug/refer-a-friend/api-url-save-button"
                                onClick={() => saveApiUrl(apiUrl)}
                                size="small"
                            >
                                Save
                            </Button>
                        }
                    />
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        Default is: <Code>{getReferAFriendApiDefaultUrl({ isTorEnabled })}</Code>
                    </Text>
                    <ButtonGroup size="small" priority="secondary">
                        <Button
                            intent="critical"
                            onClick={() =>
                                saveApiUrl(getReferAFriendApiUrl({ env: 'prod', isTorEnabled }))
                            }
                        >
                            Production
                        </Button>
                        <Button
                            intent="info"
                            onClick={() =>
                                saveApiUrl(getReferAFriendApiUrl({ env: 'local', isTorEnabled }))
                            }
                        >
                            Local
                        </Button>
                        <Button intent="neutral" onClick={() => saveApiUrl('')}>
                            Reset
                        </Button>
                    </ButtonGroup>
                </Column>
            }
        />
    );
};
