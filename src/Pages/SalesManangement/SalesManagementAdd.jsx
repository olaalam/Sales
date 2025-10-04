import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from 'react-redux';
import { showLoader, hideLoader } from '@/Store/LoaderSpinner';
import { useNavigate } from "react-router-dom";

export default function SalesManagementAdd() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [leadOptions, setLeadOptions] = useState([]);
  const [salesOptions, setSalesOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [offerOptions, setOfferOptions] = useState([]);

  const [formData, setFormData] = useState({
    lead_id: "",
    sales_id: "",
    item_type: "",
    product_id: "",
    offer_id: "",
    status: "Pending",
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // Fetch options from the same endpoint as the main sales management page
  const fetchOptions = async () => {
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/sales-management/",
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

        // Set options from API response
        setLeadOptions(result.data.data.leadOptions || []);
        setSalesOptions(result.data.data.salesOptions || []);
        setProductOptions(result.data.data.productOptions || []);
        setOfferOptions(result.data.data.offerOptions || []);
      } else {
        console.error("Failed to fetch options:", response.status);
        toast.error("Failed to load options");
      }
    } catch (error) {
      console.error("Error fetching options:", error);
      toast.error("Error loading options");
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleInputChange = (name, value) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: value,
      };

      // Reset product/offer when item_type changes
      if (name === "item_type") {
        if (value === "Product") {
          newData.offer_id = "";
        } else if (value === "Offer") {
          newData.product_id = "";
        }
      }

      return newData;
    });
  };

  const handleSubmit = async () => {
    // Dynamic validation based on item_type
    const baseRequiredFields = ["lead_id", "sales_id", "item_type", "status"];
    let requiredFields = [...baseRequiredFields];

    // Add conditional required field based on item_type
    if (formData.item_type === "Product") {
      requiredFields.push("product_id");
    } else if (formData.item_type === "Offer") {
      requiredFields.push("offer_id");
    }

    const missingField = requiredFields.find((field) => !formData[field]);

    if (missingField) {
      toast.error(`Please fill in the ${missingField.replace('_', ' ')} field`, {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    dispatch(showLoader());

    const payload = {
      lead_id: formData.lead_id,
      sales_id: formData.sales_id,
      item_type: formData.item_type,
      status: formData.status,
    };

    // Conditionally add product_id or offer_id to the payload
    if (formData.item_type === "Product") {
      payload.product_id = formData.product_id;
      payload.offer_id = null;
    } else if (formData.item_type === "Offer") {
      payload.offer_id = formData.offer_id;
      payload.product_id = null;
    }

    console.log("Payload being sent:", payload);

    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/sales-management/",
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
        toast.success("Sale created successfully!", {
          position: "top-right",
          autoClose: 3000,
        });

        // Reset form
        setFormData({
          lead_id: "",
          sales_id: "",
          item_type: "",
          product_id: "",
          offer_id: "",
          status: "Pending",
        });

        navigate("/sales-management");
      } else {
        const errorData = await response.json();
        console.error("Create failed:", errorData);

        toast.error(errorData?.error?.message || "Failed to create sale", {
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
      dispatch(hideLoader());
    }
  };

  // Prepare options for dropdowns
  const leadDropdown = leadOptions.map((lead) => ({
    value: lead._id,
    label: lead.name,
  }));

  const salesDropdown = salesOptions.map((sales) => ({
    value: sales._id,
    label: sales.name,
  }));

  const productDropdown = productOptions.map((product) => ({
    value: product._id,
    label: product.name,
  }));

  const offerDropdown = offerOptions.map((offer) => ({
    value: offer._id,
    label: offer.name,
  }));

  // Define base form fields
  const baseFields = [
    {
      type: "select",
      placeholder: "Select Lead *",
      name: "lead_id",
      required: true,
      options: leadDropdown,
    },
    {
      type: "select",
      placeholder: "Select Sales Person *",
      name: "sales_id",
      required: true,
      options: salesDropdown,
    },
    {
      type: "select",
      placeholder: "Item Type *",
      name: "item_type",
      required: true,
      options: [
        { value: "Product", label: "Product" },
        { value: "Offer", label: "Offer" },
      ],
    },
    {
      type: "select",
      placeholder: "Status *",
      name: "status",
      required: true,
      options: [
        { value: "Pending", label: "Pending" },
        { value: "Approve", label: "Approve" },
        { value: "Reject", label: "Reject" },
      ],
    },
  ];

  // Conditionally add product or offer field based on item_type
  const fields = [
    ...baseFields.slice(0, 3), // Lead, Sales Person, Item Type
    ...(formData.item_type === "Product" ? [{
      type: "select",
      placeholder: "Select Product *",
      name: "product_id",
      required: true,
      options: productDropdown,
    }] : []),
    ...(formData.item_type === "Offer" ? [{
      type: "select",
      placeholder: "Select Offer *",
      name: "offer_id",
      required: true,
      options: offerDropdown,
    }] : []),
    ...baseFields.slice(3), // Status
  ];

  return (
    <div className="w-full !p-6 relative">
      <ToastContainer position="top-right" autoClose={3000} style={{ zIndex: 9999 }} />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Sale
      </h2>

      <div className="w-[90%] mx-auto">
        <Add fields={fields} values={formData} onChange={handleInputChange} />
      </div>

      <div className="!my-6">
        <Button
          onClick={handleSubmit}
          className="bg-bg-primary !mb-10 !ms-3 cursor-pointer hover:bg-teal-600 !px-5 !py-6 text-white w-[30%] rounded-[15px] transition-all duration-200"
        >
          Create Sale
        </Button>
      </div>
    </div>
  );
}