import type { Category, DirectionTransfers, ParsingResult, Transfer } from "../types.ts";

/**
 * Parses the shop branch shorthands string into a map of shop branches
 */
const parseShopShorthands = (shorthands: string): Map<string, string> => {
  const shopBranchMap = new Map<string, string>();

  if (!shorthands) {
    return shopBranchMap;
  }

  const shopEntries = shorthands.split(",");

  shopEntries.forEach((entry) => {
    const [shorthand, fullName] = entry.split("-");
    if (shorthand && fullName) {
      shopBranchMap.set(shorthand.toLowerCase(), fullName);
    }
  });

  return shopBranchMap;
};

/**
 * Parses a single transfer segment from text
 */
const parseTransferSegment = (
  product: string,
  segment: string,
  shopBranchMap: Map<string, string>,
): Transfer[] => {
  // Match pattern: "с [source] [quantity?] на [destination] [quantity?]"
  // Using a pattern that ensures "с" is a standalone preposition (space before and after)
  // This prevents matching "с" that's part of a word like "Микс"
  const regex = /(?:^|\s)с\s+([^\s]+)([^н]*?)на\s+([^\s]+)([^с]*?)$/i;
  const match = segment.match(regex);

  if (!match) {
    return [];
  }

  const [, sourceRaw, quantityBeforeDest, destinationRaw, quantityAfterDest] = match;

  // Process the quantity information
  let rawQuantity = "";

  // First check if there's quantity after the destination (e.g., "на т 2шт")
  if (quantityAfterDest && quantityAfterDest.trim()) {
    rawQuantity = quantityAfterDest.trim();
  } // Otherwise use quantity before destination if present (e.g., "с б 2 на л")
  else if (quantityBeforeDest && quantityBeforeDest.trim()) {
    rawQuantity = quantityBeforeDest.trim();
  }

  // Try to match the full shop branch name first, then fall back to the first letter
  let destination = destinationRaw.toLowerCase();
  let destinationShop = "";
  let foundFullDestMatch = false;

  // Try to match full destination name
  for (const [shorthand, fullName] of shopBranchMap.entries()) {
    if (fullName.toLowerCase() === destination) {
      destinationShop = fullName;
      destination = shorthand;
      foundFullDestMatch = true;
      break;
    }
  }

  // If no full match was found for destination, use the first letter approach
  if (!foundFullDestMatch) {
    destination = destinationRaw.charAt(0).toLowerCase();
    destinationShop = shopBranchMap.get(destination) || destination;
  }

  // Handle the source - check if it's a merged source (multiple characters without spaces)
  const sourceRawLower = sourceRaw.toLowerCase();
  let foundFullSourceMatch = false;
  let sourceShop = "";
  let source = "";

  // First try to match the full source name
  for (const [shorthand, fullName] of shopBranchMap.entries()) {
    if (fullName.toLowerCase() === sourceRawLower) {
      sourceShop = fullName;
      source = shorthand;
      foundFullSourceMatch = true;
      break;
    }
  }

  // If no full match was found, check if it's a merged source (multiple characters)
  if (!foundFullSourceMatch) {
    // If source is multiple characters without spaces (like "бк" instead of "б и к")
    if (sourceRawLower.length > 1 && !sourceRawLower.includes(" ")) {
      // Create a transfer for each character in the source
      const transfers: Transfer[] = [];

      for (let i = 0; i < sourceRawLower.length; i++) {
        const singleSource = sourceRawLower.charAt(i);
        const singleSourceShop = shopBranchMap.get(singleSource) ||
          singleSource;

        transfers.push({
          product: product.trim(),
          source: singleSource,
          sourceShop: singleSourceShop,
          rawQuantity,
          destination,
          destinationShop,
          rawText: segment.trim(),
        });
      }

      return transfers;
    } else {
      // Default to first letter approach for single character sources
      source = sourceRawLower.charAt(0);
      sourceShop = shopBranchMap.get(source) || source;
    }
  }

  return [{
    product: product.trim(),
    source,
    sourceShop,
    rawQuantity,
    destination,
    destinationShop,
    rawText: segment.trim(),
  }];
};

/**
 * Expands segments with multiple sources or destinations
 */
