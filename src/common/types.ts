/**
 * Represents a transfer of a product between shop branches
 */
export type Transfer = {
  product: string;
  /**
   * Optional category the product belongs to
   */
  category?: string;
  source: string;
  sourceShop: string;
  rawQuantity: string;
  destination: string;
  destinationShop: string;
  rawText: string;
};

/**
 * Grouped transfers by direction
 */
export type DirectionTransfers = {
  [key: string]: Transfer[];
};

/**
 * Represents a product category
 */
export type Category = {
  name: string;
  products: string[];
};

export type ParsingResult = {
  transfersByDirection: DirectionTransfers;
  unparsed: string[];
  shopBranchMap: Map<string, string>;
  categories: Category[];
};
