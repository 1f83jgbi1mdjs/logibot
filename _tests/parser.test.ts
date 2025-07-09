import { parseTransfers } from "../src/common/generated/parsers.ts";
import { formatTransfers } from "../src/features/transfer/index.ts";

/* cSpell:disable */
// Example input from the requirements
const exampleInput = `
дарксайд шот
алтайский, с б 1 на к. с б 1 на л
байкалский, с к 4 на л
балтийский, с л 2 на к
волжский, с б на л
вятский, с б 2 на к
донской, с б на к
западный, с к 2 на л. с б 1 на л
камчатский, с л 2 на к
крымский, с л 2 нв к
кубанский, с л 2 на к
куржский, с к 3 на л. с б 1 на л
ленский, с к на л
невский, с к и б по 1 на л
обский, с б на л
оходский, с к на л
свободный, с б на л
северный, с к на л и на б по 1
столичный, с б на л
таежный, с б 6 на л
тайский, с к на т 2шт. с б на л 2шт
токийский, с т 1 на б
тосканский, с б 2 на л
тропич, с б 2 на л
уральский, с б 2 на к. с л 1 на к
центральный, с к на л.
чукотский, с б и л по 1 на к

экспириенс батл эпл, с б на к
берри вс, по 2 шт с к и б на л
грейп эн фурриос, по 2 шт с б и к на л
минт слайт, с б 2 на л
турботи, с к 2 на б. с л 1 на б
цитрус вейф, с к 4 на б. с к 2 на л

медпир банан айсдринк, с б на л 1
грейп конг, с б на к
меллонибич, с б на к
ватермелон, с б 2 на т. с л 2 на т

старлайн зеленый фреш, с б 2 на л
кивисмузи, с б 2 на л
клубнич крнф, с к 2 на б
лайм сорбет, с б 1 на к
лимон 2.0, с к на л 2
малина, с б и к по 2 на л
манго, с л на к

хулиган чудо, с б на т
реп роза, с л на к
бегемот, с б на к. с т на л
вера, с т на к
ого, с к на т
лав, с к на б. с л на т
пинк, с б на к

хулиган креп лова лова, с к на т
бу, с б 1 на к
клаб, с к на л
вита, с б на к

Dojo 12к
Грейпфрутовый чай с медом с л на б с в на к
Киви маракуя гуава с к на в
Кислое яблоко с к на б
Клубника киви с к на л
Сочный персик с л на б
Табак с л на б

Охбар 30к
Арбуз клубника с в на л
Кисло-фруктовые конфеты с к на в 
Мексиканское манго с к на б 
Черника мята с б на л с к на в

Картриджи лост мери 10к
Ежевика вишня с л на к
Черника малина лед с в на к
Микс ягод с б на к с т на в 

Лост мери черные 10к
Черника малина апельсин с л на б
Лимон ягоды с в на б
Лимон мята с к на в
Малина гранат с в на б

Лост мери обычные 10к
Ананас лимон арбуз с к на б
Вишневый сад с к на б

Лост мери 5к
Цитрусовый восход с в на б
Виноградное желе с л на б
Ананас яблоко груша с в на б
Ледяной арбуз с в на л
`;

// Shop shorthands mapping
const shopShorthands = "б-Берлин,к-Кулакова,л-Ладожская,т-Терновка";
/* cSpell:enable */

// Test with shop shorthands
console.log("=== Testing with shop shorthands ===");
const parsedResultWithShops = parseTransfers(exampleInput, shopShorthands);
const { data: formattedResultWithShops } = formatTransfers(parsedResultWithShops);
console.log("\nFormatted Output:");
console.log(formattedResultWithShops);

// Log statistics
const totalTransfersWithShops =
  Object.values(parsedResultWithShops.transfersByDirection).flat().length;
const totalUnparsedWithShops = parsedResultWithShops.unparsed.length;

console.log("\nStatistics:");
console.log(`Total transfers parsed: ${totalTransfersWithShops}`);
console.log(`Total lines unparsed: ${totalUnparsedWithShops}`);
console.log(
  `Parse success rate: ${
    Math.round(
      (totalTransfersWithShops /
        (totalTransfersWithShops + totalUnparsedWithShops)) * 100,
    )
  }%`,
);

// Test without shop shorthands
console.log("\n=== Testing without shop shorthands ===");
const parsedResultWithoutShops = parseTransfers(exampleInput);
const { data: formattedResultWithoutShops } = formatTransfers(parsedResultWithoutShops);
console.log("\nFormatted Output:");
console.log(formattedResultWithoutShops);

// Test with full shop names
console.log("\n=== Testing with full shop names ===");
const fullShopNamesInput = `
дарксайд шот ванильный 4, с кулакова на терновку
экспириенс батл эпл, с берлин на кулакова
берри вс, по 2 шт с кулакова и берлин на ладожская
`;

const parsedResultFullNames = parseTransfers(
  fullShopNamesInput,
  shopShorthands,
);

// Log the parsed transfers
console.log("\nParsed Transfers:");
Object.entries(parsedResultFullNames.transfersByDirection).forEach(
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
if (parsedResultFullNames.unparsed.length > 0) {
  console.log("\nUnparsed Lines:");
  parsedResultFullNames.unparsed.forEach((line) => {
    console.log(`  ${line}`);
  });
}

// Log statistics
const totalTransfersFullNames =
  Object.values(parsedResultFullNames.transfersByDirection).flat().length;
const totalUnparsedFullNames = parsedResultFullNames.unparsed.length;

console.log("\nStatistics:");
console.log(`Total transfers parsed: ${totalTransfersFullNames}`);
console.log(`Total lines unparsed: ${totalUnparsedFullNames}`);
console.log(
  `Parse success rate: ${
    Math.round(
      (totalTransfersFullNames /
        (totalTransfersFullNames + totalUnparsedFullNames)) * 100,
    )
  }%`,
);
