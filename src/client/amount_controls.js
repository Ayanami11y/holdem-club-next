(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.AmountControls = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function toNumber(rawValue) {
    if (rawValue === null || rawValue === undefined || rawValue === '') return NaN;
    var parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function normalizeActionAmount(rawValue, min, max) {
    var minValue = Number.isFinite(Number(min)) ? Number(min) : 0;
    var maxValue = Number.isFinite(Number(max)) ? Number(max) : minValue;
    if (maxValue < minValue) maxValue = minValue;

    var parsed = Math.floor(toNumber(rawValue));
    if (!Number.isFinite(parsed)) return minValue;
    if (parsed < minValue) return minValue;
    if (parsed > maxValue) return maxValue;
    return parsed;
  }

  function formatActionAmountLabel(amount, max) {
    var parsedAmount = Math.max(0, Math.floor(Number(amount) || 0));
    var parsedMax = Math.max(0, Math.floor(Number(max) || 0));
    return parsedMax > 0 && parsedAmount === parsedMax ? '全下 $' + parsedAmount : '$' + parsedAmount;
  }

  return {
    normalizeActionAmount: normalizeActionAmount,
    formatActionAmountLabel: formatActionAmountLabel,
  };
});
