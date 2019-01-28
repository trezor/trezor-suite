import React from 'react';
import styled from 'styled-components';

import { storiesOf } from '@storybook/react';

import colors from 'config/colors';

storiesOf('Colors', module)
    .addWithJSX('White', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.WHITE};
        `;
        return <Div>{colors.WHITE}</Div>
    })
    .addWithJSX('Background', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.BACKGROUND};
        `;
        return <Div>{colors.BACKGROUND}</Div>
    })
    .addWithJSX('Header', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.HEADER};
        `;
        return <Div>{colors.HEADER}</Div>
    })
    .addWithJSX('Body', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.BODY};
        `;
        return <Div>{colors.BODY}</Div>
    })
    .addWithJSX('Landing', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.LANDING};
        `;
        return <Div>{colors.LANDING}</Div>
    })
    .addWithJSX('Text primary', () => {
        const Div = styled.div`
            height: 100vh;
            color: ${colors.TEXT_PRIMARY};
        `;
        return <Div>{colors.TEXT_PRIMARY}</Div>
    })
    .addWithJSX('Text secondary', () => {
        const Div = styled.div`
            height: 100vh;
            color: ${colors.TEXT_SECONDARY};
        `;
        return <Div>{colors.TEXT_SECONDARY}</Div>
    })
    .addWithJSX('Label color', () => {
        const Div = styled.div`
            height: 100vh;
            color: ${colors.LABEL_COLOR};
        `;
        return <Div>{colors.DIVIDER}</Div>
    })
    .addWithJSX('Gray light', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.GRAY_LIGHT};
        `;
        return <Div>{colors.GRAY_LIGHT}</Div>
    })
    .addWithJSX('Divider', () => {
        const Div = styled.div`
            padding: 10px 0;
            border-bottom: 1px solid ${colors.DIVIDER};
        `;
        return <Div>{colors.DIVIDER}</Div>
    })
    .addWithJSX('Green primary', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.GREEN_PRIMARY};
        `;
        return <Div>{colors.GREEN_PRIMARY}</Div>
    })
    .addWithJSX('Green secondary', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.GREEN_SECONDARY};
        `;
        return <Div>{colors.GREEN_SECONDARY}</Div>
    })
    .addWithJSX('Green tertiary', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.GREEN_TERTIARY};
        `;
        return <Div>{colors.GREEN_TERTIARY}</Div>
    })
    .addWithJSX('Success primary', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.SUCCESS_PRIMARY};
        `;
        return <Div>{colors.SUCCESS_PRIMARY}</Div>
    })
    .addWithJSX('Success secondary', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.SUCCESS_SECONDARY};
        `;
        return <Div>{colors.SUCCESS_SECONDARY}</Div>
    })
    .addWithJSX('Info primary', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.INFO_PRIMARY};
        `;
        return <Div>{colors.INFO_PRIMARY}</Div>
    })
    .addWithJSX('Info secondary', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.INFO_SECONDARY};
        `;
        return <Div>{colors.INFO_SECONDARY}</Div>
    })
    .addWithJSX('Warning primary', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.WARNING_PRIMARY};
        `;
        return <Div>{colors.WARNING_PRIMARY}</Div>
    })
    .addWithJSX('Warning secondary', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.WARNING_SECONDARY};
        `;
        return <Div>{colors.WARNING_SECONDARY}</Div>
    })
    .addWithJSX('Error primary', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.ERROR_PRIMARY};
        `;
        return <Div>{colors.ERROR_PRIMARY}</Div>
    })
    .addWithJSX('Error secondary', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.ERROR_SECONDARY};
        `;
        return <Div>{colors.ERROR_SECONDARY}</Div>
    })
    .addWithJSX('Tooltip background', () => {
        const Div = styled.div`
            height: 100vh;
            background: ${colors.TOOLTIP_BACKGROUND};
        `;
        return <Div>{colors.TOOLTIP_BACKGROUND}</Div>
    });
