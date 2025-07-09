import { PRODUCT_UNIT_QUANTITY_DESIGNATION } from "../constants.ts";

/**
 * Formats raw product quantity representation by consistently assigning the quantity designation.
 */
export const toQuantityString = (input: string): string => {
  if (input.length > 0) {
    const preformattedInput = input
      //* Remove "по " prefix
      .replace(/^по\s+/, "")
      .replace(/\s+шт\.?$/, PRODUCT_UNIT_QUANTITY_DESIGNATION)
      //* Remove any trailing dots
      .replace(/\.+$/, "")
      //* Remove any remaining spaces
      .replace(/\s+/, "");

    //* Assigning the quantity designator if it's missing
    return (!preformattedInput.endsWith(PRODUCT_UNIT_QUANTITY_DESIGNATION) &&
        /^\d+$/.test(preformattedInput))
      ? `${preformattedInput} ${PRODUCT_UNIT_QUANTITY_DESIGNATION}`
      : preformattedInput;
  } else return `1 ${PRODUCT_UNIT_QUANTITY_DESIGNATION}`;
};