const expandTransferSegments = (segments: string[]): string[] => {
  const expandedSegments: string[] = [];

  for (const segment of segments) {
    // Check if the segment contains " и " followed by a shop branch name
    if (segment.includes(" и ")) {
      // Try to identify if it's multiple sources or multiple destinations
      if (
        segment.match(/(?:^|\s)с\s+[^\s]+.*?\s+и\s+[^\s]+\s+(?:по\s+\d+\s+)?на\s+/i)
      ) {
        // Multiple sources pattern: "с [source1] и [source2] на [destination]"
        const sourcesMatch = segment.match(/(?:^|\s)с\s+(.*?)\s+на\s+([^\s.,]+)/i);

        if (sourcesMatch) {
          const [, sourcesText, destinationRaw] = sourcesMatch;
          const sources = sourcesText.split(/\s+и\s+/);

          // Create a separate segment for each source
          for (const source of sources) {
            // Handle "по X" quantity pattern
            const quantityMatch = source.match(/(.*?)(?:\s+по\s+(\d+))?$/);
            if (quantityMatch) {
              const [, sourceRaw, quantity] = quantityMatch;
              const quantityText = quantity ? ` ${quantity}` : "";
              expandedSegments.push(
                `с ${sourceRaw}${quantityText} на ${destinationRaw}`,
              );
            }
          }
          continue;
        }
      } else if (segment.match(/(?:^|\s)с\s+[^\s]+.*?\s+на\s+[^\s]+\s+и\s+/i)) {
        // Multiple destinations pattern: "с [source] на [dest1] и на [dest2]"
        const sourceMatch = segment.match(/(?:^|\s)с\s+([^\s]+)(.*?)\s+на\s+/i);

        if (sourceMatch) {
          const [, sourceRaw, quantityPart] = sourceMatch;
          const destinationsPart = segment.substring(
            segment.indexOf(" на ") + 4,
          );
          const destinations = destinationsPart.split(/\s+и\s+(?:на\s+)?/);

          // Create a separate segment for each destination
          for (const destination of destinations) {
            // Handle "по X" quantity pattern
            const quantityMatch = destination.match(/(.*?)(?:\s+по\s+(\d+))?$/);
            if (quantityMatch) {
              const [, destRaw, quantity] = quantityMatch;
              const quantityText = quantity ? ` ${quantity}` : "";
              expandedSegments.push(
                `с ${sourceRaw}${quantityPart}${quantityText} на ${destRaw}`,
              );
            }
          }
          continue;
        }
      }
    }

    // If no special handling was applied, keep the original segment
    expandedSegments.push(segment);
  }

  return expandedSegments;
};

/**
 * Parses multiple transfers from a single line
 */
