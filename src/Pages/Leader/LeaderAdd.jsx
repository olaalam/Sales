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

  // Fetch targets from API
  const fetchTargets = async () => {
    try {
      const response = await fetch("https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/targets/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Targets API response:", result);
        
        // Handle different possible response structures
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

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.password ) {
      toast.error("Please fill in all required fields", { position: "top-right", autoClose: 3000 });
      return;
    }

    dispatch(showLoader());

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      status: formData.status === "active" ? "Active" : "inactive",
    };

    // Only add target_id if it's selected
    if (formData.target_id) {
      payload.target_id = formData.target_id;
    }

    console.log("Payload being sent:", payload);

    try {
      const response = await fetch("https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/leaders/", {
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
        //   target_id: "",
          status: "active",
        });
        navigate("/leader");
      } else {
        const errorData = await response.json();
        console.error("Create failed:", errorData);
        
        // Handle specific error messages
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
      dispatch(hideLoader());
    }
  };

  // Prepare target options for dropdown
//   const targetOptions = targets.map(target => ({
//     value: target._id || target.id,
//     label: `${target.name} (${target.point || target.points || 0} points)`
//   }));

  // Define form fields
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
    // {
    //   type: "select",
    //   placeholder: "Select Role *",
    //   name: "role",
    //   required: true,
    //   options: [
    //     { value: "Salesman", label: "Salesman" },
    //     { value: "Sales Leader", label: "Leader" },
    //     { value: "Admin", label: "Admin" },
    //   ],
    // },
    // {
    //   type: "select",
    //   placeholder: "Select Target (Optional)",
    //   name: "target_id",
    //   options: targetOptions,
    // },
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
        <Button
          onClick={handleSubmit}
          className="bg-bg-primary !mb-10 !ms-3 cursor-pointer hover:bg-teal-600 !px-5 !py-6 text-white w-[30%] rounded-[15px] transition-all duration-200"
        >
          Create leader
        </Button>
      </div>
    </div>
  );
}