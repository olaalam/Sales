"use client";
import { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";

// Helper function to format date for HTML date input
const formatDateForInput = (dateString) => {
  if (!dateString || dateString === "—") return "";

  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return "";

    // Format to YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};
const Payment = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [payments, setpayments] = useState([]);
  const token = localStorage.getItem("token");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchpayments = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/payments/",
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

      const formatted = result.data.data.payments.map((payment) => {
        return {
          id: payment._id,
          lead_id: payment?.lead_id?.name,
          sales_id: payment.sales_id?.name || "—",
          payment_date: payment.payment_date
            ? formatDateForInput(payment.payment_date)
            : "",
          product_id: payment.product_id?.name || "—",
          offer_id: payment.offer_id?.name || "_",
          payment_method_id: payment.payment_method_id?.name || "—",
          amount: payment.amount || 0,
        };
      });

      setpayments(formatted);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments data");
    } finally {
      dispatch(hideLoader());
    }
  };



  useEffect(() => {
    fetchpayments();
  }, []);

  const columns = [
    { key: "lead_id", label: "Lead" },
    { key: "sales_id", label: "Sales" },
    { key: "product_id", label: "Product" },
    { key: "offer_id", label: "Offer" },
    { key: "payment_method_id", label: "Payment Method" },
    { key: "amount", label: " Amount" },
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
        searchKeys={["lead_id", "sales_id", "product_name"]}
        className="table-compact"
      />
    </div>
  );
};

export default Payment;
