import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from 'react-redux';
import { showLoader, hideLoader } from '@/Store/LoaderSpinner';
import { useNavigate } from "react-router-dom";

export default function PaymentAdd() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ✅ 1️⃣ State للتحميل
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [options, setOptions] = useState({
    leadOptions: [],
    salesOptions: [],
    productOptions: [],
    offerOptions: [],
    paymentMethodOptions: [],
  });

  const [formData, setFormData] = useState({
    lead_id: "",
    sales_id: "",
    product_id: "",
    offer_id: "",
    payment_method_id: "",
    amount: "",
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchAllOptions = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch("https://negotia.wegostation.com/api/admin/payments/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const result = await response.json();
        const data = result?.data?.data || {};

        setOptions({
          leadOptions: data.LeadOptions || [],
          salesOptions: data.SalesOptions || [],
          productOptions: data.ProductOptions || [],
          offerOptions: data.OfferOptions || [],
          paymentMethodOptions: data.PayementMethodOptions || [],
        });
        
      } else {
        console.error("Failed to fetch options:", response.status);
        toast.error("Failed to load form options.", { position: "top-right" });
      }
    } catch (error) {
      console.error("Error fetching options:", error);
      toast.error("Error fetching form options.", { position: "top-right" });
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchAllOptions();
  }, []);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ 2️⃣ تعديل دالة Submit
  const handleSubmit = async () => {
    const requiredFields = ["lead_id", "sales_id", "product_id", "offer_id", "payment_method_id", "amount"];
    const missingField = requiredFields.find((field) => !formData[field]);

    if (missingField) {
      toast.error(`Please select or fill in all required fields.`, { position: "top-right", autoClose: 3000 });
      return;
    }

    // ⛔ منع الإرسال المتكرر
    if (isSubmitting) return;

    // ✅ تفعيل حالة الإرسال
    setIsSubmitting(true);
    dispatch(showLoader());

    const payload = {
      lead_id: formData.lead_id,
      sales_id: formData.sales_id,
      product_id: formData.product_id,
      offer_id: formData.offer_id,
      payment_method_id: formData.payment_method_id,
      amount: Number(formData.amount),
    };

    console.log("Payload being sent:", payload);

    try {
      const response = await fetch("https://negotia.wegostation.com/api/admin/payments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Payment created successfully!", { position: "top-right", autoClose: 3000 });
        setFormData({
          lead_id: "",
          sales_id: "",
          product_id: "",
          offer_id: "",
          payment_method_id: "",
          amount: "",
        });
        navigate("/payment");
      } else {
        const errorData = await response.json();
        console.error("Create failed:", errorData);
        const errorMessage = errorData?.error?.message || "Failed to create payment!";
        toast.error(errorMessage, { position: "top-right", autoClose: 3000 });
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error("An error occurred while creating payment!", { position: "top-right", autoClose: 3000 });
    } finally {
      // ✅ إيقاف حالة الإرسال في جميع الحالات
      setIsSubmitting(false);
      dispatch(hideLoader());
    }
  };

  const leadDropdownOptions = options.leadOptions.map(l => ({ value: l._id, label: l.name }));
  const salesDropdownOptions = options.salesOptions.map(s => ({ value: s._id, label: s.name }));
  const productDropdownOptions = options.productOptions.map(p => ({ value: p._id, label: `${p.name} (${p.points} points)` }));
  const offerDropdownOptions = options.offerOptions.map(o => ({ value: o._id, label: o.name }));
  const paymentMethodDropdownOptions = options.paymentMethodOptions.map(p => ({ value: p._id, label: p.name }));

  const fields = [
    {
      type: "select",
      placeholder: "Select Lead *",
      name: "lead_id",
      required: true,
      options: leadDropdownOptions,
    },
    {
      type: "select",
      placeholder: "Select Sales *",
      name: "sales_id",
      required: true,
      options: salesDropdownOptions,
    },
    {
      type: "select",
      placeholder: "Select Product *",
      name: "product_id",
      required: true,
      options: productDropdownOptions,
    },
    {
      type: "select",
      placeholder: "Select Offer *",
      name: "offer_id",
      required: true,
      options: offerDropdownOptions,
    },
    {
      type: "select",
      placeholder: "Select Payment Method *",
      name: "payment_method_id",
      required: true,
      options: paymentMethodDropdownOptions,
    },
    {
      type: "input",
      placeholder: "Amount *",
      name: "amount",
      inputType: "number",
      required: true,
    },
  ];

  return (
    <div className="w-full !p-6 relative">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ zIndex: 9999 }}
      />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Payment
      </h2>

      <div className="w-[90%] mx-auto">
        <Add fields={fields} values={formData} onChange={handleInputChange} />
      </div>

      <div className="!my-6">
        {/* ✅ 3️⃣ تعديل الـ Button */}
        <Button
          onClick={isSubmitting ? undefined : handleSubmit}
          disabled={isSubmitting}
          className={`!mb-10 !ms-3 !px-5 !py-6 text-white w-[30%] rounded-[15px] transition-all duration-200 ${
            isSubmitting 
              ? "bg-gray-400 cursor-not-allowed opacity-60" 
              : "bg-bg-primary cursor-pointer hover:bg-teal-600"
          }`}
        >
          {isSubmitting ? "Creating..." : "Create Payment"}
        </Button>
      </div>
    </div>
  );
}