const parseLineTransfers = (
  line: string,
  shopBranchMap: Map<string, string>,
): Transfer[] => {
  // Find all transfer patterns by looking for "на [shop]"
  const transferMatches = [];
  const regex = /на\s+([^\s.,]+)/gi;
  let match;

  while ((match = regex.exec(line)) !== null) {
    const [fullMatch, destination] = match;
    const destinationIndex = match.index;

    // Verify destination is a valid shop branch
    if (isValidShopBranch(destination, shopBranchMap)) {
      // Look backwards for a potential source shop
      const beforeDestination = line.substring(0, destinationIndex).trim();
      let source = "";
      let sourceIndex = -1;

      // Check if there's a "с [shop]" pattern before this "на [shop]"
      // Look for a "с" with spaces before and after to ensure it's a preposition
      const sourceMatch = beforeDestination.match(/(?:^|\s)с\s+([^\s.,]+)[^с]*$/i);

      if (sourceMatch && isValidShopBranch(sourceMatch[1], shopBranchMap)) {
        source = sourceMatch[1];
        sourceIndex = beforeDestination.lastIndexOf(sourceMatch[0]);
      } else {
        // If no "с [shop]" pattern, look for any valid shop name right before "на"
        const words = beforeDestination.split(/\s+/);
        for (let i = words.length - 1; i >= 0; i--) {
          if (isValidShopBranch(words[i], shopBranchMap)) {
            source = words[i];
            // Find the position of this word in the original string
            const tempIndex = beforeDestination.lastIndexOf(words[i]);
            if (tempIndex >= 0) {
              sourceIndex = tempIndex;
              break;
            }
          }
        }
      }

      // Only add if we found a valid source
      if (source && sourceIndex >= 0) {
        transferMatches.push({
          match: fullMatch,
          index: sourceIndex,
          source,
          destination,
          destinationIndex,
        });
      }
    }
  }

  // If no valid transfer patterns found, don't parse this line
  if (transferMatches.length === 0) {
    return [];
  }

  // Sort transfer matches by source index (earliest first)
  transferMatches.sort((a, b) => a.index - b.index);
  const firstTransfer = transferMatches[0];

  // Determine the product name
  let productEndIndex = firstTransfer.index;
  const beforeTransfer = line.substring(0, firstTransfer.index).trim();

  // If there's a "с" before the source, exclude it from the product name
  // Ensure there's a space before "с" to avoid matching it in product names like "Микс"
  const sourceWithPreposition = beforeTransfer.match(/(?:^|\s)с\s+[^\s.,]+\s*$/i);
  if (sourceWithPreposition) {
    productEndIndex = beforeTransfer.lastIndexOf(sourceWithPreposition[0]);
  }

  // Extract the product name, handling the case with a comma
  let product = line.substring(0, productEndIndex).trim();

  // Remove trailing comma if present
  if (product.endsWith(",")) {
    product = product.substring(0, product.length - 1).trim();
  }

  // Handle case where product name ends with "c" (Cyrillic "с") that is a preposition
  // It's a preposition only if there's a space before and after it
  const cyrillicCMatch = product.match(/(.+)\s+с\s*$/i);
  if (cyrillicCMatch) {
    product = cyrillicCMatch[1].trim();
  }

  // Ensure product name is not empty
  if (!product) {
    return [];
  }

  // Check for "по X шт" pattern in the product part
  let perDestinationQuantity: string | undefined;
  let productWithoutQuantity = product;
  const quantityMatch = product.match(/\s+по\s+(\d+)\s+шт$/i);

  if (quantityMatch) {
    perDestinationQuantity = quantityMatch[1];
    productWithoutQuantity = product.substring(0, product.length - quantityMatch[0].length)
      .trim();
  }

  // Reconstruct transfer segments from the matches
  const segments: string[] = [];

  for (const { source, destination } of transferMatches) {
    // Check if there's quantity information between source and destination
    const sourceIndex = line.indexOf(source, firstTransfer.index - 10); // Look near the first transfer
    const destinationIndex = line.indexOf(destination, sourceIndex);
    const betweenText = line.substring(sourceIndex + source.length, destinationIndex).trim();

    // Extract quantity if present
    let quantity = "";
    const quantityMatch = betweenText.match(/\b\d+(?:\s+шт)?/i);
    if (quantityMatch) {
      quantity = quantityMatch[0];
    }

    // Construct a segment in the format expected by parseTransferSegment
    const segment = `с ${source}${quantity ? ` ${quantity}` : ""} на ${destination}`;
    segments.push(segment);
  }

  // Handle complex segments with "и" conjunction for multiple sources or destinations
  const expandedSegments = expandTransferSegments(segments);

  // Parse each segment
  const transfers = expandedSegments
    .map((segment) => parseTransferSegment(productWithoutQuantity, segment, shopBranchMap))
    .flat();

  // If we have a per-destination quantity, add it to each transfer
  if (perDestinationQuantity) {
    transfers.forEach((transfer) => {
      // Only add the quantity if it's not already set
      if (!transfer.rawQuantity) {
        transfer.rawQuantity = `${perDestinationQuantity} шт`;
      }
    });
  }

  return transfers;
};

/**
 * Determines if a word is a valid shop branch
 */
const isValidShopBranch = (
  word: string,
  shopBranchMap: Map<string, string>,
): boolean => {
  const firstChar = word.charAt(0).toLowerCase();
  // Check if the first character is a valid shorthand
  if (shopBranchMap.has(firstChar)) {
    return true;
  }

  // Check if the word matches a full shop name
  return Array.from(shopBranchMap.values()).some(
    (shop) => shop.toLowerCase() === word.toLowerCase(),
  );
};

/**
 * Groups transfers by direction
 */
const groupTransfersByDirection = (
  transfers: Transfer[],
): DirectionTransfers => {
  return transfers.reduce((registryAccumulator, transfer) => {
    const direction = `${transfer.sourceShop} ➡️ ${transfer.destinationShop}`;

    return {
      ...registryAccumulator,
      [direction]: [...(registryAccumulator[direction] || []), transfer],
    };
  }, {} as DirectionTransfers);
};

