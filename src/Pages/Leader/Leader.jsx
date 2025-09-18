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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Leader = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [leaders, setleaders] = useState([]);
  const [targets, setTargets] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchleaders = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/leaders/",
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

      const formatted = result.data.data.map((leader) => {
        const createdDate = new Date(leader.created_at);

        return {
          id: leader._id,
          name: leader.name,
          email: leader.email,
          role: leader.role,
          leader_name: leader.leader_id?.name || "—",
          leader_id: leader.leader_id?._id || null,
          target_name: leader.target_id?.name || "—",
          status: leader.status || "Active",
        };
      });

      setleaders(formatted);
    } catch (error) {
      console.error("Error fetching leaders:", error);
      toast.error("Failed to load leaders data");
    } finally {
      dispatch(hideLoader());
    }
  };

  const fetchTargets = async () => {
    try {
      const response = await fetch(
        "https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/targets/",
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

        setTargets(targetsData);
      } else {
        console.error("Failed to fetch targets:", response.status);
        setTargets([]);
      }
    } catch (error) {
      console.error("Error fetching targets:", error);
      setTargets([]);
    }
  };

  useEffect(() => {
    fetchleaders();
    fetchTargets();
  }, []);

  const handleEdit = (leader) => {
    setSelectedRow(leader);
    setIsEditOpen(true);
  };

  const handleDelete = (leader) => {
    setSelectedRow(leader);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const { id, name, email, password, role, status } = selectedRow;

    const payload = {
      name: name || "",
      email: email || "",
      status: status || "Active",
      role: role || "Sales Leader",
    };

    if (password && password.trim()) {
      payload.password = password;
    }

    console.log("Payload being sent:", payload);

    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/leaders/${id}`,
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
        toast.success("leader updated successfully!");
        await fetchleaders();
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error("Failed to update leader!");
      }
    } catch (error) {
      console.error("Error updating leader:", error);
      toast.error("Error occurred while updating leader!");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/leaders/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("leader deleted successfully!");
        setleaders(leaders.filter((leader) => leader.id !== selectedRow.id));
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete leader!");
      }
    } catch (error) {
      console.error("Error deleting leader:", error);
      toast.error("Error occurred while deleting leader!");
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;
    const statusValue = newStatus === 1 ? "Active" : "inactive";

    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/leaders/${id}`,
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
        toast.success("leader status updated successfully!");
        setleaders((prevleaders) =>
          prevleaders.map((leader) =>
            leader.id === id ? { ...leader, status: statusValue } : leader
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to update leader status:", errorData);
        toast.error("Failed to update leader status!");
      }
    } catch (error) {
      console.error("Error updating leader status:", error);
      toast.error("Error occurred while updating leader status!");
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
    { key: "target_name", label: "Target Name" },
    { key: "status", label: "Status" },
  ];

  const filterOptionsForleaders = [
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
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />
      <DataTable
        data={leaders}
        columns={columns}
        showAddButton={true}
        addRoute="/leader/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showEditButton={true}
        showDeleteButton={true}
        showActions={true}
        showFilter={true}
        filterOptions={filterOptionsForleaders}
        searchKeys={["name", "email", "target_name"]}
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
            {/* Name */}
            <label htmlFor="name" className="text-gray-400 !pb-3">
              Name
            </label>
            <Input
              id="name"
              value={selectedRow?.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
              placeholder="Enter leader name"
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
            />

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
              placeholder="Enter new password"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4"></div>
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
  );
};

export default Leader;
