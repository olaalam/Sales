import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from 'react-redux';
import { showLoader, hideLoader } from '@/Store/LoaderSpinner';
import FullPageLoader from "@/components/Loading";
import { useNavigate } from "react-router-dom";

export default function OfferAdd() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [products, setproducts] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    discount_type: "",
    discount_amount: "",
    subscription_details: "",
    setup_phase: "",
    product_id: "",
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // Fetch products from API
  const fetchproducts = async () => {
    try {
      const response = await fetch("https://negotia.wegostation.com/api/admin/products/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("products API response:", result);
        
        // Handle different possible response structures
        let productsData = [];
        if (result.data && Array.isArray(result.data)) {
          productsData = result.data;
        } else if (result.data && result.data.data && Array.isArray(result.data.data)) {
          productsData = result.data.data;
        } else if (Array.isArray(result)) {
          productsData = result;
        }
        
        setproducts(productsData);
        console.log("products set:", productsData);
      } else {
        console.error("Failed to fetch products:", response.status);
        setproducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setproducts([]);
    }
  };

  useEffect(() => {
    fetchproducts();
  }, []);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.description || !formData.discount_type || !formData.discount_amount) {
      toast.error("Please fill in all required fields", { position: "top-right", autoClose: 3000 });
      return;
    }

    dispatch(showLoader());

    const payload = {
      name: formData.name,
      description: formData.description,
      start_date: formData.start_date || "",
      end_date: formData.end_date || "",
      discount_type: formData.discount_type,
      discount_amount: Number(formData.discount_amount),
      subscription_details: formData.subscription_details || "",
      setup_phase: formData.setup_phase || "",
      product_id: formData.product_id || null,
    };

    console.log("Payload being sent:", payload);

    try {
      const response = await fetch("https://negotia.wegostation.com/api/admin/offers/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Offer created successfully!", { position: "top-right", autoClose: 3000 });
        setFormData({
          name: "",
          description: "",
          start_date: "",
          end_date: "",
          discount_type: "",
          discount_amount: "",
          subscription_details: "",
          setup_phase: "",
          product_id: "",
        });
        navigate("/offer");
      } else {
        const errorData = await response.json();
        console.error("Create failed:", errorData);
        
        // Extract the error message properly
        const errorMessage =
          errorData?.error?.message ||
          errorData?.message ||
          errorData?.error?.details ||
          "Failed to create offer!";

        toast.error(errorMessage, { position: "top-right", autoClose: 3000 });
      }
    } catch (error) {
      console.error("Error creating offer:", error);
      toast.error(error?.message || "An error occurred while creating offer!", { position: "top-right", autoClose: 3000 });
    } finally {
      dispatch(hideLoader());
    }
  };

  // Prepare product options for dropdown
  const productOptions = products.map(product => ({
    value: product._id || product.id,
    label: `${product.name} (${product.point || product.points || 0} points)`
  }));

  // Define form fields for offers
  const fields = [
    {
      type: "input",
      placeholder: "Offer Name *",
      name: "name",
      required: true,
    },
    {
      type: "input",
      placeholder: "Description *",
      name: "description",
      required: true,
    },
    {
      type: "input",
      placeholder: "Start Date",
      name: "start_date",
      inputType: "date",
    },
    {
      type: "input",
      placeholder: "End Date",
      name: "end_date",
      inputType: "date",
    },
    {
      type: "select",
      placeholder: "Select Discount Type *",
      name: "discount_type",
      required: true,
      options: [
        { value: "percentage", label: "Percentage" },
        { value: "value", label: "Value" },
      ],
    },
    {
      type: "input",
      placeholder: "Discount Amount *",
      name: "discount_amount",
      inputType: "number",
      required: true,
    },
    {
      type: "input",
      placeholder: "Subscription Details",
      name: "subscription_details",
    },
    {
      type: "input",
      placeholder: "Setup Phase",
      name: "setup_phase",
    },
    {
      type: "select",
      placeholder: "Select Product (Optional)",
      name: "product_id",
      options: productOptions,
    },
  ];

  return (
    <div className="w-full !p-6 relative">
      {isLoading && <FullPageLoader />}
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
        Add Offer
      </h2>

      <div className="w-[90%] mx-auto">
        <Add fields={fields} values={formData} onChange={handleInputChange} />
      </div>

      <div className="!my-6">
        <Button
          onClick={handleSubmit}
          className="bg-bg-primary !mb-10 !ms-3 cursor-pointer hover:bg-teal-600 !px-5 !py-6 text-white w-[30%] rounded-[15px] transition-all duration-200"
        >
          Create Offer
        </Button>
      </div>
    </div>
  );
}