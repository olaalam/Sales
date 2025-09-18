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
  const [leaders, setLeaders] = useState([]); // 🟢 هخزن هنا leaderOptions
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchsales = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/sales/",
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

      // 🟢 خزن leaderOptions في state
      if (result.data.data.leaderOptions) {
        setLeaders(result.data.data.leaderOptions);
      }

      const formatted = result.data.data.sales.map((sale) => {
        return {
          id: sale._id,
          name: sale.name,
          email: sale.email,
          leader_id: sale.leader_id?._id || null,
          leader_name: sale.leader_id?.name || "—",
          status: sale.status || "Active",
        };
      });

      setsales(formatted);
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales data");
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

    const { id, name, email, leader_id } = selectedRow;

    const payload = {
      name: name || "",
      email: email || "",
      leader_id: leader_id || null,
    };

    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/sales/${id}`,
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
        toast.error("Failed to update sale!");
      }
    } catch (error) {
      console.error("Error updating sale:", error);
      toast.error("Error occurred while updating sale!");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/sales/${selectedRow.id}`,
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
        toast.error("Failed to delete sale!");
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("Error occurred while deleting sale!");
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;
    const statusValue = newStatus === 1 ? "Active" : "inactive";

    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/sales/${id}`,
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
        toast.success("Sale status updated successfully!");
        setsales((prevsales) =>
          prevsales.map((sale) =>
            sale.id === id ? { ...sale, status: statusValue } : sale
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to update sale status:", errorData);
        toast.error("Failed to update sale status!");
      }
    } catch (error) {
      console.error("Error updating sale status:", error);
      toast.error("Error occurred while updating sale status!");
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
    { key: "leader_name", label: "Leader" }, // 🟢 عرض اسم الـ Leader
    { key: "status", label: "Status" },
  ];

  const filterOptionsForsales = [
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
              placeholder="Enter sale name"
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

            {/* Leader Select */}
            <label htmlFor="leader" className="text-gray-400 !pb-3">
              Leader
            </label>
            <Select
              value={selectedRow?.leader_id || ""}
              onValueChange={(value) => onChange("leader_id", value)}
            >
              <SelectTrigger className="!my-2 text-bg-primary !p-4">
                <SelectValue placeholder="Select a leader" />
              </SelectTrigger>
              <SelectContent className="bg-white !p-2">
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

export default Sale;
