"use client";
import { useEffect, useState, useCallback } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditDialog from "@/components/EditDialog";
import DeleteDialog from "@/components/DeleteDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PaymentMethod = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // New state for Base64 image
  const [newImageBase64, setNewImageBase64] = useState(null);

  // ✨ إضافة حالات التحميل المنفصلة
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(null); // يستخدم id الصف الذي يتم تبديل حالته

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // Utility function to convert file to Base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No file provided"));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const fetchPaymentMethods = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/payment-methods/",
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

      const formatted = result.data.data.map((method) => {
        const createdDate = new Date(method.created_at);
        const created_at = `${createdDate.getFullYear()}/${(
          createdDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${createdDate
            .getDate()
            .toString()
            .padStart(2, "0")}`;

        // Create logo avatar
        const logo = (
          <Avatar className="w-12 h-12">
            {method.logo_url ? (
              <AvatarImage src={method.logo_url} alt={method.name} />
            ) : (
              <AvatarFallback>
                {method.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        );

        return {
          id: method._id,
          name: method.name,
          description: method.description,
          // تخزين الحالة كسلسلة نصية للعرض والتحرير
          status:
            method.status === "true" || method.status === true
              ? "Active"
              : "Inactive",
          logo_url: method.logo_url || "",
          created_at,
          logo,
        };
      });

      setPaymentMethods(formatted);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("Failed to load payment methods data");
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleEdit = (method) => {
    setSelectedRow(method);
    setIsEditOpen(true);
    setNewImageBase64(null); // Reset Base64 state on edit
  };

  const handleDelete = (method) => {
    setSelectedRow(method);
    setIsDeleteOpen(true);
  };

  // New handler for file input change
  const handleLogoFileChange = useCallback(async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const base64String = await convertFileToBase64(file);
        setNewImageBase64(base64String);
        setSelectedRow((prev) => ({ ...prev, logo_url: base64String }));
      } catch (error) {
        console.error("Error converting file to Base64:", error);
        toast.error("Failed to process image file.");
        setNewImageBase64(null);
        event.target.value = null; // Clear the input
      }
    }
  }, []);

  // 📝 تحديث دالة الحفظ/التعديل لاستخدام isSaving
  const handleSave = async () => {
    if (!selectedRow) return;

    const { id, name, description, status } = selectedRow;

    // 💡 تصحيح: إرسال القيمة المنطقية true/false
    const payload = {
      name: name || "",
      description: description || "",
      status: status === "Active" ? true : false, // ⬅️ إرسال قيمة منطقية
      logo_url: newImageBase64 || selectedRow.logo_url || "",
    };

    console.log("Payload being sent:", payload);
    
    // ✨ تفعيل حالة التحميل
    setIsSaving(true);

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/payment-methods/${id}`,
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
        toast.success("Payment method updated successfully!");
        await fetchPaymentMethods();
        setIsEditOpen(false);
        setSelectedRow(null);
        setNewImageBase64(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error(errorData.message || "Failed to update payment method!");
      }
    } catch (error) {
      console.error("Error updating payment method:", error);
      toast.error(error.message || "Error occurred while updating payment method!");
    } finally {
      // ✨ تعطيل حالة التحميل
      setIsSaving(false);
    }
  };

  // 📝 تحديث دالة الحذف لاستخدام isDeleting
  const handleDeleteConfirm = async () => {
    // ✨ تفعيل حالة التحميل
    setIsDeleting(true);

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/payment-methods/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Payment method deleted successfully!");
        setPaymentMethods(
          paymentMethods.filter((method) => method.id !== selectedRow.id)
        );
        setIsDeleteOpen(false);
      } else {
        const errorData = await response.json();
        console.error("Delete failed:", errorData);
        toast.error(errorData.message || "Failed to delete payment method!");
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error(error.message || "Error occurred while deleting payment method!");
    } finally {
      // ✨ تعطيل حالة التحميل
      setIsDeleting(false);
    }
  };

  // 📝 تحديث دالة تبديل الحالة لاستخدام isTogglingStatus
  const handleToggleStatus = async (row) => {
    const { id } = row;

    const currentStatus = row.status;
    const newStatusString = currentStatus === "Active" ? "Inactive" : "Active";
    const payloadStatus = newStatusString === "Active" ? true : false; 
    const oldStatus = row.status;

    // ✨ تفعيل حالة تحميل الزر الخاص بالصف المحدد
    setIsTogglingStatus(id);

    // Optimistic update
    setPaymentMethods((prevMethods) =>
      prevMethods.map((method) =>
        method.id === id ? { ...method, status: newStatusString } : method 
      )
    );

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/payment-methods/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ status: payloadStatus }), // إرسال قيمة منطقية
        }
      );

      if (response.ok) {
        toast.success("Payment method status updated successfully!");
      }
      else {
        const errorData = await response.json();
        console.error("Failed to update payment method status:", errorData);
        toast.error(errorData.message || "Failed to update payment method status!");
        
        // Rollback on error
        setPaymentMethods((prevMethods) =>
          prevMethods.map((method) =>
            method.id === id ? { ...method, status: oldStatus } : method
          )
        );
      }
    } catch (error) {
      console.error("Error updating payment method status:", error);
      toast.error(error.message || "Error occurred while updating payment method status!");
      
      // Rollback on error
      setPaymentMethods((prevMethods) =>
        prevMethods.map((method) =>
          method.id === id ? { ...method, status: oldStatus } : method
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

  const columns = [
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
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
    { key: "logo", label: "Logo" },
  ];

  const filterOptionsForPaymentMethods = [
    {
      label: "Status",
      key: "status",
      options: [
        { value: "all", label: "All" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
    },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <DataTable
        data={paymentMethods}
        columns={columns}
        showAddButton={true}
        addRoute="/payment-method/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showEditButton={true}
        showDeleteButton={true}
        showActions={true}
        showFilter={true}
        filterOptions={filterOptionsForPaymentMethods}
        searchKeys={["name", "description"]}
        className="table-compact"
        // ✨ تمرير حالات التحميل للـ DataTable
        isLoadingEdit={isSaving}
        isLoadingDelete={isDeleting}
        isTogglingStatus={isTogglingStatus} 
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
            // ✨ تمرير حالة التحميل لـ EditDialog
            isLoading={isSaving}
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="text-gray-400 block mb-2">
                  Payment Method Name
                </label>
                <Input
                  id="name"
                  value={selectedRow?.name || ""}
                  onChange={(e) => onChange("name", e.target.value)}
                  className="!my-2 text-bg-primary !p-4"
                  placeholder="Enter payment method name"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="text-gray-400 block mb-2"
                >
                  Description
                </label>
                <Textarea
                  id="description"
                  value={selectedRow?.description || ""}
                  onChange={(e) => onChange("description", e.target.value)}
                  className="!my-2 text-bg-primary !p-4 min-h-[100px]"
                  placeholder="Enter payment method description"
                />
              </div>


              <div>
                <label htmlFor="logo_file" className="text-gray-400 block !mb-2">
                  Logo
                </label>
                {selectedRow?.logo_url && (
                  <div className="flex items-center gap-4 !mb-2">
                    <img
                      src={selectedRow.logo_url}
                      alt="Current"
                      className="w-12 h-12 rounded-md object-cover border"
                    />
                  </div>
                )}
                <Input
                  id="logo_file"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="!my-2 text-bg-primary !ps-4 "
                  // 💡 تعطيل الحقل إذا كانت هناك عملية حفظ/تحميل جارية
                  disabled={isSaving} 
                />
              </div>
            </div>
          </EditDialog>

          <DeleteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDelete={handleDeleteConfirm}
            name={selectedRow.name}
            // ✨ تمرير حالة التحميل لـ DeleteDialog
            isLoading={isDeleting}
          />
        </>
      )}
    </div>
  );
};

export default PaymentMethod;