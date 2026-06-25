import { createContext, useContext, useState } from "react";

const INITIAL = [
  { id: 1, company: "Alpha Supplies", product: "Office Chairs", price: 3500,  qty: 10, total: 35000,  delivery: "2025-08-10", status: "Pending" },
  { id: 2, company: "Beta Traders",   product: "Laptops",        price: 55000, qty: 5,  total: 275000, delivery: "2025-08-15", status: "Pending" },
  { id: 3, company: "Gamma Goods",    product: "Printers",       price: 12000, qty: 3,  total: 36000,  delivery: "2025-08-20", status: "Pending" },
  { id: 4, company: "Delta Corp",     product: "Desk Lamps",     price: 800,   qty: 20, total: 16000,  delivery: "2025-08-05", status: "Pending" },
  { id: 5, company: "Epsilon Ltd",    product: "Standing Desks", price: 9500,  qty: 8,  total: 76000,  delivery: "2025-09-01", status: "Pending" },
];

const VendorContext = createContext(null);

export function VendorProvider({ children }) {
  const [vendors, setVendors] = useState(INITIAL);
  return (
    <VendorContext.Provider value={{ vendors, setVendors }}>
      {children}
    </VendorContext.Provider>
  );
}

export function useVendors() {
  return useContext(VendorContext);
}
