import { useState } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import { useNavigate } from "react-router-dom";

export default function CommissionAdd() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ✅ 1️⃣ State للتحميل
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    level_name: "",
    type: "",
    amount: "",
    point_threshold: "",
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
      !formData.level_name ||
      !formData.type ||
      formData.amount === "" ||
      formData.point_threshold === ""
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
      level_name: formData.level_name.trim(),
      type: formData.type.trim(),
      amount: parseFloat(formData.amount) || 0,
      point_threshold: parseFloat(formData.point_threshold) || 0,
    };

    console.log("Payload being sent:", payload);

    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/commissions/",
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
        console.log("commission created successfully:", result);

        toast.success("Commission created successfully!", {
          position: "top-right",
          autoClose: 3000,
        });

        // Reset the form
        setFormData({
          level_name: "",
          type: "",
          amount: "",
          point_threshold: "",
        });

        // Navigate to the commissions page
        navigate("/commission");
      } else {
        const errorData = await response.json();
        console.error("Create failed:", errorData);

        let errorMessage = "Failed to create commission";

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
      console.error("Error creating commission:", error);
      toast.error("An error occurred while creating commission!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      // ✅ إيقاف حالة الإرسال في جميع الحالات
      setIsSubmitting(false);
      dispatch(hideLoader());
    }
  };

  // Define form fields for commissions
  const fields = [
    {
      type: "input",
      placeholder: "Level Name *",
      name: "level_name",
      required: true,
      inputType: "text",
    },
    {
      type: "select",
      placeholder: "Commission Type *",
      name: "type",
      required: true,
      options: [
        { value: "percentage", label: "Percentage" },
        { value: "fixed", label: "Fixed" },
      ],
    },
    {
      type: "input",
      placeholder: "Amount",
      name: "amount",
      inputType: "number",
      min: 0,
      step: "0.01",
      required: true,
    },
    {
      type: "input",
      placeholder: "Point Threshold",
      name: "point_threshold",
      inputType: "number",
      min: 0,
      step: "0.01",
      required: true,
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
        Add Commission
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
          {isSubmitting ? "Creating..." : "Create Commission"}
        </Button>
      </div>
    </div>
  );
}