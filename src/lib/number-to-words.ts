// src/lib/number-to-words.ts
// Converts a number to its English word representation for invoice amounts.
// E.g. 49996.80 → "FORTY NINE THOUSAND NINE HUNDRED NINETY SIX AND EIGHTY CENTS ONLY"

const ONES = [
  "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
  "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
  "SEVENTEEN", "EIGHTEEN", "NINETEEN",
];

const TENS = [
  "", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY",
];

function convertGroup(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = TENS[Math.floor(n / 10)];
    const o = ONES[n % 10];
    return o ? `${t} ${o}` : t;
  }
  const h = ONES[Math.floor(n / 100)];
  const rest = n % 100;
  if (rest === 0) return `${h} HUNDRED`;
  return `${h} HUNDRED ${convertGroup(rest)}`;
}

export function numberToWords(amount: number): string {
  if (amount === 0) return "ZERO ONLY";

  const whole = Math.floor(Math.abs(amount));
  const cents = Math.round((Math.abs(amount) - whole) * 100);

  const parts: string[] = [];

  if (whole === 0) {
    // skip
  } else {
    const billions = Math.floor(whole / 1_000_000_000);
    const millions = Math.floor((whole % 1_000_000_000) / 1_000_000);
    const thousands = Math.floor((whole % 1_000_000) / 1_000);
    const remainder = whole % 1_000;

    if (billions > 0) parts.push(`${convertGroup(billions)} BILLION`);
    if (millions > 0) parts.push(`${convertGroup(millions)} MILLION`);
    if (thousands > 0) parts.push(`${convertGroup(thousands)} THOUSAND`);
    if (remainder > 0) parts.push(convertGroup(remainder));
  }

  let result = parts.join(" ");

  if (cents > 0) {
    const centsWords = convertGroup(cents);
    if (result) {
      result += ` AND ${centsWords} CENTS`;
    } else {
      result = `${centsWords} CENTS`;
    }
  }

  return `${result} ONLY`;
}
