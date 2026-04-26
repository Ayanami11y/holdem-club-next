const {
  normalizeActionAmount,
  formatActionAmountLabel,
} = require('../../src/client/amount_controls');

describe('amount_controls', () => {
  test('normalizes blank and invalid input to the minimum amount', () => {
    expect(normalizeActionAmount('', 5, 100)).toBe(5);
    expect(normalizeActionAmount('abc', 5, 100)).toBe(5);
  });

  test('clamps typed amounts within the allowed range', () => {
    expect(normalizeActionAmount('4', 5, 100)).toBe(5);
    expect(normalizeActionAmount('250', 5, 100)).toBe(100);
    expect(normalizeActionAmount('17.8', 5, 100)).toBe(17);
  });

  test('formats the all-in label at the upper bound', () => {
    expect(formatActionAmountLabel(100, 100)).toBe('全下 $100');
    expect(formatActionAmountLabel(25, 100)).toBe('$25');
  });

  test('treats collapsed min/max raise as a legal short-stack all-in target', () => {
    expect(normalizeActionAmount('85', 85, 85)).toBe(85);
    expect(formatActionAmountLabel(85, 85)).toBe('全下 $85');
  });
});
