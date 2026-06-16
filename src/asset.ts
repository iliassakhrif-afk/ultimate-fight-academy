// Préfixe les chemins d'assets avec le base path (utile pour GitHub Pages project site).
export const asset = (p: string) => import.meta.env.BASE_URL + p.replace(/^\//, "");
