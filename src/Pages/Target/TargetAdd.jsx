import { useState } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import { useNavigate } from "react-router-dom";

export default function TargetAdd() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    name: "",
    point: "",
    status: "active",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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
    // التحقق من الحقول المطلوبة
    if (!formData.name || !formData.point) {
      toast.error("Please fill in all required fields", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // التحقق من صحة النقاط
    const points = parseInt(formData.point);
    if (isNaN(points) || points < 0) {
      toast.error("Please enter a valid number for target points", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    dispatch(showLoader());
    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      point: points,
      status: formData.status === "active" ? "Active" : "Inactive",
    };

    console.log("Payload being sent:", payload);

    try {
      const response = await fetch("https://negotia.wegostation.com/api/admin/targets/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Target created successfully:", result);

        toast.success("Target created successfully!", {
          position: "top-right",
          autoClose: 2000,
        });

        // إعادة تعيين الحقول
        setFormData({
          name: "",
          point: "",
          status: "active",
        });

        // العودة بعد نجاح الإضافة
        setTimeout(() => navigate("/target"), 2000);
      } else {
        const errorData = await response.json();
        console.error("Create failed:", errorData);

        let errorMessage = "Failed to create target";

        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors) {
          // Laravel-style validation errors
          errorMessage = Object.values(errorData.errors).flat().join(", ");
        }

        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error creating target:", error);
      toast.error("An error occurred while creating target!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      dispatch(hideLoader());
      setIsSubmitting(false);
    }
  };

  const fields = [
    {
      type: "input",
      placeholder: "Target Name *",
      name: "name",
      required: true,
      inputType: "text",
    },
    {
      type: "input",
      placeholder: "Target Points *",
      name: "point",
      inputType: "number",
      required: true,
      min: 0,
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
      <ToastContainer position="top-right" autoClose={3000} style={{ zIndex: 9999 }} />

      <h2 className="text-bg-primary text-center pb-10 text-xl font-semibold mb-10">
        Add Target
      </h2>

      <div className="w-[90%] mx-auto">
        <Add fields={fields} values={formData} onChange={handleInputChange} />
      </div>

      <div className="my-6 flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`${
            isSubmitting ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
          } bg-bg-primary hover:bg-teal-600 px-5 py-6 text-white w-[30%] rounded-[15px] transition-all duration-200`}
        >
          {isSubmitting ? "Creating..." : "Create Target"}
        </Button>
      </div>
    </div>
  );
}
