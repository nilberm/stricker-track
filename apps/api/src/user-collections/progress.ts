export type QuantityRecord = {
  quantity: number;
};

export function calculateProgress(
  totalStickers: number,
  records: QuantityRecord[],
) {
  const ownedUnique = records.filter((record) => record.quantity > 0).length;
  const duplicates = records.reduce(
    (total, record) => total + Math.max(record.quantity - 1, 0),
    0,
  );
  const totalQuantity = records.reduce(
    (total, record) => total + record.quantity,
    0,
  );
  const missing = Math.max(totalStickers - ownedUnique, 0);
  const rawCompletionPercentage =
    totalStickers > 0 ? (ownedUnique / totalStickers) * 100 : 0;
  const completionPercentage = Math.round(rawCompletionPercentage * 100) / 100;

  return {
    totalStickers,
    ownedUnique,
    missing,
    duplicates,
    totalQuantity,
    completionPercentage,
  };
}
