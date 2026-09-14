import { Translation } from '@suite/intl';
import { Column, H4, Paragraph } from '@trezor/components';

import { GLOBAL_RECEIVE_LIST_HEIGHT } from '../constants';

export const GlobalReceiveNoResults = () => (
    <Column
        height={GLOBAL_RECEIVE_LIST_HEIGHT}
        width="100%"
        maxWidth={380}
        alignSelf="center"
        alignItems="center"
        justifyContent="center"
        // Adjust for optical center.
        padding={{ bottom: 16 }}
    >
        <H4 typographyStyle="body-md" align="center">
            <Translation id="TR_GLOBAL_RECEIVE_NO_RESULTS" />
        </H4>
        <Paragraph typographyStyle="body-sm" priority="secondary" intent="neutral" align="center">
            <Translation id="TR_GLOBAL_RECEIVE_NO_RESULTS_DESCRIPTION" />
        </Paragraph>
    </Column>
);
