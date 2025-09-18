"use client";
import { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditDialog from "@/components/EditDialog";
import DeleteDialog from "@/components/DeleteDialog";
import { useDispatch } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
// import FullPageLoader from "@/components/Loading";
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
  // const isLoading = useSelector((state) => state.loader.isLoading);
  const [activities, setActivities] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // Fetch activities
  const fetchActivities = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/activities/",
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
        console.log("Activities API response:", result);

        // Handle different possible response structures
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

        // تحويل _id إلى id للتوافق مع باقي الكود وتنظيف البيانات
        const formattedActivities = activitiesData.map(activity => ({
          ...activity,
          id: activity._id || activity.id,
          name: activity.name || "",
          // تحويل الحالة إلى boolean
          status: activity.status === true || activity.status === "true"
        }));

        setActivities(formattedActivities);
        console.log("Activities set:", formattedActivities);
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
      // تحويل حالة boolean إلى string للعرض في نافذة التعديل
      status: activity.status === true ? "true" : "false"
    };
    
    console.log("Editing activity:", completeActivity);
    setSelectedRow(completeActivity);
    setIsEditOpen(true);
  };

  const handleDelete = (activity) => {
    setSelectedRow(activity);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const { id, name, status } = selectedRow;

    // بناء الـ payload للـ activities
    const payload = {
      name: name?.trim() || "",
      status: status, // status هنا هي بالفعل string
    };

    console.log("Payload being sent:", payload);

    dispatch(showLoader());
    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/activities/${id}`,
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
        await fetchActivities(); // إعادة جلب البيانات
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
      dispatch(hideLoader());
    }
  };

  const handleDeleteConfirm = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/activities/${selectedRow.id}`,
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
        setActivities(activities.filter((activity) => activity.id !== selectedRow.id));
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
      dispatch(hideLoader());
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;
    const statusValue = newStatus === 1 ? "true" : "false";

    dispatch(showLoader());
    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/activities/${id}`,
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
        // تحديث الحالة محلياً إلى boolean
        setActivities((prevActivities) =>
          prevActivities.map((activity) =>
            activity.id === id ? { ...activity, status: newStatus === 1 } : activity
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to update activity status:", errorData);
        toast.error(errorData.message || "Failed to update activity status!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating activity status:", error);
      toast.error("Error occurred while updating activity status!", {
        position: "top-right",
        autoClose: 3000,
      });
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
    { key: "name", label: "Activity Name" },
    { key: "status", label: "Status" },
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
      <div className="p-4">
        {/* {isLoading && <FullPageLoader />} */}

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
            >
              {/* Activity Name Field */}
              <div className="!mb-4">
                <label htmlFor="name" className="block text-gray-400 !mb-2">
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

            </EditDialog>

            <DeleteDialog
              open={isDeleteOpen}
              onOpenChange={setIsDeleteOpen}
              onDelete={handleDeleteConfirm}
              name={selectedRow.name}
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

export default Activity;