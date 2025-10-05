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

const Country = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [countries, setCountries] = useState([]);
  const token = localStorage.getItem("token");

  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // ✅ جلب الدول
  const fetchCountries = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/locations/countries",
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      const result = await response.json();

      const formatted = result.data.data.map((country) => ({
        id: country._id,
        name: country.name,
        code: country.code || "—",
      }));

      setCountries(formatted);
    } catch (error) {
      console.error("Error fetching countries:", error);
      toast.error("Failed to load countries data");
      setCountries([]);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  // ✅ تعديل
  const handleEdit = (country) => {
    setSelectedRow(country);
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;
    const { id, name, code } = selectedRow;

    const payload = { name, code };

    setIsSaving(true);
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/locations/countries/${id}`,
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
        toast.success("Country updated successfully!");
        await fetchCountries();
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update country!");
      }
    } catch (error) {
      console.error("Error updating country:", error);
      toast.error("Error occurred while updating country!");
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ حذف
  const handleDelete = (country) => {
    setSelectedRow(country);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/locations/countries/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Country deleted successfully!");
        setCountries(countries.filter((c) => c.id !== selectedRow.id));
        setIsDeleteOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete country!");
      }
    } catch (error) {
      console.error("Error deleting country:", error);
      toast.error("Error occurred while deleting country!");
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ تغيير القيم
  const onChange = (key, value) => {
    setSelectedRow((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // ✅ الأعمدة
  const columns = [
    { key: "name", label: "Country Name" },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />
      <DataTable
        data={countries}
        columns={columns}
        showAddButton={true}
        addRoute="/country/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        showEditButton={true}
        showDeleteButton={true}
        showActions={true}
        searchKeys={["name", "code"]}
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
            {/* Country Name */}
            <label htmlFor="name" className="text-gray-400 !pb-3">
              Country Name
            </label>
            <Input
              id="name"
              value={selectedRow?.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
              placeholder="Enter country name"
              disabled={isSaving}
            />


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

export default Country;
