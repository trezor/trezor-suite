import React from 'react';
import colors from 'config/colors';
import { storiesOf } from '@storybook/react';
import centered from '@storybook/addon-centered';
import styled from 'styled-components';
import { H1 } from 'components/Heading';

const Section = styled.div`
    margin-top: 30px;
`;

const ColorBox = styled.div`
    text-align: center;
    width: 100px;
    height: 20px;
    padding: 20px;
    display: flex;
    margin: 0 10px 10px 0;
    justify-content: center;
    align-items: center;
    background: ${props => props.color};
    border-radius: 5px;
    color: ${props => props.text || 'inherit'};
`;

const Table = styled.table`
    margin-top: 30px;
    text-align: center;
`;
const Tr = styled.tr``;
const Td = styled.td`
    padding: 5px 15px 15px;
`;
const Th = styled.th`
    padding: 5px 15px 15px;
`;

const Code = styled.pre`
    font-size: 0.88em;
    font-family: Menlo, Monaco, "Courier New", monospace;
    background-color: rgb(250, 250, 250);
    padding: 0.5rem;
    line-height: 1.5;
    overflow-x: scroll;
`;

storiesOf('Other', module)
    .addDecorator(centered)
    .add('Colors', () => (
        <Section>
            <H1>Colors</H1>
            <Code>{`import { colors } from 'trezor-ui-components';`}</Code>
            <Table>
                <Tr>
                    <Th>Backgrounds</Th>
                    <Th>Primary</Th>
                    <Th>Text</Th>
                    <Th>State</Th>
                </Tr>
                <Tr>
                    <td>BACKGROUND</td>
                    <td>GREEN_PRIMARY</td>
                    <td>TEXT_PRIMARY</td>
                    <td>SUCCESS_PRIMARY</td>
                </Tr>
                <Tr>
                    <Td><ColorBox color={colors.BACKGROUND}>{colors.BACKGROUND}</ColorBox></Td>
                    <Td><ColorBox color={colors.GREEN_PRIMARY}>{colors.GREEN_PRIMARY}</ColorBox></Td>
                    <Td><ColorBox color={colors.TEXT_PRIMARY} text={colors.WHITE}>{colors.TEXT_PRIMARY}</ColorBox></Td>
                    <Td><ColorBox color={colors.SUCCESS_PRIMARY}>{colors.SUCCESS_PRIMARY}</ColorBox></Td>
                </Tr>
                <Tr>
                    <td>WHITE</td>
                    <td>GREEN_SECONDARY</td>
                    <td>TEXT_SECONDARY</td>
                    <td>SUCCESS_SECONDARY</td>
                </Tr>
                <Tr>
                    <Td><ColorBox color={colors.WHITE}>{colors.WHITE}</ColorBox></Td>
                    <Td><ColorBox color={colors.GREEN_SECONDARY}>{colors.GREEN_SECONDARY}</ColorBox></Td>
                    <Td><ColorBox color={colors.TEXT_SECONDARY}>{colors.TEXT_SECONDARY}</ColorBox></Td>
                    <Td><ColorBox color={colors.SUCCESS_SECONDARY}>{colors.SUCCESS_SECONDARY}</ColorBox></Td>
                </Tr>
                <Tr>
                    <td>HEADER</td>
                    <td>GREEN_TERTIARY</td>
                    <td>LABEL_COLOR</td>
                    <td>INFO_PRIMARY</td>
                </Tr>
                <Tr>
                    <Td><ColorBox color={colors.HEADER} text={colors.WHITE}>{colors.HEADER}</ColorBox></Td>
                    <Td><ColorBox color={colors.GREEN_TERTIARY}>{colors.GREEN_TERTIARY}</ColorBox></Td>
                    <Td><ColorBox color={colors.LABEL_COLOR}>{colors.LABEL_COLOR}</ColorBox></Td>
                    <Td><ColorBox color={colors.INFO_PRIMARY}>{colors.INFO_PRIMARY}</ColorBox></Td>
                </Tr>
                <Tr>
                    <td>BODY</td>
                    <td />
                    <td>GRAY_LIGHT</td>
                    <td>INFO_SECONDARY</td>
                </Tr>
                <Tr>
                    <Td><ColorBox color={colors.BODY}>{colors.BODY}</ColorBox></Td>
                    <Td />
                    <Td><ColorBox color={colors.GRAY_LIGHT}>{colors.GRAY_LIGHT}</ColorBox></Td>
                    <Td><ColorBox color={colors.INFO_SECONDARY}>{colors.INFO_SECONDARY}</ColorBox></Td>
                </Tr>
                <Tr>
                    <td />
                    <td />
                    <td>TOOLTIP_BACKGROUND</td>
                    <td>WARNING_PRIMARY</td>
                </Tr>
                <Tr>
                    <Td />
                    <Td />
                    <Td><ColorBox color={colors.TOOLTIP_BACKGROUND} text={colors.WHITE}>{colors.TOOLTIP_BACKGROUND}</ColorBox></Td>
                    <Td><ColorBox color={colors.WARNING_PRIMARY}>{colors.WARNING_PRIMARY}</ColorBox></Td>
                </Tr>
                <Tr>
                    <td />
                    <td />
                    <td>DIVIDER</td>
                    <td>WARNING_SECONDARY</td>
                </Tr>
                <Tr>
                    <Td />
                    <Td />
                    <Td><ColorBox color={colors.DIVIDER}>{colors.DIVIDER}</ColorBox></Td>
                    <Td><ColorBox color={colors.WARNING_SECONDARY}>{colors.WARNING_SECONDARY}</ColorBox></Td>
                </Tr>
                <Tr>
                    <td />
                    <td />
                    <td />
                    <td>ERROR_PRIMARY</td>
                </Tr>
                <Tr>
                    <Td />
                    <Td />
                    <Td />
                    <Td><ColorBox color={colors.ERROR_PRIMARY}>{colors.ERROR_PRIMARY}</ColorBox></Td>
                </Tr>
                <Tr>
                    <td />
                    <td />
                    <td />
                    <td>ERROR_SECONDARY</td>
                </Tr>
                <Tr>
                    <Td />
                    <Td />
                    <Td />
                    <Td><ColorBox color={colors.ERROR_SECONDARY}>{colors.ERROR_SECONDARY}</ColorBox></Td>
                </Tr>
            </Table>
        </Section>
    ));
