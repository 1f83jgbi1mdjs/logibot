import type { ParsingResult, Transfer } from "../../../common/types.ts";
import { EMPTY_BRANCH_MAP_ERROR_TEXT } from "../../../common/constants.ts";
import { PRODUCT_FALLBACK_CATEGORY, toQuantityString } from "../../../entities/product/index.ts";

/**
 * Formats the parsed transfers for display
 */
export const formatTransfers = (
  parsedResult: ParsingResult,
): { data: null | string[]; error: null | string } => {
  const {
    transfersByDirection,
    unparsed: unprocessed,
    shopBranchMap,
    categories,
  } = parsedResult;

  if (shopBranchMap.size === 0) {
    return { data: null, error: EMPTY_BRANCH_MAP_ERROR_TEXT };
  } else {
    const byDirection = Object.entries(transfersByDirection)
      .sort(([dirA], [dirB]) => dirA.localeCompare(dirB))
      .map(([direction, transfers]) => {
        // Group transfers by category first, then by product
        const byCategory: Record<string, Record<string, Transfer[]>> = {};

        byCategory[PRODUCT_FALLBACK_CATEGORY] = {};

        // TODO: This part is AI-generated and seems to be a total BS - revisit, inspect, and adjust
        // Group transfers by category and product
        transfers.forEach((transfer) => {
          const category = transfer.category || PRODUCT_FALLBACK_CATEGORY;
          const product = transfer.product;

          if (!byCategory[category]) {
            byCategory[category] = {};
          }

          if (!byCategory[category][product]) {
            byCategory[category][product] = [];
          }

          byCategory[category][product].push(transfer);
        });

        // Format each category group
        const formattedCategories = Object.entries(byCategory)
          .filter(
            //* Skip empty categories
            ([_, productTransfers]) => Object.keys(productTransfers).length > 0,
          )
          .map(([productCategory, productTransfers]) => {
            const formattedProducts = Object.entries(productTransfers)
              .sort(([prodA], [prodB]) => prodA.localeCompare(prodB))
              .map(([productId, productTransfers]) =>
                productTransfers.map(
                  ({ rawQuantity }) =>
                    `\\( ${toQuantityString(rawQuantity)} \\)  ${
                      productId.replaceAll(/[_*\[\]()~`>#+=\-|{}\.!]/g, `\\$&`)
                    }`,
                )
              )
              .join("\n");

            return `📦 *${productCategory.replaceAll(/[_*\[\]()~`>#+=\-|{}\.!]/g, `\\$&`)}*\n\n` +
              formattedProducts;
          })
          .join("\n\n");

        return `\n🚚 *${direction.toUpperCase()}*\n\n${formattedCategories}\n`;
      });

    return {
      data: byDirection,

      error: unprocessed.length > 0
        ? `\n⚠️ *Не удалось проанализировать (требуется обработка вручную):*\n\n${
          unprocessed.map((line) => `• ${line}`).join("\n")
        }`
        : null,
    };
  }
};
