"use client";
import { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditDialog from "@/components/EditDialog";
import DeleteDialog from "@/components/DeleteDialog";
import { useDispatch } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Activity = () => {
  const dispatch = useDispatch();
  
  // ✨ حالات التحميل الجديدة لتعطيل الأزرار في الـ DataTable
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [activities, setActivities] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // Fetch activities (تبقى كما هي باستخدام الـ Loader العام)
  const fetchActivities = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/activities/",
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

        let activitiesData = [];
        if (result.data && Array.isArray(result.data)) {
          activitiesData = result.data;
        } else if (
          result.data &&
          result.data.data &&
          Array.isArray(result.data.data)
        ) {
          activitiesData = result.data.data;
        } else if (Array.isArray(result)) {
          activitiesData = result;
        }

        const formattedActivities = activitiesData.map((activity) => ({
          ...activity,
          id: activity._id || activity.id,
          name: activity.name || "",
          // تخزين الحالة كقيمة منطقية
          status: activity.status === true || activity.status === "true",
        }));

        setActivities(formattedActivities);
      } else {
        console.error("Failed to fetch activities:", response.status);
        toast.error("Failed to fetch activities!");
        setActivities([]);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Error occurred while fetching activities!");
      setActivities([]);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleEdit = (activity) => {
    const completeActivity = {
      ...activity,
      name: activity.name || "",
      // تحويل القيمة المنطقية إلى سلسلة نصية لملء حقل الـ Select في EditDialog
      status: activity.status === true ? "true" : "false",
    };

    setSelectedRow(completeActivity);
    setIsEditOpen(true);
  };

  const handleDelete = (activity) => {
    setSelectedRow(activity);
    setIsDeleteOpen(true);
  };

  // 📝 تم تحديث الدالة لتستخدم حالة التحميل المنفصلة
  const handleSave = async () => {
    if (!selectedRow) return;

    const { id, name, status } = selectedRow;

    const payload = {
      name: name?.trim() || "",
      // status هي بالفعل "true" أو "false" من حقل Select
      status: status,
    };

    // ✨ تفعيل حالة التحميل الخاصة بالحفظ
    setIsSaving(true);
    // يمكنك إزالة الـ dispatch(showLoader()) هنا أو تركه إذا كنت تفضل أن يظهر الـ FullPageLoader أيضاً
    // dispatch(showLoader()); 
    
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/activities/${id}`,
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
        toast.success("Activity updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        await fetchActivities();
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error(errorData.message || "Failed to update activity!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating activity:", error);
      toast.error("Error occurred while updating activity!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      // ✨ تعطيل حالة التحميل الخاصة بالحفظ
      setIsSaving(false);
      // dispatch(hideLoader()); // إذا كنت تستخدم الـ Loader العام
    }
  };

  // 📝 تم تحديث الدالة لتستخدم حالة التحميل المنفصلة
  const handleDeleteConfirm = async () => {
    // ✨ تفعيل حالة التحميل الخاصة بالحذف
    setIsDeleting(true);
    // dispatch(showLoader()); // إذا كنت تستخدم الـ Loader العام

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/activities/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Activity deleted successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        setActivities(
          activities.filter((activity) => activity.id !== selectedRow.id)
        );
        setIsDeleteOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete activity!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Error occurred while deleting activity!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      // ✨ تعطيل حالة التحميل الخاصة بالحذف
      setIsDeleting(false);
      // dispatch(hideLoader()); // إذا كنت تستخدم الـ Loader العام
    }
  };

  // دالة تغيير الحالة (Toggle) ستبقى تستخدم الـ Loader العام أو يمكنك أيضاً فصل حالتها.
  // سنتركها تستخدم الـ Loader العام لتبسيط الأمر.
  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;
    const currentStatusIsActive = row.status;
    const newStatusBoolean = !currentStatusIsActive;
    const statusValue = newStatusBoolean ? "true" : "false";
    const oldStatus = row.status;

    // Optimistic update
    setActivities((prevActivities) =>
      prevActivities.map((activity) =>
        activity.id === id
          ? { ...activity, status: newStatusBoolean }
          : activity
      )
    );

    // نستخدم الـ Loader العام هنا
    dispatch(showLoader()); 
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/activities/${id}`,
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
        toast.success("Activity status updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        const errorData = await response.json();
        console.error("Failed to update activity status:", errorData);
        toast.error(errorData.message || "Failed to update activity status!", {
          position: "top-right",
          autoClose: 3000,
        });
        // Rollback on error
        setActivities((prevActivities) =>
          prevActivities.map((activity) =>
            activity.id === id ? { ...activity, status: oldStatus } : activity
          )
        );
      }
    } catch (error) {
      console.error("Error updating activity status:", error);
      toast.error("Error occurred while updating activity status!", {
        position: "top-right",
        autoClose: 3000,
      });
      // Rollback on error
      setActivities((prevActivities) =>
        prevActivities.map((activity) =>
          activity.id === id ? { ...activity, status: oldStatus } : activity
        )
      );
    } finally {
      dispatch(hideLoader());
    }
  };

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const columns = [
    { key: "name", label: "Activity Name" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={
            row.status
              ? "text-green-600 font-medium"
              : "text-gray-500 font-medium"
          }
        >
          {row.status ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const filterOptionsForActivities = [
    {
      label: "Status",
      key: "status",
      options: [
        { value: "all", label: "All" },
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
      ],
    },
  ];

  return (
    <>
      {/* ✨ تمرير حالات التحميل الجديدة للـ DataTable */}
      <DataTable
        data={activities}
        columns={columns}
        showAddButton={true}
        addRoute="/activity/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showEditButton={true}
        showDeleteButton={true}
        showActions={true}
        showFilter={true}
        filterOptions={filterOptionsForActivities}
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
            // ✨ تمرير حالة التحميل للحوار لتعطيل زر "Save" داخله
            isLoading={isSaving} 
          >
            {/* Activity Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Activity Name
              </label>
              <Input
                id="name"
                value={selectedRow?.name || ""}
                onChange={(e) => onChange("name", e.target.value)}
                className="text-bg-primary !p-4"
                placeholder="Enter activity name"
              />
            </div>

            {/* Status Field */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Status
              </label>
              <Select
                value={selectedRow?.status || "false"}
                onValueChange={(value) => onChange("status", value)}
              >
                <SelectTrigger className="text-bg-primary !p-4">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </EditDialog>

          <DeleteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDelete={handleDeleteConfirm}
            name={selectedRow.name}
            // ✨ تمرير حالة التحميل للحوار لتعطيل زر "Delete" داخله
            isLoading={isDeleting} 
          />
        </>
      )}

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

export default Activity;