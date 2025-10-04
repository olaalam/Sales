import { useState } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import { useNavigate } from "react-router-dom";

export default function PayMethodAdd() {
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    en: {
      name: "",
      description: "",
      status: true,
      logo_url: null,
    },

  });

const handleFieldChange = (lang, name, value) => {
  let finalValue = value;

  if (name === "status") {
    finalValue = Boolean(value); // ← تأكد إنها boolean حقيقية
  }

  if (name === "logo_url" && value instanceof File) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        [lang]: {
          ...prev[lang],
          [name]: reader.result,
        },
      }));
    };
    reader.onerror = (error) => {
      console.error("Error processing logo file:", error);
      toast.error("Failed to process logo file.");
    };
    reader.readAsDataURL(value);
  } else {
    setFormData((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [name]: finalValue,
      },
    }));
  }
};


  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.en.name.trim()) {
      toast.error("Payment method name is required!");
      return;
    }

    if (!formData.en.description.trim()) {
      toast.error("Payment method description is required!");
      return;
    }

    dispatch(showLoader());

const payload = {
  name: formData.en.name,
  description: formData.en.description,
  status: formData.en.status, // ← كده تمام
  logo_url: formData.en.logo_url,
};



    console.log("Submitting payment method with data:", payload);

    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/payment-methods",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        
        if (responseData.success) {
          toast.success("Payment method created successfully!", {
            position: "top-right",
            autoClose: 3000,
          });

          setFormData({
            en: {
              name: "",
              description: "",
              status: "true",
              logo_url: null,
            },

          });

          setTimeout(() => {
            navigate("/payment-method");
          }, 2000);
        } else {
          toast.error(responseData.message || "Failed to create payment method.");
        }
      } else {
        let errorMessage = "Failed to create payment method.";
        try {
          const errorData = await response.json();
          if (errorData?.errors && typeof errorData.errors === "object") {
            errorMessage = Object.values(errorData.errors).flat().join(", ");
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === "string") {
            errorMessage = errorData;
          }
        } catch (jsonError) {
          console.error("Failed to parse error response", jsonError);
        }

        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error creating payment method:", error);
      toast.error("An error occurred while creating the payment method!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      dispatch(hideLoader());
    }
  };

  const fields = [
    { 
      type: "input", 
      placeholder: "Payment Method Name (e.g., cash Vodafone Pay)", 
      name: "name", 
      lang: "en" 
    },
    {
      type: "textarea",
      placeholder: "Payment Method Description",
      name: "description",
      lang: "en",
    },
    {
      type: "switch",
      name: "status",
      placeholder: "Status",
      returnType: "boolean",
      activeLabel: "Active",
      inactiveLabel: "Inactive",
      lang: "en",
    },
    { 
      type: "file", 
      name: "logo_url", 
      lang: "en",
      placeholder: "Payment Method Logo",
      accept: "image/*"
    },
  ];

  return (
    <div className="w-full p-6 relative">
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Payment Method
      </h2>

      <div className="w-[90%] mx-auto">
        <Add
          fields={fields}
          values={{ en: formData.en, ar: formData.ar }}
          onChange={handleFieldChange}
        />
      </div>

      <div className="!my-6">
        <Button
          onClick={handleSubmit}
          className="bg-bg-primary !mb-10 !ms-3 cursor-pointer hover:bg-teal-600 !px-5 !py-6 text-white w-[30%] rounded-[15px] transition-all duration-200"
        >
          Create Payment Method
        </Button>
      </div>
    </div>
  );
}