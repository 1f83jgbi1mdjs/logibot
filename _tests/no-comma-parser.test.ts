import { parseTransfers } from "../src/common/generated/parsers.ts";

// Define shop shorthands for testing
const shopShorthands = "б-Берлин,к-Кулакова,л-Ладожская,т-Терновка";

console.log("=== Testing parsing without commas ===\n");

// Test a single line to debug
const testLine = "дарксайд шот ванильный 4 с к на т";
console.log(`Testing line: "${testLine}"`);

// Let's try with a comma to see if that works
const testLineWithComma = "дарксайд шот ванильный 4, с к на т";
console.log(`Testing line with comma: "${testLineWithComma}"`);

// Let's create a simple test function to debug the parsing
function debugParseLine(line: string) {
  console.log(`\nDebugging line: "${line}"`);

  // Check for "на [shop]" pattern
  const naRegex = /на\s+([^\s.,]+)/gi;
  let naMatch;
  console.log("Looking for 'на [shop]' patterns:");
  while ((naMatch = naRegex.exec(line)) !== null) {
    console.log(`  Found: "${naMatch[0]}" at index ${naMatch.index}, destination: "${naMatch[1]}"`);
  }

  // Check for "с [shop]" pattern
  const sRegex = /с\s+([^\s.,]+)/gi;
  let sMatch;
  console.log("Looking for 'с [shop]' patterns:");
  while ((sMatch = sRegex.exec(line)) !== null) {
    console.log(`  Found: "${sMatch[0]}" at index ${sMatch.index}, source: "${sMatch[1]}"`);
  }

  // Check if shop branches are valid
  console.log("Checking if shop branches are valid:");
  const shopBranchMap = new Map<string, string>();
  shopShorthands.split(",").forEach((entry) => {
    const [shorthand, fullName] = entry.split("-");
    if (shorthand && fullName) {
      shopBranchMap.set(shorthand.toLowerCase(), fullName);
    }
  });

  console.log("  Shop branch map:");
  shopBranchMap.forEach((value, key) => {
    console.log(`    ${key} => ${value}`);
  });

  // Check if "к" and "т" are valid shop branches
  console.log("  Is 'к' a valid shop branch?", shopBranchMap.has("к"));
  console.log("  Is 'т' a valid shop branch?", shopBranchMap.has("т"));
}

// Debug our test lines
debugParseLine(testLine);
debugParseLine(testLineWithComma);

// Parse the test lines
const resultWithoutComma = parseTransfers(testLine, shopShorthands);
const resultWithComma = parseTransfers(testLineWithComma, shopShorthands);

console.log("\nShop branch map:");
console.log(shopShorthands);

console.log("\nResults for line without comma:");
console.log(JSON.stringify(resultWithoutComma, null, 2));

console.log("\nResults for line with comma:");
console.log(JSON.stringify(resultWithComma, null, 2));

// Test cases without commas
const testInput = `
дарксайд шот ванильный 4 с к на т
экспириенс батл эпл с б на к
берри вс с к 2 на л
берри вс с б 2шт на л
черника с бк по 1 на л
малина с к на л и на б по 1
западный с к 2 на л. с б 1 на л
`;

// Parse the test input
const result = parseTransfers(testInput, shopShorthands);

// Display the parsed transfers
console.log("Parsed Transfers:\n");

Object.entries(result.transfersByDirection).forEach(([direction, transfers]) => {
  console.log(`Direction: ${direction}`);

  transfers.forEach((transfer) => {
    console.log(`  Product: ${transfer.product}`);
    console.log(`  Source: ${transfer.source} (${transfer.sourceShop})`);
    console.log(`  Destination: ${transfer.destination} (${transfer.destinationShop})`);
    console.log(`  Quantity: ${transfer.rawQuantity}`);
    console.log(`  Raw Text: ${transfer.rawText}`);
    console.log("\n");
  });
});

// Display statistics
console.log("Statistics:");
console.log(`Total transfers parsed: ${Object.values(result.transfersByDirection).flat().length}`);
console.log(`Total lines unparsed: ${result.unparsed.length}`);
console.log(
  `Parse success rate: ${
    Math.round(
      (Object.values(result.transfersByDirection).flat().length /
        (Object.values(result.transfersByDirection).flat().length + result.unparsed.length)) * 100,
    )
  }%`,
);

if (result.unparsed.length > 0) {
  console.log("\nUnparsed lines:");
  result.unparsed.forEach((line) => console.log(`- ${line}`));
}
