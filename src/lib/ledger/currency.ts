// The PRD's own examples ("lunch — Rs 400") and team (Nepal-based) point to
// NPR, distinct from the AUD bank-dashboard feature elsewhere in this app.
export function formatNpr(amount: number) {
  const rounded = Math.round(amount * 100) / 100;
  return `Rs ${rounded.toLocaleString("en-IN", {
    maximumFractionDigits: rounded % 1 === 0 ? 0 : 2,
  })}`;
}
