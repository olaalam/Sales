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

const Sale = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [sales, setsales] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // حالات التحميل المنفصلة
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(null); // يستخدم id الصف الذي يتم تبديل حالته

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchsales = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/sales/",
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

      if (result.data.data.leaderOptions) {
        setLeaders(result.data.data.leaderOptions);
      }

      const formatted = result.data.data.sales.map((sale) => {
        return {
          id: sale._id,
          name: sale.name,
          email: sale.email,
          // 👈 1. تم التعديل: استخدام "NULL_LEADER" بدلاً من ""
          leader_id: sale.leader_id?._id || "NULL_LEADER",
          leader_name: sale.leader_id?.name || "—",
          status: sale.status === true || sale.status === "Active" ? "Active" : "Inactive", 
        };
      });

      setsales(formatted);
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales data");
      setsales([]);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchsales();
  }, []);

  const handleEdit = (sale) => {
    setSelectedRow(sale);
    setIsEditOpen(true);
  };

  const handleDelete = (sale) => {
    setSelectedRow(sale);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const { id, name, email, leader_id, status, password } = selectedRow;

    const payload = {
      name: name || "",
      email: email || "",
      // 👈 3. تم التعديل: تحويل "NULL_LEADER" إلى null عند الإرسال
      leader_id: leader_id === "NULL_LEADER" ? null : leader_id,
      status: status === "Active" ? true : false, 
    };
    
    if (password && password.trim()) {
      payload.password = password;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/sales/${id}`,
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
        toast.success("Sale updated successfully!");
        await fetchsales();
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error(errorData.message || "Failed to update sale!");
      }
    } catch (error) {
      console.error("Error updating sale:", error);
      toast.error("Error occurred while updating sale!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/sales/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Sale deleted successfully!");
        setsales(sales.filter((sale) => sale.id !== selectedRow.id));
        setIsDeleteOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete sale!");
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("Error occurred while deleting sale!");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (row) => {
    const { id } = row;

    const currentStatus = row.status;
    const newStatusBoolean = currentStatus === "Active" ? false : true;
    const newStatusString = newStatusBoolean ? "Active" : "Inactive";
    
    const oldStatus = row.status;

    setIsTogglingStatus(id);

    // Optimistic update
    setsales((prevsales) =>
      prevsales.map((sale) =>
        sale.id === id ? { ...sale, status: newStatusString } : sale
      )
    );

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/sales/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ status: newStatusBoolean }),
        }
      );

      if (response.ok) {
        toast.success("Sale status updated successfully!");
      } else {
        const errorData = await response.json();
        console.error("Failed to update sale status:", errorData);
        toast.error(errorData.message || "Failed to update sale status!");
        
        // Rollback on error
        setsales((prevsales) =>
          prevsales.map((sale) =>
            sale.id === id ? { ...sale, status: oldStatus } : sale
          )
        );
      }
    } catch (error) {
      console.error("Error updating sale status:", error);
      toast.error("Error occurred while updating sale status!");
      
      // Rollback on error
      setsales((prevsales) =>
        prevsales.map((sale) =>
          sale.id === id ? { ...sale, status: oldStatus } : sale
        )
      );
    } finally {
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
    { key: "email", label: "Email" },
    { key: "leader_name", label: "Leader" }, 
    { 
      key: "status", 
      label: "Status",
      render: (row) => (
        <span className={row.status === "Active" ? "text-green-600 font-medium" : "text-gray-500 font-medium"}>
          {row.status === "Active" ? "Active" : "Inactive"}
        </span>
      ),
      isToggle: true, 
      toggleKey: 'status'
    },
  ];

  const filterOptionsForsales = [
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
        data={sales}
        columns={columns}
        showAddButton={true}
        addRoute="/sale/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showEditButton={true}
        showDeleteButton={true}
        showActions={true}
        showFilter={true}
        filterOptions={filterOptionsForsales}
        searchKeys={["name", "email", "leader_name"]}
        className="table-compact"
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
            isLoading={isSaving}
          >
            {/* Name */}
            <label htmlFor="name" className="text-gray-400 !pb-3">
              Name
            </label>
            <Input
              id="name"
              value={selectedRow?.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
              placeholder="Enter sale name"
              disabled={isSaving}
            />

            {/* Email */}
            <label htmlFor="email" className="text-gray-400 !pb-3">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={selectedRow?.email || ""}
              onChange={(e) => onChange("email", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
              placeholder="Enter email address"
              disabled={isSaving}
            />

            {/* Leader Select */}
            <label htmlFor="leader" className="text-gray-400 !pb-3">
              Leader
            </label>
            <Select
              // 👈 2. تم التعديل: استخدام "NULL_LEADER" كقيمة افتراضية
              value={selectedRow?.leader_id || "NULL_LEADER"}
              onValueChange={(value) => onChange("leader_id", value)}
              disabled={isSaving}
            >
              <SelectTrigger className="!my-2 text-bg-primary !p-4">
                <SelectValue placeholder="Select a leader" />
              </SelectTrigger>
              <SelectContent className="bg-white !p-2">
                {/* 👈 2. تم التعديل: استخدام "NULL_LEADER" كقيمة لـ SelectItem */}
                <SelectItem value="NULL_LEADER">— No Leader —</SelectItem>
                {leaders.map((leader) => (
                  <SelectItem key={leader._id} value={leader._id}>
                    {leader.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>



            {/* Password */}
            <label htmlFor="password" className="text-gray-400 !pb-3">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={selectedRow?.password || ""}
              onChange={(e) => onChange("password", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
              placeholder="Enter new password (optional)"
              disabled={isSaving}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4"></div>
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
  );
};

export default Sale;