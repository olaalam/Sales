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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subscription_type: "",
    price: "",
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

  const handleSubmit = async () => {
    // ✅ التحقق من الحقول المطلوبة
    if (
      !formData.name ||
      !formData.description ||
      !formData.subscription_type ||
      formData.price === "" ||
      formData.setup_fees === ""
    ) {
      toast.error("Please fill in all required fields", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    dispatch(showLoader());

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      subscription_type: formData.subscription_type, // ✅ نفس القيم المطلوبة من الـ API
      price: parseFloat(formData.price) || 0,
      setup_fees: parseFloat(formData.setup_fees) || 0,
      status: formData.status === "active",
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

      const result = await response.json();

      if (response.ok) {
        console.log("Product created successfully:", result);
        toast.success("Product created successfully!", {
          position: "top-right",
          autoClose: 3000,
        });

        setFormData({
          name: "",
          description: "",
          subscription_type: "",
          price: "",
          setup_fees: "",
          status: "active",
        });

        navigate("/product");
      } else {
        console.error("Create failed:", result);
        toast.error(result?.error?.message || "Failed to create product", {
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
      setIsSubmitting(false);
      dispatch(hideLoader());
    }
  };

  // ✅ الحقول الجديدة المتوافقة مع API
  const fields = [
    {
      type: "input",
      placeholder: "Product Name *",
      name: "name",
      inputType: "text",
      required: true,
    },
    {
      type: "input",
      placeholder: "Product Description *",
      name: "description",
      inputType: "text",
      required: true,
    },
    {
      type: "select",
      placeholder: "Subscription Type *",
      name: "subscription_type",
      required: true,
      options: [
        { label: "Monthly", value: "Monthly" },
        { label: "Quarterly", value: "Quarterly" },
        { label: "Half year", value: "Half year" },
        { label: "Yearly", value: "Yearly" },
      ],
    },
    {
      type: "input",
      placeholder: "Price *",
      name: "price",
      inputType: "number",
      min: 0,
      step: "0.01",
      required: true,
    },
    {
      type: "input",
      placeholder: "Setup Fees *",
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
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-bg-primary text-center pb-10 text-xl font-semibold mb-10">
        Add Product
      </h2>

      <div className="w-[90%] mx-auto">
        <Add fields={fields} values={formData} onChange={handleInputChange} />
      </div>

      <div className="!my-6">
        <Button
          onClick={isSubmitting ? undefined : handleSubmit}
          disabled={isSubmitting}
          className={`mb-10 ms-3 px-5 py-6 text-white w-[30%] rounded-[15px] transition-all duration-200 ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed opacity-60"
              : "bg-bg-primary cursor-pointer hover:bg-teal-600"
          }`}
        >
          {isSubmitting ? "Creating..." : "Create Product"}
        </Button>
      </div>
    </div>
  );
}
