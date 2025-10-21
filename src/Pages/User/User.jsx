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
  // حالة التحميل العامة (تستخدم للـ FullPageLoader)
  const isGlobalLoading = useSelector((state) => state.loader.isLoading);

  // ✨ حالات التحميل الجديدة لتعطيل الأزرار في الـ DataTable
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [users, setUsers] = useState([]);
  const [targets, setTargets] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchUsers = async () => {
    // نستخدم الـ Loader العام هنا لأنه يغطي كامل الشاشة أثناء جلب البيانات
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/users/",
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

        const avatar = (
          <Avatar className="w-12 h-12">
            <AvatarFallback>
              {user.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        );

        const status =
          user.status === true || user.status === "Active"
            ? "Active"
            : "inactive";

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          leader_name: user.leader?.name || "—",
          leader_id: user.leader?._id || null,
          target_name: user.target?.name || "—",
          target_point: user.target?.point || 0,
          target_id: user.target?.id || null,
          status, // Use normalized status
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

  const fetchTargets = async () => {
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
    fetchUsers();
    fetchTargets();
  }, []);

  const handleEdit = (user) => {
    setSelectedRow({
      ...user,
target_id: user.target_id || "",
    });
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

    if (password && password.trim()) {
      payload.password = password;
    }
    if (role && role.trim()) {
      payload.role = role;
    }

    if (target_id !== undefined) {
      if (target_id === "none" || target_id === "") {
        payload.target_id = null;
      } else {
        payload.target_id = target_id;
      }
    }

    console.log("Payload being sent:", payload);

    // ✨ تفعيل حالة التحميل الخاصة بعملية الحفظ
    setIsSaving(true);
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/users/${id}`,
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
        await fetchUsers(); // إعادة جلب البيانات
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error(errorData.message || "Failed to update user!");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Error occurred while updating user!");
    } finally {
      // ✨ تعطيل حالة التحميل الخاصة بعملية الحفظ
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    // ✨ تفعيل حالة التحميل الخاصة بعملية الحذف
    setIsDeleting(true);
    try {
      const userId = selectedRow.id; 
      console.log("Deleting user:", userId);

      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("User deleted successfully!");
        setUsers(users.filter((user) => user.id !== selectedRow.id));
        setIsDeleteOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete user!");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error occurred while deleting user!");
    } finally {
      // ✨ تعطيل حالة التحميل الخاصة بعملية الحذف
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (row) => {
    const { id } = row;
    const currentStatus = row.status;
    const statusValue =
      currentStatus === "Active" ? "inactive" : "Active";
    const oldStatus = row.status;

    // Optimistic update
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === id ? { ...user, status: statusValue } : user
      )
    );

    // ملاحظة: بما أن هذه العملية تحدث في الـ DataTable ولا تفتح ديالوج، 
    // يمكنك استخدام isSaving أو isDeleting كحالة تحميل عامة إذا أردت تعطيل 
    // باقي الأزرار أثناء هذه العملية، لكن يفضل استخدام حالة تحميل منفصلة 
    // لخاصية الـ Toggle إذا لم تكن تستخدم FullPageLoader. 
    // للحفاظ على البساطة، سنفترض أن FullPageLoader (المفعل في الدالة الأصلية) 
    // يغطي هذه العملية أيضاً أو أن الـ DataTable نفسه يستطيع التعامل معها.

    // في الكود الأصلي: dispatch(showLoader());
    // سنستخدم حالة التحميل العامة لأنها عملية شبكة طويلة

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/users/${id}`,
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
        toast.success(`User status changed to ${statusValue}!`);
      } else {
        const errorData = await response.json();
        console.error("Failed to update user status:", errorData);
        toast.error(errorData.message || "Failed to update user status!");
        // Rollback
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === id ? { ...user, status: oldStatus } : user
          )
        );
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Error occurred while updating user status!");
      // Rollback
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === id ? { ...user, status: oldStatus } : user
        )
      );
    }
    // في الكود الأصلي: finally { dispatch(hideLoader()); }
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
    {
      key: "status",
      label: "Status",
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
      {isGlobalLoading && <FullPageLoader />}
      <ToastContainer />

      {/* ✨ تمرير حالات التحميل الجديدة للـ DataTable */}
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
            // ✨ تمرير حالة التحميل الخاصة بالحفظ
            isLoading={isSaving}
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
              placeholder="Enter new password (optional)"
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
                    <SelectItem value="none">No Target</SelectItem>
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
                    ) : null}
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
            // ✨ تمرير حالة التحميل الخاصة بالحذف
            isLoading={isDeleting}
          />
        </>
      )}
    </div>
  );
};

export default User;