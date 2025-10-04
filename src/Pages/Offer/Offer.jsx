"use client";
import { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditDialog from "@/components/EditDialog";
import DeleteDialog from "@/components/DeleteDialog";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function to format date for HTML date input
const formatDateForInput = (dateString) => {
  if (!dateString || dateString === "—") return "";
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return "";
    
    // Format to YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return "";
  }
};

const Offer = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [offers, setoffers] = useState([]);
  const [products, setproducts] = useState([]); // For product dropdown
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // ✨ الخطوة 1: إضافة حالات التحميل المنفصلة
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(null); // يستخدم id الصف الذي يتم تبديل حالته

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchoffers = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/offers/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      const formatted = result.data.data.map((offer) => {
        const status = offer.status || 'Active'; 
        
        return {
          id: offer._id,
          name: offer.name,
          description: offer.description || "—",
          start_date: offer.start_date ? formatDateForInput(offer.start_date) : "—",
          end_date: offer.end_date ? formatDateForInput(offer.end_date) : "—",
          discount_type: offer.discount_type || "—",
          discount_amount: offer.discount_amount || 0,
          subscription_details: offer.subscription_details || "—",
          product_name: offer.product_id?.name || "—",
          setup_phase: offer.setup_phase || "—",
          product_id: offer.product_id?._id || null,
          status: status, // إضافة Status
        };
      });

      setoffers(formatted);
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast.error("Failed to load offers data");
    } finally {
      dispatch(hideLoader());
    }
  };

  // Fetch products for dropdown
  const fetchproducts = async () => {
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/products/",
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
        
        let productsData = [];
        if (result.data && Array.isArray(result.data)) {
          productsData = result.data;
        } else if (
          result.data &&
          result.data.data &&
          Array.isArray(result.data.data)
        ) {
          productsData = result.data.data;
        } else if (Array.isArray(result)) {
          productsData = result;
        }

        setproducts(productsData);
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
    fetchoffers();
    fetchproducts(); 
  }, []);

  const handleEdit = (offer) => {
    setSelectedRow(offer);
    setIsEditOpen(true);
  };

  const handleDelete = (offer) => {
    setSelectedRow(offer);
    setIsDeleteOpen(true);
  };

  // 📝 الخطوة 2: تحديث دالة الحفظ/التعديل لاستخدام isSaving
  const handleSave = async () => {
    if (!selectedRow) return;

    const {
      id,
      name,
      description,
      discount_type,
      discount_amount,
      subscription_details,
      setup_phase,
      start_date,
      end_date,
      product_id,
     
    } = selectedRow;

    const payload = {
      name: name || "",
      description: description || "",
      start_date: start_date || "",
      end_date: end_date || "",
      discount_type: discount_type || "",
      discount_amount: Number(discount_amount) || 0, 
      subscription_details: subscription_details || "",
      setup_phase: setup_phase || "",
      product_id: product_id || null,
    };

    // ✨ تفعيل حالة التحميل المنفصلة
    setIsSaving(true);

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/offers/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        toast.success("Offer updated successfully!");
        await fetchoffers();
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        const errorMessage =
          errorData?.error?.message ||
          errorData?.message ||
          errorData?.error?.details ||
          "Failed to update offer!";

        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error updating offer:", error);
      toast.error(error?.message || "Error occurred while updating offer!");
    } finally {
      // ✨ تعطيل حالة التحميل المنفصلة
      setIsSaving(false);
    }
  };

  // 📝 الخطوة 3: تحديث دالة الحذف لاستخدام isDeleting
  const handleDeleteConfirm = async () => {
    // ✨ تفعيل حالة التحميل المنفصلة
    setIsDeleting(true);

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/offers/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Offer deleted successfully!");
        setoffers(offers.filter((offer) => offer.id !== selectedRow.id));
        setIsDeleteOpen(false);
      } else {
        const errorData = await response.json();
        console.error("Delete failed:", errorData);

        const errorMessage =
          errorData?.error?.message ||
          errorData?.message ||
          errorData?.error?.details ||
          "Failed to delete offer!";

        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast.error(error?.message || "Error occurred while deleting offer!");
    } finally {
      // ✨ تعطيل حالة التحميل المنفصلة
      setIsDeleting(false);
    }
  };
  
  // 💡 دالة تبديل الحالة
  const handleToggleStatus = async (row) => {
    const { id, status: currentStatus } = row;
    
    // تحديد الحالة الجديدة
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    const oldStatus = currentStatus;

    // ✨ تفعيل حالة تحميل الزر الخاص بالصف المحدد
    setIsTogglingStatus(id);

    // Optimistic update - تحديث الواجهة فورًا
    setoffers((prevOffers) =>
      prevOffers.map((offer) =>
        offer.id === id ? { ...offer, status: newStatus } : offer
      )
    );

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/offers/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          // إرسال الحالة الجديدة
          body: JSON.stringify({ status: newStatus }), 
        }
      );

      if (response.ok) {
        toast.success(`Offer set to ${newStatus}!`);
      } else {
        const errorData = await response.json();
        console.error("Failed to update status:", errorData);
        toast.error("Failed to update offer status!");
        
        // Rollback on error - إعادة الحالة القديمة
        setoffers((prevOffers) =>
          prevOffers.map((offer) =>
            offer.id === id ? { ...offer, status: oldStatus } : offer
          )
        );
      }
    } catch (error) {
      console.error("Error updating offer status:", error);
      toast.error("Error occurred while updating offer status!");
      
      // Rollback on error
      setoffers((prevOffers) =>
        prevOffers.map((offer) =>
          offer.id === id ? { ...offer, status: oldStatus } : offer
        )
      );
    } finally {
      // ✨ تعطيل حالة تحميل الزر الخاص بالصف المحدد
      setIsTogglingStatus(null);
    }
  };

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 💡 الأعمدة المحسّنة
  const columns = [
    { key: "name", label: "Offer Name" },
    { 
      key: "discount_info", 
      label: "Discount",
      render: (row) => (
        <span className="font-medium">
          {row.discount_amount} {row.discount_type === 'percentage' ? '%' : 'Value'}
        </span>
      )
    },
    { 
      key: "dates", 
      label: "Duration",
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.start_date} to {row.end_date}
        </span>
      )
    },
    { key: "product_name", label: "Product" },
    { 
      key: "status", 
      label: "Status",
      render: (row) => (
        <span className={row.status === "Active" ? "text-green-600 font-medium" : "text-gray-500 font-medium"}>
          {row.status === "Active" ? "Active" : "Inactive"}
        </span>
      ),
      isToggle: true, // إضافة زر تبديل الحالة
      toggleKey: 'status'
    },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <DataTable
        data={offers}
        columns={columns}
        showAddButton={true}
        addRoute="/offer/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus} // تمرير دالة تبديل الحالة
        showEditButton={true}
        showDeleteButton={true}
        showActions={true}
        showFilter={true}
        searchKeys={["name", "description", "product_name"]}
        className="table-compact"
        // ✨ الخطوة 4: تمرير حالات التحميل للـ DataTable
        isLoadingEdit={isSaving}
        isLoadingDelete={isDeleting}
        isTogglingStatus={isTogglingStatus} // تمرير حالة زر الـ Toggle
      />

      {selectedRow && (
        <>
          <EditDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onSave={handleSave}
            selectedRow={selectedRow}
            columns={columns}
            onChange={onChange}
            // ✨ الخطوة 5: تمرير حالة التحميل لـ EditDialog
            isLoading={isSaving}
          >
            {/* Name, Description, Dates, Discount Type/Amount, Subscription Details, Setup Phase, Status, Product */}
            
            {/* ... (باقي حقول الإدخال كما هي في كودك الأصلي) ... */}
            
            <div className="max-h-[50vh] md:grid-cols-2 lg:grid-cols-3 !p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                          {/* Name */}
            <label htmlFor="name" className="text-gray-400 !pb-3">
              Name
            </label>
            <Input
              id="name"
              value={selectedRow?.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
              placeholder="Enter offer name"
            />

            {/* Description */}
            <label htmlFor="description" className="text-gray-400 !pb-3">
              Description
            </label>
            <Input
              id="description"
              value={selectedRow?.description || ""}
              onChange={(e) => onChange("description", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
              placeholder="Enter offer description"
            />

            {/* باقي الحقول بشكل 2 في الصف */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-gray-400 !pb-3">Start Date</label>
                <Input
                  type="date"
                  value={selectedRow?.start_date || ""}
                  onChange={(e) => onChange("start_date", e.target.value)}
                  className="!my-2 text-bg-primary !p-4"
                />
              </div>
              <div>
                <label className="text-gray-400 !pb-3">End Date</label>
                <Input
                  type="date"
                  value={selectedRow?.end_date || ""}
                  onChange={(e) => onChange("end_date", e.target.value)}
                  className="!my-2 text-bg-primary !p-4"
                />
              </div>

              <div>
                <label htmlFor="discount_type" className="text-gray-400 !pb-3">
                  Discount Type
                </label>
                <Select
                  value={selectedRow?.discount_type || ""}
                  onValueChange={(value) => onChange("discount_type", value)}
                >
                  <SelectTrigger className="!my-2 text-bg-primary !p-4">
                    <SelectValue placeholder="Select discount_type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white !p-2">
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-gray-400 !pb-3">Discount Amount</label>
                <Input
                  type="number"
                  value={selectedRow?.discount_amount || 0}
                  onChange={(e) => onChange("discount_amount", e.target.value)}
                  className="!my-2 text-bg-primary !p-4"
                />
              </div>

              <div>
                <label className="text-gray-400 !pb-3">
                  Subscription Details
                </label>
                <Input
                  value={selectedRow?.subscription_details || ""}
                  onChange={(e) =>
                    onChange("subscription_details", e.target.value)
                  }
                  className="!my-2 text-bg-primary !p-4"
                />
              </div>

              <div>
                <label className="text-gray-400 !pb-3">Setup Phase</label>
                <Input
                  value={selectedRow?.setup_phase || ""}
                  onChange={(e) => onChange("setup_phase", e.target.value)}
                  className="!my-2 text-bg-primary !p-4"
                />
              </div>
              

            </div>

            {/* Product field - Full width */}
            <div className="mt-4 w-full">
              <label htmlFor="product" className="text-gray-400 !pb-3 block">
                Product
              </label>
              <Select
                value={selectedRow?.product_id || ""}
                onValueChange={(value) => onChange("product_id", value)}
              >
                <SelectTrigger className="!my-2 text-bg-primary !p-4 w-full">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent className="bg-white !p-2">
                  {products.length > 0 ? (
                    products.map((product) => (
                      <SelectItem
                        key={product._id || product.id}
                        value={product._id || product.id}
                      >
                        {product.name} ({product.point || product.points || 0}{" "}
                        points)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No products available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
              </div>

          </EditDialog>

          <DeleteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDelete={handleDeleteConfirm}
            name={selectedRow.name}
            // ✨ الخطوة 5: تمرير حالة التحميل لـ DeleteDialog
            isLoading={isDeleting}
          />
        </>
      )}
    </div>
  );
};

export default Offer;