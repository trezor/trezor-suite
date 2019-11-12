import React from 'react';
import styled from 'styled-components/native';
import { H1, H2, H3, H4, H5, H6, P, Link } from '@trezor/components';

const Wrapper = styled.View`
    padding: 10px;
`;

const Col = styled.View`
    flex-direction: column;
`;

const Typography = () => {
    const pContent =
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Et harum quidem rerum facilis est et expedita distinctio. Fusce tellus. Nullam justo enim, consectetuer nec, ullamcorper ac, vestibulum in, elit. Mauris elementum mauris vitae tortor. Mauris metus.';

    return (
        <Wrapper>
            <Col>
                <H1 data-test="heading_1">Heading level 1</H1>
                <H2 data-test="heading_2">Heading level 2</H2>
                <H3 data-test="heading_3">Heading level 3</H3>
                <H4 data-test="heading_4">Heading level 4</H4>
                <H5 data-test="heading_5">Heading level 5</H5>
                <H6 data-test="heading_6">Heading level 6</H6>
            </Col>
            <H1>Paragraph</H1>

            <H5>small</H5>
            <Col>
                <P size="small" data-test="paragraph_small">
                    This is a SMALL paragraph with{' '}
                    <Link href="/test" isGreen>
                        link
                    </Link>
                    .{pContent}
                </P>
            </Col>

            <H5>medium</H5>
            <Col>
                <P size="medium" data-test="paragraph_medium">
                    This is a MEDIUM paragraph with{' '}
                    <Link href="/test" isGreen>
                        link
                    </Link>
                    .{pContent}
                </P>
            </Col>

            <Col>
                <H5>large</H5>
                <P size="large" data-test="paragraph_large">
                    This is a LARGE paragraph with{' '}
                    <Link href="/test" isGray>
                        {' '}
                        gray link
                    </Link>
                    .{pContent}
                </P>
            </Col>

            <Col>
                <H5>xlarge</H5>
                <P size="xlarge" data-test="paragraph_xlarge">
                    This is a XLARGE paragraph with{' '}
                    <Link href="/test" isGreen>
                        link
                    </Link>
                    .{pContent}
                </P>
            </Col>
        </Wrapper>
    );
};

export default Typography;
