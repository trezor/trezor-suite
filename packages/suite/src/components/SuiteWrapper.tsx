import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { Text } from 'react-native';
import { bindActionCreators } from 'redux';

import { Header } from '@trezor/components';
import { goto } from '@suite/actions/RouterActions';

interface Props {
    goto: typeof goto;
}

const Wrapper: FunctionComponent<Props> = props => {
    return (
        <>
            <Header
                sidebarEnabled={false}
                sidebarOpened={false}
                onClick={props.goto}
                links={[
                    {
                        href: 'https://trezor.io/',
                        title: 'Trezor',
                    },
                    {
                        href: 'https://wiki.trezor.io/',
                        title: 'Wiki',
                    },
                    {
                        href: 'https://blog.trezor.io/',
                        title: 'Blog',
                    },
                    {
                        href: 'https://trezor.io/support/',
                        title: 'Support',
                    },
                ]}
            />
            <Text>Suite wrapper</Text>
            {props.children}
        </>
    );
};

export default connect(
    null,
    dispatch => ({
        goto: bindActionCreators(goto, dispatch),
    }),
)(Wrapper);
