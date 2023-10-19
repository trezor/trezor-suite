import styled from 'styled-components';

import { Truncate as TruncateComponent } from './Truncate';

const Holder = styled.div`
    display: flex;
    justify-content: center;
    width: 300px;
    padding: 100px 0px;
`;

export default {
    title: 'Misc/Truncate',
    args: {
        numberOfLines: 1,
        shortText: 'We were a small team.',
        longText:
            'But now, our team consists of many developers. Matej Kriz, Martin Varmuza, Carlos, Leonid, Tomas Klima, Jan Komarek, Marek Polak, Dan, Bohdan and Honza.',
    },
};

export const Truncate = {
    render: ({ ...args }) => (
        <>
            <Holder>
                <TruncateComponent lines={args.numberOfLines}>{args.shortText}</TruncateComponent>
            </Holder>
            <Holder>
                <TruncateComponent lines={args.numberOfLines}>{args.longText}</TruncateComponent>
            </Holder>
        </>
    ),
};
