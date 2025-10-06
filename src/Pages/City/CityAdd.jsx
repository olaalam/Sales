import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { useNavigate } from "react-router-dom";

export default function CityAdd() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [countries, setCountries] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    countryId: "",
  });
  
  // ✨ حالة جديدة لتتبع عملية الإضافة
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // ✅ Fetch Countries
  const fetchCountries = async () => {
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/locations/countries",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      const result = await response.json();

      if (result.success && result.data?.data) {
        setCountries(result.data.data);
      } else {
        setCountries([]);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
      toast.error("Failed to load countries");
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  // ✅ Handle Input
  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ Handle Submit
  const handleSubmit = async () => {
    if (!formData.name || !formData.countryId) {
      toast.error("Please fill in all required fields", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // ⛔ منع الإرسال إذا كانت هناك عملية جارية بالفعل
    if (isSubmitting) return;

    // ✅ تفعيل حالة الإرسال
    setIsSubmitting(true);
    dispatch(showLoader());

    const payload = {
      name: formData.name,
      countryId: formData.countryId,
    };

    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/locations/cities",
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

      if (response.ok && result.success) {
        toast.success("City created successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        setFormData({
          name: "",
          countryId: "",
        });
        navigate("/city");
      } else {
        toast.error(result?.message || "Failed to create city", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error creating city:", error);
      toast.error("An error occurred while creating city!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      // ✅ إيقاف حالة الإرسال في جميع الحالات
      setIsSubmitting(false);
      dispatch(hideLoader());
    }
  };

  // ✅ Dropdown options
  const countryOptions = countries.map((country) => ({
    value: country._id,
    label: country.name,
  }));

  // ✅ Fields Config
  const fields = [
    { type: "input", placeholder: "City Name *", name: "name", required: true },
    {
      type: "select",
      placeholder: "Select Country *",
      name: "countryId",
      required: true,
      options: countryOptions,
    },
  ];

  return (
    <div className="w-full !p-6 relative">
      <ToastContainer position="top-right" autoClose={3000} style={{ zIndex: 9999 }} />
      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add City
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
          {isSubmitting ? "Creating..." : "Create City"}
        </Button>
      </div>
    </div>
  );
}