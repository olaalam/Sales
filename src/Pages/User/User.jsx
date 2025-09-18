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

const User = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [users, setUsers] = useState([]);
  const [targets, setTargets] = useState([]); // For target dropdown
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchUsers = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/users/",
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

      const formatted = result.data.data.map((user) => {
        const createdDate = new Date(user.created_at);
        const created_at = `${createdDate.getFullYear()}/${(
          createdDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${createdDate
          .getDate()
          .toString()
          .padStart(2, "0")}`;

        // Create avatar with first letter of name
        const avatar = (
          <Avatar className="w-12 h-12">
            <AvatarFallback>
              {user.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        );

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          leader_name: user.leader_id?.name || "—",
          leader_id: user.leader_id?._id || null,
          target_name: user.target_id?.name || "—",
          target_point: user.target_id?.point || 0,
          target_id: user.target_id?._id || null,
          status: user.status || "Active",
          created_at,
          avatar,
        };
      });

      setUsers(formatted);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users data");
    } finally {
      dispatch(hideLoader());
    }
  };

  // Fetch targets for dropdown
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
        console.log("Targets API response:", result); // للتحقق من البيانات

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

        setTargets(targetsData);
        console.log("Targets set:", targetsData);
      } else {
        console.error("Failed to fetch targets:", response.status);
        // Set empty array if targets API fails
        setTargets([]);
      }
    } catch (error) {
      console.error("Error fetching targets:", error);
      // Set empty array if targets API fails
      setTargets([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTargets(); // تفعيل استدعاء الـ targets
  }, []);

  const handleEdit = (user) => {
    setSelectedRow(user);
    setIsEditOpen(true);
  };

  const handleDelete = (user) => {
    setSelectedRow(user);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const { id, name, email, password, role, status, target_id } = selectedRow;

    const payload = {
      name: name || "",
      email: email || "",
      status: status || "Active",
    };

    // Only include these fields if they have values
    if (password && password.trim()) {
      payload.password = password;
    }
    if (role && role.trim()) {
      payload.role = role;
    }
    if (target_id) {
      payload.target_id = target_id;
    }

    console.log("Payload being sent:", payload);

    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/users/${id}`,
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
        toast.success("User updated successfully!");
        await fetchUsers();
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error("Failed to update user!");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Error occurred while updating user!");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/users/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("User deleted successfully!");
        setUsers(users.filter((user) => user.id !== selectedRow.id));
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete user!");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error occurred while deleting user!");
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;
    const statusValue = newStatus === 1 ? "Active" : "inactive";

    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/users/${id}`,
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
        toast.success("User status updated successfully!");
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === id ? { ...user, status: statusValue } : user
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to update user status:", errorData);
        toast.error("Failed to update user status!");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Error occurred while updating user status!");
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
    { key: "leader_name", label: "Leader Name" },
    { key: "target_name", label: "Target Name" },
    { key: "target_point", label: "Target Points" },
    { key: "status", label: "Status" },
    { key: "created_at", label: "Created Date" },
    { key: "avatar", label: "Avatar" },
  ];

  const filterOptionsForUsers = [
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
        data={users}
        columns={columns}
        showAddButton={true}
        addRoute="/users/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showEditButton={true}
        showDeleteButton={true}
        showActions={true}
        showFilter={true}
        filterOptions={filterOptionsForUsers}
        searchKeys={["name", "email", "leader_name", "target_name"]}
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
            <label htmlFor="name" className="text-gray-400 !pb-3">
              Name
            </label>
            <Input
              id="name"
              value={selectedRow?.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
              placeholder="Enter user name"
            />

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="role" className="text-gray-400 !pb-3">
                  Role
                </label>
                <Select
                  value={selectedRow?.role || ""}
                  onValueChange={(value) => onChange("role", value)}
                >
                  <SelectTrigger className="!my-2 text-bg-primary !p-4">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white !p-2">
                    <SelectItem className="cursor-pointer" value="Admin">
                      Admin
                    </SelectItem>
                    <SelectItem value="Sales Leader">Sales Leader</SelectItem>
                    <SelectItem value="Salesman">Salesman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="target" className="text-gray-400 !pb-3">
                  Target
                </label>
                <Select
                  value={selectedRow?.target_id || ""}
                  onValueChange={(value) => onChange("target_id", value)}
                >
                  <SelectTrigger className="!my-2 text-bg-primary !p-4">
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                  <SelectContent className="bg-white !p-2">
                    {targets.length > 0 ? (
                      targets.map((target) => (
                        <SelectItem
                          key={target._id || target.id}
                          value={target._id || target.id}
                        >
                          {target.name} ({target.point || target.points || 0}
                          points)
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No targets available
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
          />
        </>
      )}
    </div>
  );
};

export default User;
