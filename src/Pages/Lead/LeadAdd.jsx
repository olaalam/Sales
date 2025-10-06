import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from 'react-redux';
import { showLoader, hideLoader } from '@/Store/LoaderSpinner';
import { useNavigate } from "react-router-dom";

export default function LeadAdd() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isLoading = useSelector((state) => state.loader.isLoading);

  const [salesOptions, setSalesOptions] = useState([]);
  const [activityOptions, setActivityOptions] = useState([]);
  // Add a state for source options
  const [sourceOptions, setSourceOptions] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    type: "",
    sales_id: "",
    activity_id: "",
    status: "intersted",
    // Add source_id to the formData state
    source_id: "",
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // Fetch Sales, Activity, and Source options
  const fetchOptions = async () => {
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/leads/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Options API response:", result);

        const sales = result?.data?.data?.SalesOptions || [];
        const activities = result?.data?.data?.ActivityOptions || [];
        const sources = result?.data?.data?.SourceOptions || []; // Assuming your API returns SourceOptions

        setSalesOptions(sales);
        setActivityOptions(activities);
        setSourceOptions(sources); // Set the source options
      } else {
        console.error("Failed to fetch options:", response.status);
      }
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validation (dynamic)
    const requiredFields = ["name", "phone", "address", "type", "sales_id", "activity_id", "status"];
    // Conditionally add source_id to requiredFields if type is "company"
    if (formData.type === "company") {
      requiredFields.push("source_id");
    }
    
    const missingField = requiredFields.find((field) => !formData[field]);

    if (missingField) {
      toast.error(`Please fill in the ${missingField} field`, {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    dispatch(showLoader());

    const payload = {
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      type: formData.type,
      status: formData.status,
      sales_id: formData.sales_id,
      activity_id: formData.activity_id,
      // Conditionally add source_id to the payload
      ...(formData.type === "company" && { source_id: formData.source_id }),
    };

    console.log("Payload being sent:", payload);

    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/leads/",
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
        toast.success("Lead created successfully!", {
          position: "top-right",
          autoClose: 3000,
        });

        setFormData({
          name: "",
          phone: "",
          address: "",
          type: "",
          sales_id: "",
          activity_id: "",
          status: "intersted",
          source_id: "", // Reset source_id
        });

        navigate("/lead");
      } else {
        const errorData = await response.json();
        console.error("Create failed:", errorData);

        toast.error(errorData?.error?.message || "Failed to create lead", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error creating lead:", error);
      toast.error("An error occurred while creating lead!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      dispatch(hideLoader());
    }
  };

  // Prepare options for dropdowns
  const salesDropdown = salesOptions.map((s) => ({
    value: s._id,
    label: s.name,
  }));

  const activityDropdown = activityOptions.map((a) => ({
    value: a._id,
    label: a.name,
  }));

  const sourceDropdown = sourceOptions.map((s) => ({
    value: s._id,
    label: s.name,
  }));

  // Define the base form fields and conditionally add the source field
  const baseFields = [
    { type: "input", placeholder: "Full Name *", name: "name", required: true },
    { type: "input", placeholder: "Phone *", name: "phone", required: true },
    { type: "input", placeholder: "Address *", name: "address", required: true },
    {
      type: "select",
      placeholder: "Type *",
      name: "type",
      required: true,
      options: [
        { value: "company", label: "Company" },
        { value: "sales", label: "Sales" },
      ],
    },
    {
      type: "select",
      placeholder: "Select Sales *",
      name: "sales_id",
      required: true,
      options: salesDropdown,
    },
    {
      type: "select",
      placeholder: "Select Activity *",
      name: "activity_id",
      required: true,
      options: activityDropdown,
    },
    {
      type: "select",
      placeholder: "Status *",
      name: "status",
      required: true,
      options: [
        { value: "intersted", label: "Interested" },
        { value: "negotiation", label: "Negotiation" },
        { value: "demo_request", label: "Demo Request" },
        { value: "demo_done", label: "Demo Done" },
        { value: "reject", label: "Reject" },
        { value: "approve", label: "Approve" },
      ],
    },
  ];

  // Conditionally add the source field using a spread operator
  const fields = [
    ...baseFields,
    ...(formData.type === "company" ? [{
      type: "select",
      placeholder: "Select Source *",
      name: "source_id",
      required: true,
      options: sourceDropdown,
    }] : []),
  ];

  return (
    <div className="w-full !p-6 relative">
      <ToastContainer position="top-right" autoClose={3000} style={{ zIndex: 9999 }} />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Lead
      </h2>

      <div className="w-[90%] mx-auto">
        <Add fields={fields} values={formData} onChange={handleInputChange} />
      </div>

      <div className="!my-6">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-bg-primary !mb-10 !ms-3 cursor-pointer hover:bg-teal-600 !px-5 !py-6 text-white w-[30%] rounded-[15px] transition-all duration-200"
        >
          Create Lead
        </Button>
      </div>
    </div>
  );
}