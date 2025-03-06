import { Solana } from '..';

describe('Solana', () => {
  it('should create a new Solana instance', () => {
    const solana = new Solana();
    expect(solana).toBeInstanceOf(Solana);
  });
});
