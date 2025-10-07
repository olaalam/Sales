"use client";
import { useState, useEffect } from "react";
import "react-toastify/dist/ReactToastify.css";
import FullPageLoader from "@/components/Loading";
import {
  FaUsers,
  FaMoneyBillWave,
  FaTools,
  FaWrench,
  FaHome,
  FaBuilding,
  FaUserCheck,
  FaChartBar,
} from "react-icons/fa";

const Home = () => {
  const [homeStats, setHomeStats] = useState({
    users: 0,
    salesmen: 0,
    leads: 0,
    sales: 0,
    payments: 0,
    revenue: 0,
    products: 0,
    offers: 0,
    activities: 0,
    popupOffers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeStats = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authorization token not found. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "https://negotia.wegostation.com/api/admin/home",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();

        // ✅ المسار الصحيح للبيانات: responseData.meta.totals
        const totals = responseData?.meta?.totals;

        if (totals && typeof totals === "object") {
          setHomeStats({
            users: totals.users || 0,
            salesmen: totals.salesmen || 0,
            leads: totals.leads || 0,
            sales: totals.sales || 0,
            payments: totals.payments || 0,
            revenue: totals.revenue || 0,
            products: totals.products || 0,
            offers: totals.offers || 0,
            activities: totals.activities || 0,
            popupOffers: totals.popupOffers || 0,
          });
        } else {
          console.warn("Unexpected API structure:", responseData);
          setError("Unexpected data format from server.");
        }
      } catch (err) {
        console.error("Failed to fetch home stats:", err);
        setError(err.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchHomeStats();
  }, []);

  if (loading) return <FullPageLoader />;

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 font-bold">
        Error: {error}
        <p>Please try again later or check your network connection.</p>
      </div>
    );
  }

  return (
    <div className="!p-4 flex gap-3 md:flex-row flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 !mb-8 ">
        <StatCard icon={<FaUsers />} color="#0E7490" label="Total Users" value={homeStats.users} />
        <StatCard icon={<FaUserCheck />} color="#0E7490" label="Salesmen" value={homeStats.salesmen} />
        <StatCard icon={<FaTools />} color="#0E7490" label="Sales" value={homeStats.sales} />
        <StatCard icon={<FaMoneyBillWave />} color="#0E7490" label="Payments" value={homeStats.payments} />
        <StatCard icon={<FaChartBar />} color="#0E7490" label="Revenue" value={homeStats.revenue.toLocaleString()} />
        <StatCard icon={<FaHome />} color="#0E7490" label="Leads" value={homeStats.leads} />
        <StatCard icon={<FaWrench />} color="#0E7490" label="Offers" value={homeStats.offers} />
        <StatCard icon={<FaBuilding />} color="#0E7490" label="Products" value={homeStats.products} />
        <StatCard icon={<FaChartBar />} color="#0E7490" label="Activities" value={homeStats.activities} />
        <StatCard icon={<FaChartBar />} color="#0E7490" label="Popup Offers" value={homeStats.popupOffers} />
      </div>
    </div>
  );
};

// 🔹 مكون لعرض الكارت الموحد
const StatCard = ({ icon, color, label, value }) => {
  return (
    <div className="bg-[#F2FAFA] !p-2 rounded-2xl shadow flex items-start border-r-4 border-bg-primary">
      <div className="!p-4 flex items-center justify-center">
        <div className="text-6xl" style={{ color }}>
          {icon}
        </div>
      </div>
      <div className="!p-2">
        <div className="text-3xl font-bold">{value}</div>
        <div>{label}</div>
      </div>
    </div>
  );
};

export default Home;
