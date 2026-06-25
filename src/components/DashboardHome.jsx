import { useVendors } from "../context/VendorContext";
import "../styles/AdminDashboard.css";

const MONTHLY = [
  { month: "Jan", value: 12 }, { month: "Feb", value: 18 },
  { month: "Mar", value: 9  }, { month: "Apr", value: 24 },
  { month: "May", value: 16 }, { month: "Jun", value: 30 },
  { month: "Jul", value: 22 }, { month: "Aug", value: 14 },
  { month: "Sep", value: 27 }, { month: "Oct", value: 19 },
  { month: "Nov", value: 33 }, { month: "Dec", value: 28 },
];

const MAX = Math.max(...MONTHLY.map((m) => m.value));

function DashboardHome() {
  const { vendors } = useVendors();

  const totalVendors    = vendors.length;
  const totalQuotations = vendors.length;
  const totalPurchases  = vendors.filter((v) => v.status.startsWith("Accepted")).length;

  const STATS = [
    { label: "Total Vendors Registered",   value: totalVendors    },
    { label: "Total Quotations Submitted",  value: totalQuotations },
    { label: "Total Purchases",             value: totalPurchases  },
  ];

  return (
    <div className="dh-wrap">
      <div className="dh-cards">
        {STATS.map(({ label, value }) => (
          <div className="dh-card" key={label}>
            <p className="dh-card-value">{value}</p>
            <p className="dh-card-label">{label}</p>
          </div>
        ))}
      </div>

      <div className="dh-chart-box">
        <h3 className="dh-section-title">Monthly Purchase Summary</h3>
        <div className="dh-chart">
          {MONTHLY.map(({ month, value }) => (
            <div className="dh-bar-group" key={month}>
              <div className="dh-bar-wrap">
                <span className="dh-bar-val">{value}</span>
                <div className="dh-bar" style={{ height: `${(value / MAX) * 180}px` }} />
              </div>
              <span className="dh-bar-month">{month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
