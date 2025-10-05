import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from 'react-redux';
import { showLoader, hideLoader } from '@/Store/LoaderSpinner';
import { useNavigate } from "react-router-dom";

export default function SalesAdd() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [targets, setTargets] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ إضافة حالة التحميل

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    status: "active",
    leader_id: "",
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // ✅ Fetch targets
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
        let targetsData = [];

        if (result.data && Array.isArray(result.data)) {
          targetsData = result.data;
        } else if (result.data?.data && Array.isArray(result.data.data)) {
          targetsData = result.data.data;
        } else if (Array.isArray(result)) {
          targetsData = result;
        }

        setTargets(targetsData);
      } else {
        setTargets([]);
      }
    } catch (error) {
      console.error("Error fetching targets:", error);
      setTargets([]);
    }
  };

  // ✅ Fetch leaders
  const fetchLeaders = async () => {
    try {
      const response = await fetch("https://negotia.wegostation.com/api/admin/leaders/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const result = await response.json();
        let leadersData = [];

        if (result.data && Array.isArray(result.data)) {
          leadersData = result.data;
        } else if (result.data?.data && Array.isArray(result.data.data)) {
          leadersData = result.data.data;
        } else if (Array.isArray(result)) {
          leadersData = result;
        }

        setLeaders(leadersData);
      } else {
        setLeaders([]);
      }
    } catch (error) {
      console.error("Error fetching leaders:", error);
      setLeaders([]);
    }
  };

  useEffect(() => {
    fetchTargets();
    fetchLeaders();
  }, []);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ تعديل دالة الـ Submit
  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (isSubmitting) return; // ⛔ منع الضغط المتكرر

    setIsSubmitting(true);
    dispatch(showLoader());

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      status: formData.status === "active" ? "Active" : "inactive",
    };

    if (formData.leader_id) payload.leader_id = formData.leader_id;
    if (formData.target_id) payload.target_id = formData.target_id;

    try {
      const response = await fetch("https://negotia.wegostation.com/api/admin/sales/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Sale created successfully!", {
          position: "top-right",
          autoClose: 3000,
        });

        setFormData({
          name: "",
          email: "",
          password: "",
          status: "active",
          leader_id: "",
        });

        navigate("/sale");
      } else {
        const errorData = await response.json();
        let errorMessage = "Failed to create sale";

        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }

        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error creating sale:", error);
      toast.error("An error occurred while creating sale!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
      dispatch(hideLoader());
    }
  };

  const leaderOptions = leaders.map((leader) => ({
    value: leader._id || leader.id,
    label: leader.name,
  }));

  const fields = [
    { type: "input", placeholder: "Full Name *", name: "name", required: true },
    { type: "input", placeholder: "Email Address *", name: "email", inputType: "email", required: true },
    { type: "input", placeholder: "Password *", name: "password", inputType: "password", required: true },
    {
      type: "select",
      placeholder: "Select Leader *",
      name: "leader_id",
      required: true,
      options: leaderOptions,
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
        Add Sale
      </h2>

      <div className="w-[90%] mx-auto">
        <Add fields={fields} values={formData} onChange={handleInputChange} />
      </div>

      <div className="my-6">
        <Button
          onClick={isSubmitting ? undefined : handleSubmit}
          disabled={isSubmitting}
          className={`!mb-10 !ms-3 !px-5 !py-6 text-white w-[30%] rounded-[15px] transition-all duration-200 ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed opacity-60"
              : "bg-bg-primary cursor-pointer hover:bg-teal-600"
          }`}
        >
          {isSubmitting ? "Creating..." : "Create Sale"}
        </Button>
      </div>
    </div>
  );
}
