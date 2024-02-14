import { TrezordNode } from './http';

const trezordNode = new TrezordNode({ port: 21325 });

trezordNode.start();
