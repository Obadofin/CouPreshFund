export default function formatNaira(amount) {
  return `₦${new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(Number(amount) || 0)}`
}