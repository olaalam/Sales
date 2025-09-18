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


const Source = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [sources, setSources] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // Fetch sources for dropdown
  const fetchSources = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/sources/",
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
        console.log("sources API response:", result);

        // Handle different possible response structures
        let sourcesData = [];
        if (result.data && Array.isArray(result.data)) {
          sourcesData = result.data;
        } else if (
          result.data &&
          result.data.data &&
          Array.isArray(result.data.data)
        ) {
          sourcesData = result.data.data;
        } else if (Array.isArray(result)) {
         sourcesData = result;
        }

        // تحويل _id إلى id للتوافق مع باقي الكود
        const formattedSources = sourcesData.map(source => ({
          ...source,
          id: source._id || source.id,
          // تأكد من وجود البيانات المطلوبة
          name: source.name || "",
          status: source.status || "Active"
        }));

        setSources(formattedSources);
        console.log("Sources set:", formattedSources);
      } else {
        console.error("Failed to fetch Sources:", response.status);
        toast.error("Failed to fetch Sources!");
        setSources([]);
      }
    } catch (error) {
      console.error("Error fetching Sources:", error);
      toast.error("Error occurred while fetching Sources!");
      setSources([]);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleEdit = (source) => {
    // تأكد من أن البيانات كاملة قبل فتح ال dialog
    const completesource = {
      ...source,
      name: source.name || "",
      status: source.status || "Active"
    };
    
    console.log("Editing source:", completesource);
    setSelectedRow(completesource);
    setIsEditOpen(true);
  };

  const handleDelete = (source) => {
    setSelectedRow(source);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const { id, name, status } = selectedRow;

    // بناء الـ payload للـ sources
    const payload = {
      name: name || "",
      status: status || "Active",
    };

    console.log("Payload being sent:", payload);

    dispatch(showLoader());
    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/sources/${id}`,
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
        toast.success("source updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        await fetchSources(); // إعادة جلب البيانات
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error(errorData.message || "Failed to update source!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating source:", error);
      toast.error("Error occurred while updating source!", {
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
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/sources/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("source deleted successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        setSources(sources.filter((source) => source.id !== selectedRow.id));
        setIsDeleteOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete source!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error deleting source:", error);
      toast.error("Error occurred while deleting source!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;
    const statusValue = newStatus === 1 ? "Active" : "inactive";

    dispatch(showLoader());
    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/sources/${id}`,
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
        toast.success("source status updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        // تحديث الحالة محلياً
        setSources((prevsources) =>
          prevsources.map((source) =>
            source.id === id ? { ...source, status: statusValue } : source
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to update source status:", errorData);
        toast.error(errorData.message || "Failed to update source status!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating source status:", error);
      toast.error("Error occurred while updating source status!", {
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
    { key: "name", label: "Source Name" },
    { key: "status", label: "Status" },
  ];

  const filterOptionsForsources = [
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
          data={sources}
          columns={columns}
          showAddButton={true}
          addRoute="/source/add"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          showEditButton={true}
          showDeleteButton={true}
          showActions={true}
          showFilter={true}
          filterOptions={filterOptionsForsources}
          searchKeys={["name"]} // مُصحح من source_name إلى name
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
              {/* source Name Field */}
              <div className="!mb-4">
                <label htmlFor="name" className="block text-gray-400 !mb-2">
                  Source Name
                </label>
                <Input
                  id="name"
                  value={selectedRow?.name || ""}
                  onChange={(e) => onChange("name", e.source.value)}
                  className="text-bg-primary !p-4"
                  placeholder="Enter source name"
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

export default Source;