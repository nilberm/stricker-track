import { calculateProgress } from './progress';

describe('calculateProgress', () => {
  it('counts unique ownership separately from total quantity', () => {
    expect(
      calculateProgress(3, [{ quantity: 3 }, { quantity: 1 }, { quantity: 0 }]),
    ).toEqual({
      totalStickers: 3,
      ownedUnique: 2,
      missing: 1,
      duplicates: 2,
      totalQuantity: 4,
      completionPercentage: 66.67,
    });
  });

  it('rounds completion percentage to two decimal places', () => {
    expect(calculateProgress(30, [{ quantity: 1 }, { quantity: 1 }])).toEqual(
      expect.objectContaining({ completionPercentage: 6.67 }),
    );
  });
});
