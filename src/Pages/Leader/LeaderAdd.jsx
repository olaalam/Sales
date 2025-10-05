import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from 'react-redux';
import { showLoader, hideLoader } from '@/Store/LoaderSpinner';
import FullPageLoader from "@/components/Loading";
import { useNavigate } from "react-router-dom";

export default function LeaderAdd() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  
  // ✅ 1️⃣ State للتحميل
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [targets, setTargets] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    status: "active",
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchTargets = async () => {
    try {
      const response = await fetch("https://negotia.wegostation.com/api/admin/targets/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Targets API response:", result);
        
        let targetsData = [];
        if (result.data && Array.isArray(result.data)) {
          targetsData = result.data;
        } else if (result.data && result.data.data && Array.isArray(result.data.data)) {
          targetsData = result.data.data;
        } else if (Array.isArray(result)) {
          targetsData = result;
        }
        
        setTargets(targetsData);
        console.log("Targets set:", targetsData);
      } else {
        console.error("Failed to fetch targets:", response.status);
        setTargets([]);
      }
    } catch (error) {
      console.error("Error fetching targets:", error);
      setTargets([]);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ 2️⃣ تعديل دالة Submit
  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields", { position: "top-right", autoClose: 3000 });
      return;
    }

    // ⛔ منع الإرسال المتكرر
    if (isSubmitting) return;

    // ✅ تفعيل حالة الإرسال
    setIsSubmitting(true);
    dispatch(showLoader());

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      status: formData.status === "active" ? "Active" : "inactive",
    };

    if (formData.target_id) {
      payload.target_id = formData.target_id;
    }

    console.log("Payload being sent:", payload);

    try {
      const response = await fetch("https://negotia.wegostation.com/api/admin/leaders/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("leader created successfully!", { position: "top-right", autoClose: 3000 });
        setFormData({
          name: "",
          email: "",
          password: "",
          status: "active",
        });
        navigate("/leader");
      } else {
        const errorData = await response.json();
        console.error("Create failed:", errorData);
        
        if (errorData.error.message) {
          toast.error(errorData.error.message, { position: "top-right", autoClose: 3000 });
        } else if (errorData.error) {
          toast.error(errorData.error, { position: "top-right", autoClose: 3000 });
        } else {
          toast.error("Failed to create leader", { position: "top-right", autoClose: 3000 });
        }
      }
    } catch (error) {
      console.error("Error creating leader:", error);
      toast.error("An error occurred while creating leader!", { position: "top-right", autoClose: 3000 });
    } finally {
      // ✅ إيقاف حالة الإرسال في جميع الحالات
      setIsSubmitting(false);
      dispatch(hideLoader());
    }
  };

  const fields = [
    {
      type: "input",
      placeholder: "Full Name *",
      name: "name",
      required: true,
    },
    {
      type: "input",
      placeholder: "Email Address *",
      name: "email",
      inputType: "email",
      required: true,
    },
    {
      type: "input",
      placeholder: "Password *",
      name: "password",
      inputType: "password",
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
        Add leader
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
          {isSubmitting ? "Creating..." : "Create leader"}
        </Button>
      </div>
    </div>
  );
}