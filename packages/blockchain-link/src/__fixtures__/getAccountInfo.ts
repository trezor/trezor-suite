import blockbook from './getAccountInfo-blockbook';
import blockfrost from './getAccountInfo-blockfrost';
import ripple from './getAccountInfo-ripple';

const fixtures: {
    blockbook: typeof blockbook;
    ripple: typeof ripple;
    blockfrost: typeof blockfrost;
} = {
    blockbook,
    ripple,
    blockfrost,
};

export default fixtures;
