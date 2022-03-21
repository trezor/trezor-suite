import { decodePaymentRequest } from '../bolt11';

const bolt11Invoice = 'lnbc1u1p3zy90ypp5ftx6rntlzct24x6lp8ef7a9am6cjm7x2emnyqw06wdtavxt70uusdq2235hqgrdv5cqzpgsp5auv6l7l83re90nlzx2c8fl8rr7q5kh4umwzwqx5dgpu4t359d6sq9qyyssq0cen86h520c6k03082tlgfahu9fw73ed5jgtjjz8rg8jxuzfcje8amay95xge3sa8ymwha350pgnz28wyc8tmdgv4va44aen9le33xcqmnvu47';

describe('decode bolt11 invoice', () => {
    it('decoding an invoice should be  truthy', () => {
        expect(decodePaymentRequest(bolt11Invoice)).toBeTruthy();
    });
});
