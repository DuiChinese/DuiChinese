/**
 * Converts an integer into standard Chinese numerals (Hanzi).
 *
 * Examples:
 * 0 -> 零
 * 1 -> 一
 * 3 -> 三
 * 10 -> 十
 * 15 -> 十五
 * 20 -> 二十
 * 42 -> 四十二
 * 100 -> 一百
 */
export function toChineseNumeral(num: number): string {
  if (!Number.isFinite(num) || num < 0) return "零"
  const n = Math.floor(num)
  if (n === 0) return "零"

  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"]

  if (n < 10) {
    return digits[n]
  }

  if (n === 10) {
    return "十"
  }

  if (n < 20) {
    return `十${digits[n % 10]}`
  }

  if (n < 100) {
    const tens = Math.floor(n / 10)
    const ones = n % 10
    return `${digits[tens]}十${ones === 0 ? "" : digits[ones]}`
  }

  if (n < 1000) {
    const hundreds = Math.floor(n / 100)
    const remainder = n % 100
    if (remainder === 0) return `${digits[hundreds]}百`
    if (remainder < 10) return `${digits[hundreds]}百零${digits[remainder]}`
    const tens = Math.floor(remainder / 10)
    const ones = remainder % 10
    return `${digits[hundreds]}百${digits[tens]}十${ones === 0 ? "" : digits[ones]}`
  }

  return n.toString()
}
