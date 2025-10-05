"use client";
import { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditDialog from "@/components/EditDialog";
import DeleteDialog from "@/components/DeleteDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { Input } from "@/components/ui/input";

const Target = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [targets, setTargets] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  // حالات التحميل المنفصلة
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // Fetch targets for dropdown
  const fetchTargets = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/targets/",
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
        console.log("Targets API response:", result);

        // Handle different possible response structures
        let targetsData = [];
        if (result.data && Array.isArray(result.data)) {
          targetsData = result.data;
        } else if (
          result.data &&
          result.data.data &&
          Array.isArray(result.data.data)
        ) {
          targetsData = result.data.data;
        } else if (Array.isArray(result)) {
          targetsData = result;
        }

        // تحويل _id إلى id للتوافق مع باقي الكود
        const formattedTargets = targetsData.map((target) => ({
          ...target,
          id: target._id || target.id,
          // 💡 تطبيع الحالة إلى "Active" أو "inactive"
          name: target.name || "",
          point: target.point || target.points || 0,
          status:
            target.status === true || target.status === "Active"
              ? "Active"
              : "inactive",
        }));

        setTargets(formattedTargets);
        console.log("Targets set:", formattedTargets);
      } else {
        console.error("Failed to fetch targets:", response.status);
        toast.error("Failed to fetch targets!");
        setTargets([]);
      }
    } catch (error) {
      console.error("Error fetching targets:", error);
      toast.error("Error occurred while fetching targets!");
      setTargets([]);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleEdit = (target) => {
    // تأكد من أن البيانات كاملة قبل فتح ال dialog
    const completeTarget = {
      ...target,
      name: target.name || "",
      point: target.point || target.points || 0,
      status: target.status || "Active",
    };

    console.log("Editing target:", completeTarget);
    setSelectedRow(completeTarget);
    setIsEditOpen(true);
  };

  const handleDelete = (target) => {
    setSelectedRow(target);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const { id, name, point, status } = selectedRow;

    // بناء الـ payload للـ targets
    const payload = {
      name: name || "",
      // 💡 نستخدم parseInt هنا لضمان إرسال قيمة رقمية صحيحة
      point: parseInt(point) || 0,
      status: status || "Active", // 💡 إرسال status كقيمة نصية
    };

    console.log("Payload being sent:", payload);

    dispatch(showLoader());
    setIsSaving(true);
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/targets/${id}`,
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
        toast.success("Target updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        await fetchTargets(); // إعادة جلب البيانات
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error(errorData.message || "Failed to update target!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating target:", error);
      toast.error("Error occurred while updating target!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      dispatch(hideLoader());
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    dispatch(showLoader());
    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/targets/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Target deleted successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        setTargets(targets.filter((target) => target.id !== selectedRow.id));
        setIsDeleteOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete target!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error deleting target:", error);
      toast.error("Error occurred while deleting target!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      dispatch(hideLoader());
      setIsDeleting(false);
    }
  };

  // 💡 دالة التبديل تم تعديلها لتقلب الحالة بين "Active" و "inactive"
  const handleToggleStatus = async (row) => {
    const { id } = row;

    // تحديد الحالة الجديدة
    const currentStatus = row.status;
    const statusValue = currentStatus === "Active" ? "inactive" : "Active";

    // حفظ الحالة القديمة للـ rollback
    const oldStatus = row.status;

    // Optimistic update - تحديث الواجهة فوراً
    setTargets((prevTargets) =>
      prevTargets.map((target) =>
        target.id === id ? { ...target, status: statusValue } : target
      )
    );

    dispatch(showLoader());
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/targets/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ status: statusValue }),
        }
      );

      if (response.ok) {
        toast.success("Target status updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        // في حالة النجاح، لا نحتاج لتحديث محلي إضافي لأن التحديث التفاؤلي تم بالفعل
      } else {
        const errorData = await response.json();
        console.error("Failed to update target status:", errorData);
        toast.error(errorData.message || "Failed to update target status!", {
          position: "top-right",
          autoClose: 3000,
        });
        // Rollback: استعادة الحالة القديمة
        setTargets((prevTargets) =>
          prevTargets.map((target) =>
            target.id === id ? { ...target, status: oldStatus } : target
          )
        );
      }
    } catch (error) {
      console.error("Error updating target status:", error);
      toast.error("Error occurred while updating target status!", {
        position: "top-right",
        autoClose: 3000,
      });
      // Rollback: استعادة الحالة القديمة في حالة خطأ الشبكة
      setTargets((prevTargets) =>
        prevTargets.map((target) =>
          target.id === id ? { ...target, status: oldStatus } : target
        )
      );
    } finally {
      dispatch(hideLoader());
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
    { key: "name", label: "Target Name" },
    { key: "point", label: "Target Points" },
    {
      key: "status",
      label: "Status",
      // 💡 إضافة render لتحسين العرض البصري للحالة
      render: (row) => (
        <span
          className={
            row.status === "Active"
              ? "text-green-600 font-medium"
              : "text-gray-500 font-medium"
          }
        >
          {row.status === "Active" ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const filterOptionsForTargets = [
    {
      label: "Status",
      key: "status",
      options: [
        { value: "all", label: "All" },
        { value: "Active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  return (
    <>
      <div className="p-4">
        {isLoading && <FullPageLoader />}

        <DataTable
          data={targets}
          columns={columns}
          showAddButton={true}
          addRoute="/target/add"
          onEdit={handleEdit}
          onDelete={handleDelete}
          // 💡 إزالة newStatus من هنا حيث يتم حسابه داخل handleToggleStatus
          onToggleStatus={handleToggleStatus}
          showEditButton={true}
          showDeleteButton={true}
          showActions={true}
          showFilter={true}
          filterOptions={filterOptionsForTargets}
          searchKeys={["name"]}
          className="table-compact"
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
              isLoading={isSaving}
            >
              {/* Target Name Field */}
              <div className="!mb-4">
                <label htmlFor="name" className="block text-gray-400 !mb-2">
                  Target Name
                </label>
                <Input
                  id="name"
                  value={selectedRow?.name || ""}
                  onChange={(e) => onChange("name", e.target.value)}
                  className="text-bg-primary !p-4"
                  placeholder="Enter target name"
                />
              </div>

              {/* Target Points Field */}
              <div className="!mb-4">
                <label htmlFor="point" className="block text-gray-400 !mb-2">
                  Target Points
                </label>
                <Input
                  id="point"
                  type="number"
                  value={String(selectedRow?.point || 0)}
                  onChange={(e) => {
                    const value = e.target.value;
                    // 🔒 منع القيم السالبة أو الرموز "-" أثناء الكتابة
                    if (Number(value) < 0) {
                      toast.warning("Points cannot be negative!", {
                        position: "top-right",
                        autoClose: 2000,
                      });
                      return; // لا نحدث القيمة
                    }
                    onChange("point", value);
                  }}
                  onKeyDown={(e) => {
                    // منع إدخال إشارة السالب
                    if (e.key === "-" || e.key === "e") {
                      e.preventDefault();
                    }
                  }}
                  className="text-bg-primary !p-4"
                  placeholder="Enter target points"
                  min="0"
                />
              </div>
            </EditDialog>

            <DeleteDialog
              open={isDeleteOpen}
              onOpenChange={setIsDeleteOpen}
              onDelete={handleDeleteConfirm}
              name={selectedRow.name}
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

export default Target;
