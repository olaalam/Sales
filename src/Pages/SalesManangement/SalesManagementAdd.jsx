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

  const [isSubmitting, setIsSubmitting] = useState(false);

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

        setLeadOptions(result.data.data.leadOptions || []);
        setSalesOptions(result.data.data.salesOptions || []);
        setProductOptions(result.data.data.productOptions || []);
        setOfferOptions(result.data.data.offerOptions || []);
      } else {
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
    if (value === undefined || value === "undefined") return; // ✅ تجاهل undefined
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "item_type") {
        if (value === "Product") newData.offer_id = "";
        else if (value === "Offer") newData.product_id = "";
      }
      return newData;
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const baseRequiredFields = ["lead_id", "sales_id", "item_type", "status"];
    let requiredFields = [...baseRequiredFields];

    if (formData.item_type === "Product") requiredFields.push("product_id");
    else if (formData.item_type === "Offer") requiredFields.push("offer_id");

    const missingField = requiredFields.find((f) => !formData[f]);
    if (missingField) {
      toast.error(`Please fill in the ${missingField.replace("_", " ")} field`);
      return;
    }

    setIsSubmitting(true);
    dispatch(showLoader());

    const payload = {
      lead_id: formData.lead_id,
      sales_id: formData.sales_id,
      item_type: formData.item_type,
      status: formData.status,
      product_id: formData.item_type === "Product" ? formData.product_id : null,
      offer_id: formData.item_type === "Offer" ? formData.offer_id : null,
    };

    console.log("📤 Payload sent:", payload);

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
        toast.success("Sale created successfully!", { autoClose: 3000 });

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
        toast.error(errorData?.error?.message || "Failed to create sale");
      }
    } catch (error) {
      console.error("Error creating sale:", error);
      toast.error("An error occurred while creating sale!");
    } finally {
      setIsSubmitting(false);
      dispatch(hideLoader());
    }
  };

const leadDropdown = (leadOptions || [])
  .filter((lead) => lead?.id && lead?.name)
  .map((lead) => ({
    value: String(lead.id),
    label: lead.name,
  }));

const salesDropdown = (salesOptions || [])
  .filter((s) => s?.id && s?.name)
  .map((s) => ({
    value: String(s.id),
    label: s.name,
  }));

const productDropdown = (productOptions || [])
  .filter((p) => p?.id && p?.name)
  .map((p) => ({
    value: String(p.id),
    label: p.name,
  }));

const offerDropdown = (offerOptions || [])
  .filter((o) => o?.id && o?.name)
  .map((o) => ({
    value: String(o.id),
    label: o.name,
  }));


  const baseFields = [
    { type: "select", placeholder: "Select Lead *", name: "lead_id", required: true, options: leadDropdown },
    { type: "select", placeholder: "Select Sales Person *", name: "sales_id", required: true, options: salesDropdown },
    { type: "select", placeholder: "Item Type *", name: "item_type", required: true, options: [
      { value: "Product", label: "Product" },
      { value: "Offer", label: "Offer" },
    ]},
    { type: "select", placeholder: "Status *", name: "status", required: true, options: [
      { value: "Pending", label: "Pending" },
      { value: "Approve", label: "Approve" },
      { value: "Reject", label: "Reject" },
    ]},
  ];

  const fields = [
    ...baseFields.slice(0, 3),
    ...(formData.item_type === "Product" ? [{
      type: "select", placeholder: "Select Product *", name: "product_id", required: true, options: productDropdown,
    }] : []),
    ...(formData.item_type === "Offer" ? [{
      type: "select", placeholder: "Select Offer *", name: "offer_id", required: true, options: offerDropdown,
    }] : []),
    ...baseFields.slice(3),
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
          onClick={!isSubmitting ? handleSubmit : undefined}
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
