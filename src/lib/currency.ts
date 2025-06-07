export type Currency = "USD" | "EUR" | "FCFA";

export const formatPrice = (price: number, currency: Currency = "FCFA"): string => {
  switch (currency) {
    case "USD":
      return `$${price.toFixed(2)}`;
    case "EUR":
      return `${price.toFixed(2).replace('.', ',')} €`;
    case "FCFA":
      return `${Math.round(price)} FCFA`;
    default:
      return `${price} FCFA`;
  }
};

export const getCurrencySymbol = (currency: Currency): string => {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "FCFA":
      return "FCFA";
    default:
      return "FCFA";
  }
}; 