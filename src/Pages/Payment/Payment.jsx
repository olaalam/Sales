"use client";
import { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";

// ✅ Helper: Format date into YYYY-MM-DD
const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

const Payment = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [payments, setPayments] = useState([]);
  const token = localStorage.getItem("token");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // ✅ Fetch Payments
  const fetchPayments = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/payments/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      const data = result.data.data.payments;

      // ✅ Format the payments array correctly
      const formatted = data.map((payment) => {
        const sale = payment.sales?.[0]; // First sale from array (if exists)
        return {
          id: payment.id,
          lead: sale?.lead?.name || "—",
          sales_user: sale?.salesUser?.name || "—",
          product: sale?.product?.name || "—",
          offer: sale?.offer?.name || "—",
          payment_method: payment.method?.name || "—",
          amount: payment.amount ?? 0,
          payment_date: formatDateForInput(payment.payment_date),
        };
      });

      setPayments(formatted);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments data");
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // ✅ Table columns
  const columns = [
    { key: "lead", label: "Lead" },
    { key: "sales_user", label: "Sales" },
    { key: "product", label: "Product" },
    { key: "offer", label: "Offer" },
    { key: "payment_method", label: "Payment Method" },
    { key: "amount", label: "Amount" },
    { key: "payment_date", label: "Payment Date" },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <DataTable
        data={payments}
        columns={columns}
        showAddButton={true}
        addRoute="/payment/add"
        showEditButton={false}
        showDeleteButton={false}
        showActions={false}
        showFilter={true}
        searchKeys={["lead", "sales_user", "product", "payment_method"]}
        className="table-compact"
      />
    </div>
  );
};

export default Payment;
