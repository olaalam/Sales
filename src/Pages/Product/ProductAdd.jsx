import { useState } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import { useNavigate } from "react-router-dom";

export default function ProductAdd() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ✅ 1️⃣ State للتحميل
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_month: "",
    price_quarter: "",
    price_year: "",
    setup_fees: "",
    status: "active",
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ 2️⃣ تعديل دالة Submit
  const handleSubmit = async () => {
    // Validation
    if (
      !formData.name ||
      !formData.description ||
      formData.price_month === "" ||
      formData.price_quarter === "" ||
      formData.price_year === "" ||
      formData.setup_fees === ""
    ) {
      toast.error("Please fill in all required fields", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // ⛔ منع الإرسال المتكرر
    if (isSubmitting) return;

    // ✅ تفعيل حالة الإرسال
    setIsSubmitting(true);
    dispatch(showLoader());

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price_month: parseFloat(formData.price_month) || 0,
      price_quarter: parseFloat(formData.price_quarter) || 0,
      price_year: parseFloat(formData.price_year) || 0,
      setup_fees: parseFloat(formData.setup_fees) || 0,
      status: formData.status === "active" ? true : false,
    };

    console.log("Payload being sent:", payload);

    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/products/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("product created successfully:", result);

        toast.success("product created successfully!", {
          position: "top-right",
          autoClose: 3000,
        });

        setFormData({
          name: "",
          description: "",
          price_month: "",
          price_quarter: "",
          price_year: "",
          setup_fees: "",
          status: "active",
        });

        navigate("/product");
      } else {
        const errorData = await response.json();
        console.error("Create failed:", errorData);

        let errorMessage = "Failed to create product";

        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }

        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("An error occurred while creating product!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      // ✅ إيقاف حالة الإرسال في جميع الحالات
      setIsSubmitting(false);
      dispatch(hideLoader());
    }
  };

  const fields = [
    {
      type: "input",
      placeholder: "product Name *",
      name: "name",
      required: true,
      inputType: "text",
    },
    {
      type: "input",
      placeholder: "product Description *",
      name: "description",
      inputType: "text",
      required: true,
      min: 0,
    },
    {
      type: "input",
      placeholder: "Price month",
      name: "price_month",
      inputType: "number",
      min: 0,
      step: "0.01",
      required: true,
    },
    {
      type: "input",
      placeholder: "Price quarter",
      name: "price_quarter",
      inputType: "number",
      min: 0,
      step: "0.01",
      required: true,
    },
    {
      type: "input",
      placeholder: "Price Yearly",
      name: "price_year",
      inputType: "number",
      min: 0,
      step: "0.01",
      required: true,
    },
    {
      type: "input",
      placeholder: "Setup Fees",
      name: "setup_fees",
      inputType: "number",
      min: 0,
      step: "0.01",
      required: true,
    },
    {
      type: "switch",
      name: "status",
      placeholder: "Status",
      returnType: "binary",
      activeLabel: "Active",
      inactiveLabel: "Inactive",
    },
  ];

  return (
    <div className="w-full p-6 relative">
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
        Add product
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
          {isSubmitting ? "Creating..." : "Create product"}
        </Button>
      </div>
    </div>
  );
}