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
const Commission = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [commissions, setcommissions] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // ✅ حالات التحميل المنفصلة موجودة بالفعل
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // Fetch commissions for dropdown
  const fetchcommissions = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/commissions/",
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
        console.log("commissions API response:", result);

        // Handle different possible response structures
        let commissionsData = [];
        if (result.data && Array.isArray(result.data)) {
          commissionsData = result.data;
        } else if (
          result.data &&
          result.data.data &&
          Array.isArray(result.data.data)
        ) {
          commissionsData = result.data.data;
        } else if (Array.isArray(result)) {
          commissionsData = result;
        }

        // تحويل _id إلى id للتوافق مع باقي الكود
        const formattedcommissions = commissionsData.map((commission) => ({
          ...commission,
          id: commission._id || commission.id,
          // تأكد من وجود البيانات المطلوبة
          name: commission.level_name || "",
          type: commission.type || "",
          amount: commission.amount || 0,
          point_threshold: commission.point_threshold || 0,
        }));

        setcommissions(formattedcommissions);
        console.log("commissions set:", formattedcommissions);
      } else {
        console.error("Failed to fetch commissions:", response.status);
        toast.error("Failed to fetch commissions!");
        setcommissions([]);
      }
    } catch (error) {
      console.error("Error fetching commissions:", error);
      toast.error("Error occurred while fetching commissions!");
      setcommissions([]);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchcommissions();
  }, []);

  const handleEdit = (commission) => {
    // تأكد من أن البيانات كاملة قبل فتح ال dialog
    const completecommission = {
      ...commission,
      id: commission._id || commission.id,
      // يتم استخدام 'level_name' و 'point_threshold' في الـ payload
      level_name: commission.level_name || commission.name || "",
      type: commission.type || "",
      amount: commission.amount || 0,
      point_threshold:
        commission.point_threshold || commission.price_quarter || 0,
    };

    console.log("Editing commission:", completecommission);
    setSelectedRow(completecommission);
    setIsEditOpen(true);
  };

  const handleDelete = (commission) => {
    setSelectedRow(commission);
    setIsDeleteOpen(true);
  };

  // 📝 تعديل دالة الحفظ
  const handleSave = async () => {
    if (!selectedRow) return;

    const { id, level_name, type, amount, point_threshold } = selectedRow;

    // بناء الـ payload للـ commissions
    const payload = {
      level_name: level_name || "",
      type: type || "",
      amount: parseFloat(amount) || 0,
      point_threshold: parseFloat(point_threshold) || 0,
    };

    console.log("Payload being sent:", payload);

    // ✨ تفعيل حالة التحميل المنفصلة لتعطيل الأزرار
    setIsSaving(true);
    // يمكنك الإبقاء على dispatch(showLoader()) إذا أردت ظهور FullPageLoader
    // dispatch(showLoader());

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/commissions/${id}`,
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
        toast.success("commission updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        await fetchcommissions(); // إعادة جلب البيانات
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error(errorData.message || "Failed to update commission!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating commission:", error);
      toast.error("Error occurred while updating commission!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      // ✨ تعطيل حالة التحميل المنفصلة
      setIsSaving(false);
      // dispatch(hideLoader()); // إذا كنت تستخدم الـ Loader العام
    }
  };

  // 📝 تعديل دالة الحذف
  const handleDeleteConfirm = async () => {
    // ✨ تفعيل حالة التحميل المنفصلة لتعطيل الأزرار
    setIsDeleting(true);
    // يمكنك الإبقاء على dispatch(showLoader()) إذا أردت ظهور FullPageLoader
    // dispatch(showLoader());

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/commissions/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("commission deleted successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        setcommissions(
          commissions.filter((commission) => commission.id !== selectedRow.id)
        );
        setIsDeleteOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete commission!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error deleting commission:", error);
      toast.error("Error occurred while deleting commission!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      // ✨ تعطيل حالة التحميل المنفصلة
      setIsDeleting(false);
      // dispatch(hideLoader()); // إذا كنت تستخدم الـ Loader العام
    }
  };

  const onChange = (key, value) => {
    console.log(`Changing ${key} to:`, value);
    setSelectedRow((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const columns = [
    { key: "name", label: "Level Name" },
    { key: "type", label: "Type" },
    { key: "amount", label: "Amount" },
    { key: "point_threshold", label: "Point Threshold" },
  ];

  return (
    <>
      <div className="p-4">
        {isLoading && <FullPageLoader />}

        <DataTable
          data={commissions}
          columns={columns}
          showAddButton={true}
          addRoute="/commission/add"
          onEdit={handleEdit}
          onDelete={handleDelete}
          showEditButton={true}
          showDeleteButton={true}
          showActions={true}
          showFilter={true}
          searchKeys={["name"]}
          className="table-compact"
          // ✅ الحالات مُمررة بشكل صحيح
          isLoadingEdit={isSaving}
          isLoadingDelete={isDeleting}
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
              // ✅ حالة التحميل مُمررة بشكل صحيح لتعطيل زر الحفظ داخل الحوار
              isLoading={isSaving}
            >
              {/* commission Name Field */}
              <div className="!mb-4">
                <label
                  htmlFor="level_name"
                  className="block text-gray-400 !mb-2"
                >
                  Level Name
                </label>
                <Input
                  id="level_name"
                  // يُفضل استخدام level_name مباشرة هنا
                  value={selectedRow?.level_name || ""}
                  onChange={(e) => onChange("level_name", e.target.value)}
                  className="text-bg-primary !p-4"
                  placeholder="Enter level name"
                />
              </div>

              {/* commission type Field */}
              <div className="!mb-4">
                <label htmlFor="type" className="block text-gray-400 !mb-2 ">
                  Commission Type
                </label>
                <Select
                  value={selectedRow?.type || ""}
                  onValueChange={(value) => onChange("type", value)}
                >
                  <SelectTrigger className="!my-2 text-bg-primary !p-4 w-full">
                    <SelectValue placeholder="Select commission type" />
                  </SelectTrigger>
                   <SelectContent className="bg-white !p-2">
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* commission amount Field */}
              <div className="!mb-4">
                <label htmlFor="amount" className="block text-gray-400 !mb-2">
                  Amount
                </label>
                <Input
                  id="amount"
                  type="number"
                  value={selectedRow?.amount || 0}
                  onChange={(e) =>
                    onChange("amount", parseFloat(e.target.value) || 0)
                  }
                  className="text-bg-primary !p-4"
                  placeholder="Enter Amount"
                  min="0"
                />
              </div>
              {/* commission point_threshold Field */}
              <div className="!mb-4">
                <label
                  htmlFor="point_threshold"
                  className="block text-gray-400 !mb-2"
                >
                  Point Threshold
                </label>
                <Input
                  id="point_threshold"
                  type="number"
                  // يُفضل استخدام point_threshold مباشرة هنا
                  value={selectedRow?.point_threshold || 0}
                  onChange={(e) =>
                    onChange("point_threshold", parseFloat(e.target.value) || 0)
                  }
                  className="text-bg-primary !p-4"
                  placeholder="Enter point_threshold"
                  min="0"
                />
              </div>
            </EditDialog>

            <DeleteDialog
              open={isDeleteOpen}
              onOpenChange={setIsDeleteOpen}
              onDelete={handleDeleteConfirm}
              name={selectedRow.name}
              // ✅ حالة التحميل مُمررة بشكل صحيح لتعطيل زر الحذف داخل الحوار
              isLoading={isDeleting}
            />
          </>
        )}
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        style={{ zIndex: 9999 }}
      />
    </>
  );
};

export default Commission;
