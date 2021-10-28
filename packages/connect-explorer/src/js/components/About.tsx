import React, { useState } from 'react';
import styled from 'styled-components';
import { useLocation, useHistory } from 'react-router';
import { P, H1, H2, Input, Button } from '@trezor/components';

import { useSelector } from '../hooks';

const StyledP = styled(P)`
    margin-bottom: 4px;
`;

const StyledH1 = styled(H1)`
    margin-top: 4px;
    margin-top: 16px;
`;

const StyledH2 = styled(H1)`
    margin-top: 4px;
    margin-bottom: 8px;
`;

const Code = styled.code`
    white-space: pre;
`;

const InputWrapper = styled.div`
    margin-top: 16px;
`;

const About = () => {
    const { connect } = useSelector(state => ({
        connect: state.connect,
    }));
    const location = useLocation();
    const history = useHistory();
    const [src, setSrc] = useState(connect.options?.connectSrc || '');

    const reload = () => {
        const next = {
            ...location,
            search: `src=${src}`,
        };

        history.push(next);
        window.location.reload();
    };

    return (
        <section>
            <StyledH1>TrezorConnect Explorer</StyledH1>
            <StyledP>
                <strong>TrezorConnect Explorer</strong> is a tool that can be used to test all the
                TrezorConnect methods.
            </StyledP>
            <StyledP>
                In the menu you can find a list of coins; when you choose a coin you can find the
                corresponding methods to test (e.g., within Bitcoin all bitcoin-like coins such as
                Litecoin can be tested, see also
                https://github.com/trezor/trezor-common/tree/master/defs).
            </StyledP>
            <StyledP>
                For methods not related to a coin, look under the <strong>"Other methods"</strong>{' '}
                tab.
            </StyledP>
            <StyledP>
                For methods related to the Trezor device, look under the{' '}
                <strong>"Device management"</strong> tab.
            </StyledP>
            <StyledP>
                Each method contains subsections as well as examples of how to use them.
            </StyledP>

            <StyledH2>Config</StyledH2>

            <Code>{JSON.stringify(connect.options, null, 2)}</Code>

            <InputWrapper>
                <Input
                    label="Change connect src"
                    type="text"
                    placeholder={connect.options?.connectSrc}
                    value={src}
                    onChange={e => setSrc(e.target.value)}
                />
            </InputWrapper>
            <Button onClick={() => reload()}>Submit</Button>
        </section>
    );
};

export default About;
