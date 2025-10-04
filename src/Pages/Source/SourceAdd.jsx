import { useState } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from 'react-redux';
import { showLoader, hideLoader } from '@/Store/LoaderSpinner';
// import FullPageLoader from "@/components/Loading";
import { useNavigate } from "react-router-dom";

export default function SourceAdd() {
  const dispatch = useDispatch();
//   const isLoading = useSelector((state) => state.loader.isLoading);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    name: "",
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
    // Validation
    if (!formData.name ) {
      toast.error("Please fill in all required fields", { 
        position: "top-right", 
        autoClose: 3000 
      });
      return;
    }


    dispatch(showLoader());

    const payload = {
      name: formData.name.trim(),
      status: formData.status === "active" ? "Active" : "inactive",
    };

    console.log("Payload being sent:", payload);

    try {
      const response = await fetch("https://negotia.wegostation.com/api/admin/sources/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("source created successfully:", result);
        
        toast.success("source created successfully!", { 
          position: "top-right", 
          autoClose: 3000 
        });
        
        // إعادة تعيين النموذج
        setFormData({
          name: "",
          status: "active",
        });
        
        // العودة لصفحة الأهداف
        navigate("/source");
      } else {
        const errorData = await response.json();
        console.error("Create failed:", errorData);
        
        // معالجة رسائل الخطأ المختلفة
        let errorMessage = "Failed to create source";
        
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        toast.error(errorMessage, { 
          position: "top-right", 
          autoClose: 3000 
        });
      }
    } catch (error) {
      console.error("Error creating source:", error);
      toast.error("An error occurred while creating source!", { 
        position: "top-right", 
        autoClose: 3000 
      });
    } finally {
      dispatch(hideLoader());
    }
  };

  // تعريف حقول النموذج للأهداف
  const fields = [
    {
      type: "input",
      placeholder: "source Name *",
      name: "name",
      required: true,
      inputType: "text",
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
      {/* {isLoading && <FullPageLoader />} */}
      
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
        Add source
      </h2>

      <div className="w-[90%] mx-auto">
        <Add fields={fields} values={formData} onChange={handleInputChange} />
      </div>

      <div className="!my-6">
        <Button
          onClick={handleSubmit}
          className="bg-bg-primary !mb-10 !ms-3 cursor-pointer hover:bg-teal-600 !px-5 !py-6 text-white w-[30%] rounded-[15px] transition-all duration-200"
        >
          Create source
        </Button>
      </div>
    </div>
  );
}