/**
 * Identifies groups and category headers in the input
 * Groups are separated by blank lines
 * A group can have a title if its first line meets certain criteria
 */
const identifyCategories = (input: string): Map<number, string> => {
  const categoryMap = new Map<number, string>();

  // Split the input by blank lines to identify groups
  const groups = input.split(/\n\s*\n/).filter(Boolean);

  // Process each group
  let lineIndex = 0;

  for (const group of groups) {
    const groupLines = group.split("\n").map((line) => line.trim()).filter(
      Boolean,
    );

    if (groupLines.length > 0) {
      const firstLine = groupLines[0];

      // Check if the first line of the group is a category header
      // It should not contain transfer markers and be relatively short
      if (
        // We need to check for the preposition "с" with a space on both sides
        // to avoid matching "с" that's part of a product name
        !firstLine.match(/(?:^|\s)с\s+/) &&
        !firstLine.includes("на ") &&
        firstLine.length < 30 &&
        groupLines.length > 1 &&
        (groupLines[1].match(/(?:^|\s)с\s+/) || groupLines[1].includes("на "))
      ) {
        categoryMap.set(lineIndex, firstLine);
      }

      // Move the line index forward by the number of lines in this group
      lineIndex += groupLines.length;
    }
  }

  return categoryMap;
};

/**
 * Main function to parse transfers from input text
 */
export const parseTransfers = (
  input: string,
  shopShorthands?: string,
): ParsingResult => {
  // Parse shop branch shorthands
  const shopBranchMap = parseShopShorthands(shopShorthands || "");

  // If no shop branch shorthands are provided, return early
  if (shopBranchMap.size === 0) {
    return {
      transfersByDirection: {},
      unparsed: [],
      shopBranchMap,
      categories: [],
    };
  }

  // Split input into groups by blank lines
  const groups = input.split(/\n\s*\n/).filter(Boolean);

  // Identify potential category headers
  const categoryMap = identifyCategories(input);

  // Track categories and their products
  const categories: Category[] = [];
  const categoryProducts: Record<string, string[]> = {};

  // Process each group separately
  let lineIndex = 0;
  const parseResults: Array<{
    line: string;
    transfers: Transfer[];
    parsed: boolean;
    isCategory: boolean;
  }> = [];

  for (const group of groups) {
    // Process each group with its own category context
    let groupCategory: string | undefined;

    const groupLines = group.split("\n").map((line) => line.trim()).filter(
      Boolean,
    );

    for (let i = 0; i < groupLines.length; i++) {
      const line = groupLines[i];
      const currentIndex = lineIndex + i;

      // Check if this line is a category header
      if (categoryMap.has(currentIndex)) {
        groupCategory = categoryMap.get(currentIndex);
        categoryProducts[groupCategory!] = [];
        parseResults.push({
          line,
          transfers: [],
          parsed: false,
          isCategory: true,
        });
        continue;
      }

      const transfers = parseLineTransfers(line, shopBranchMap);

      // If transfers were found and we have a category for this group, associate them
      if (transfers.length > 0 && groupCategory) {
        transfers.forEach((transfer) => {
          transfer.category = groupCategory;
          categoryProducts[groupCategory!].push(transfer.product);
        });
      }

      parseResults.push({
        line,
        transfers,
        parsed: transfers.length > 0,
        isCategory: false,
      });
    }

    // Move to the next group
    lineIndex += groupLines.length;
  }

  // Create category objects
  Object.entries(categoryProducts).forEach(([name, products]) => {
    categories.push({ name, products: [...new Set(products)] });
  });

  // Collect all successfully parsed transfers
  const allTransfers = parseResults
    .filter((result) => result.parsed)
    .flatMap((result) => result.transfers);

  // Collect all lines that couldn't be parsed (excluding category headers)
  const unparsedLines = parseResults
    .filter((result) => !result.parsed && !result.isCategory)
    .map((result) => result.line);

  // Group transfers by direction
  const transfersByDirection = groupTransfersByDirection(allTransfers);

  return {
    transfersByDirection,
    unparsed: unparsedLines,
    shopBranchMap,
    categories,
  };
};
