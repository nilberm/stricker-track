"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateProgress = calculateProgress;
function calculateProgress(totalStickers, records) {
    var ownedUnique = records.filter(function (record) { return record.quantity > 0; }).length;
    var duplicates = records.reduce(function (total, record) { return total + Math.max(record.quantity - 1, 0); }, 0);
    var totalQuantity = records.reduce(function (total, record) { return total + record.quantity; }, 0);
    var missing = Math.max(totalStickers - ownedUnique, 0);
    var rawCompletionPercentage = totalStickers > 0 ? (ownedUnique / totalStickers) * 100 : 0;
    var completionPercentage = Math.round(rawCompletionPercentage * 100) / 100;
    return {
        totalStickers: totalStickers,
        ownedUnique: ownedUnique,
        missing: missing,
        duplicates: duplicates,
        totalQuantity: totalQuantity,
        completionPercentage: completionPercentage,
    };
}
