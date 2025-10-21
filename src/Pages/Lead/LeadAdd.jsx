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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [salesOptions, setSalesOptions] = useState([]);
  const [activityOptions, setActivityOptions] = useState([]);
  const [sourceOptions, setSourceOptions] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    type: "",
    sales_id: "",
    activity_id: "",
    status: "intersted",
    source_id: "",
    country: "",
    city: "",
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

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
        const sources = result?.data?.data?.SourceOptions || [];
        const countries = result?.data?.data?.CountryOptions || [];
        const cities = result?.data?.data?.CityOptions || [];

        setSalesOptions(sales);
        setActivityOptions(activities);
        setSourceOptions(sources);
        setCountryOptions(countries);
        setCityOptions(cities);
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
    setFormData((prev) => {
      const newState = {
        ...prev,
        [name]: value,
      };

      // Reset city when country changes
      if (name === "country") {
        newState.city = ""; 
      }

      return newState;
    });
  };

  const handleSubmit = async () => {
    // Validation
    const requiredFields = [
      "name", 
      "phone", 
      "type", 
      "sales_id", 
      "activity_id", 
      "status", 
      "country", 
      "city", 
      "source_id"
    ];
    
    const missingField = requiredFields.find((field) => !formData[field]);

    if (missingField) {
      toast.error(`Please fill in the ${missingField} field`, {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    dispatch(showLoader());

    const payload = {
      name: formData.name,
      phone: formData.phone,
      type: formData.type,
      status: formData.status,
      sales_id: formData.sales_id,
      activity_id: formData.activity_id,
      country: formData.country,
      city: formData.city,
      source_id: formData.source_id,
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
          type: "",
          sales_id: "",
          activity_id: "",
          status: "intersted",
          source_id: "",
          country: "",
          city: "",
        });

        navigate("/lead");
      } else {
        const errorData = await response.json();
        console.error("Create failed:", errorData);

        const errorMessage = errorData?.error?.message?.message || errorData?.error?.message || "Failed to create lead";

        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Error creating lead:", error);
      toast.error("An error occurred while creating lead!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
      dispatch(hideLoader());
    }
  };

  // ✅ تحويل Options إلى dropdown format باستخدام id بدلاً من _id
  const salesDropdown = salesOptions.map((s) => ({
    value: String(s.id),
    label: s.name,
  }));

  const activityDropdown = activityOptions.map((a) => ({
    value: String(a.id),
    label: a.name,
  }));

  const sourceDropdown = sourceOptions.map((s) => ({
    value: String(s.id),
    label: s.name,
  }));

  const countryDropdown = countryOptions.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  // ✅ Filter cities based on selected country using country_id
  const filteredCityOptions = cityOptions.filter(
    (city) => String(city.country_id) === String(formData.country)
  );

  const cityDropdown = filteredCityOptions.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  const fields = [
    { type: "input", placeholder: "Full Name *", name: "name", required: true },
    { type: "input", placeholder: "Phone *", name: "phone", required: true },
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
      placeholder: "Select Country *",
      name: "country",
      required: true,
      options: countryDropdown,
    },
    {
      type: "select",
      placeholder: 
        formData.country 
          ? "Select City *" 
          : "Select Country first *",
      name: "city",
      required: true,
      options: cityDropdown,
      disabled: !formData.country || cityDropdown.length === 0, 
    },
    {
      type: "select",
      placeholder: "Select Source *",
      name: "source_id",
      required: true,
      options: sourceDropdown,
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
          onClick={isSubmitting ? undefined : handleSubmit}
          disabled={isSubmitting}
          className={`!mb-10 !ms-3 !px-5 !py-6 text-white w-[30%] rounded-[15px] transition-all duration-200 ${
            isSubmitting 
              ? "bg-gray-400 cursor-not-allowed opacity-60" 
              : "bg-bg-primary cursor-pointer hover:bg-teal-600"
          }`}
        >
          {isSubmitting ? "Creating..." : "Create Lead"}
        </Button>
      </div>
    </div>
  );
}