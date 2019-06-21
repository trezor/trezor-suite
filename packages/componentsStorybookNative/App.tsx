/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from 'react';
import styled from 'styled-components/native';
import { 
  H1, 
  H2, 
  H3, 
  H4, 
  H5, 
  H6, 
  P, 
  Link, 
  TrezorImage, 
  Button, 
  ButtonPin, 
  Checkbox,
  Input
} from '@trezor/components';

const Container = styled.ScrollView.attrs({
  contentContainerStyle: {
    justifyContent: 'center',
    paddingTop: 50,
  }
})``;

const Wrapper = styled.View`
  padding: 10px;
`;

type Props = {};
export default class App extends Component<Props> {
  render() {
    return (
      <Container>
        <Wrapper>
          <Button variant="success">
            Button Text
          </Button>
        </Wrapper>
        <Wrapper>
          <ButtonPin onClick={() => {}} />
        </Wrapper>
        <Wrapper>
          <Checkbox onClick={() => {}}>
            Checkbox
          </Checkbox>
        </Wrapper>
        <Wrapper>
          <Input
            value=""
            placeholder="placeholder..."
            bottomText="bottom text"
            topLabel="Input label"
            onChange={() => {}}
            tooltipAction={null}
          />
        </Wrapper>
        <Wrapper>
          <H1>Heading 1 with <Link href="https://trezor.io">link</Link></H1>
          <H2>Heading 2</H2>
          <H3>Heading 3</H3>
          <H4>Heading 4</H4>
          <H5>Heading 5</H5>
          <H6>Heading 6</H6>
          <Link href="https://trezor.io">Trezor.io</Link>
          <P size='small'>
            This is an paragraph small
          </P>
          <P size='medium'>
            This is an paragraph medium
          </P>
          <P size='large'>
            This is an paragraph large
          </P>
          <P size='xlarge'>
            This is an paragraph xlarge
          </P>
        </Wrapper>
        <Wrapper>
          <TrezorImage
            height={310}
            model={1}
          />
          <TrezorImage
            height={310}
            model={2}
          />
        </Wrapper>
      </Container>
    );
  }
}
