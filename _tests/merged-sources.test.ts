import { parseTransfers } from "../src/common/generated/parsers.ts";
import { formatTransfers } from "../src/features/transfer/index.ts";

/* cSpell:disable */
// Test input with merged sources
const mergedSourcesInput = `
Lucky Vaper
Черника, с бк по 1 на л
Малина, с бл по 2 на к
Клубника, с бкл по 1 на т
`;

// Shop shorthands mapping
const shopShorthands = "б-Берлин,к-Кулакова,л-Ладожская,т-Терновка";
/* cSpell:enable */

// Test with merged sources
console.log("=== Testing with merged sources ===");
const parsedResult = parseTransfers(mergedSourcesInput, shopShorthands);

// Log the parsed transfers
console.log("\nParsed Transfers:");
Object.entries(parsedResult.transfersByDirection).forEach(
  ([direction, transfers]) => {
    console.log(`\nDirection: ${direction}`);
    transfers.forEach((transfer) => {
      console.log(`  Product: ${transfer.product}`);
      console.log(`  Source: ${transfer.source} (${transfer.sourceShop})`);
      console.log(
        `  Destination: ${transfer.destination} (${transfer.destinationShop})`,
      );
      console.log(`  Quantity: ${transfer.rawQuantity}`);
      console.log(`  Raw Text: ${transfer.rawText}`);
      console.log();
    });
  },
);

// Log unparsed lines
if (parsedResult.unparsed.length > 0) {
  console.log("\nUnparsed Lines:");
  parsedResult.unparsed.forEach((line) => {
    console.log(`  ${line}`);
  });
}

// Log statistics
const totalTransfers = Object.values(parsedResult.transfersByDirection).flat().length;
const totalUnparsed = parsedResult.unparsed.length;

console.log("\nStatistics:");
console.log(`Total transfers parsed: ${totalTransfers}`);
console.log(`Total lines unparsed: ${totalUnparsed}`);
console.log(
  `Parse success rate: ${
    Math.round(
      (totalTransfers / (totalTransfers + totalUnparsed)) * 100,
    )
  }%`,
);

// Format the transfers
const { data: formattedResult, error } = formatTransfers(parsedResult);
console.log("\nFormatted Output:");
console.log(formattedResult?.join("\n") ?? "No formatted output");
console.log("\nError:");
console.log(error);
