import { describe, it, expect } from "vitest"
import { toChineseNumeral } from "./chinese-numerals"

describe("toChineseNumeral", () => {
  it("converts 0-10 accurately", () => {
    expect(toChineseNumeral(0)).toBe("零")
    expect(toChineseNumeral(1)).toBe("一")
    expect(toChineseNumeral(5)).toBe("五")
    expect(toChineseNumeral(9)).toBe("九")
    expect(toChineseNumeral(10)).toBe("十")
  })

  it("converts teens properly (11-19 as 十一 to 十九)", () => {
    expect(toChineseNumeral(11)).toBe("十一")
    expect(toChineseNumeral(15)).toBe("十五")
    expect(toChineseNumeral(19)).toBe("十九")
  })

  it("converts multiples of ten (20, 30, etc.)", () => {
    expect(toChineseNumeral(20)).toBe("二十")
    expect(toChineseNumeral(30)).toBe("三十")
    expect(toChineseNumeral(50)).toBe("五十")
  })

  it("converts composite two-digit numbers", () => {
    expect(toChineseNumeral(21)).toBe("二十一")
    expect(toChineseNumeral(99)).toBe("九十九")
  })

  it("converts hundreds and edge cases with zero", () => {
    expect(toChineseNumeral(100)).toBe("一百")
    expect(toChineseNumeral(105)).toBe("一百零五")
    expect(toChineseNumeral(120)).toBe("一百二十")
    expect(toChineseNumeral(365)).toBe("三百六十五")
  })
})
