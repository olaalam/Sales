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

const City = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [cities, setCities] = useState([]);
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

  // ✅ جلب المدن
  const fetchCities = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/locations/cities",
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      const result = await response.json();

      const formatted = result.data.data.map((city) => ({
        id: city._id,
        name: city.name,
        country_id: city.country?._id || "",
        country_name: city.country?.name || "—",
      }));

      setCities(formatted);
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast.error("Failed to load cities data");
      setCities([]);
    } finally {
      dispatch(hideLoader());
    }
  };

  // ✅ جلب الدول
  const fetchCountries = async () => {
    try {
      const res = await fetch(
        "https://negotia.wegostation.com/api/admin/locations/countries",
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      const data = await res.json();
      setCountries(data.data.data || []);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  useEffect(() => {
    fetchCities();
    fetchCountries();
  }, []);

  // ✅ تعديل
  const handleEdit = (city) => {
    setSelectedRow(city);
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;
    const { id, name, country_id } = selectedRow;

    const payload = {
      name,
      country: country_id,
    };

    setIsSaving(true);
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/locations/cities/${id}`,
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
        toast.success("City updated successfully!");
        await fetchCities();
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update city!");
      }
    } catch (error) {
      console.error("Error updating city:", error);
      toast.error("Error occurred while updating city!");
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ حذف
  const handleDelete = (city) => {
    setSelectedRow(city);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/locations/cities/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("City deleted successfully!");
        setCities(cities.filter((city) => city.id !== selectedRow.id));
        setIsDeleteOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete city!");
      }
    } catch (error) {
      console.error("Error deleting city:", error);
      toast.error("Error occurred while deleting city!");
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
    { key: "name", label: "City Name" },
    { key: "country_name", label: "Country" },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />
      <DataTable
        data={cities}
        columns={columns}
        showAddButton={true}
        addRoute="/city/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        showEditButton={true}
        showDeleteButton={true}
        showActions={true}
        searchKeys={["name", "country_name"]}
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
            {/* City Name */}
            <label htmlFor="name" className="text-gray-400 !pb-3">
              City Name
            </label>
            <Input
              id="name"
              value={selectedRow?.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
              placeholder="Enter city name"
              disabled={isSaving}
            />

            {/* Country Select */}
            <label htmlFor="country" className="text-gray-400 !pb-3">
              Country
            </label>
            <Select
              value={selectedRow?.country_id || ""}
              onValueChange={(value) => onChange("country_id", value)}
              disabled={isSaving}
            >
              <SelectTrigger className="!my-2 text-bg-primary !p-4">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent className="bg-white !p-2">
                {countries.map((country) => (
                  <SelectItem key={country._id} value={country._id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

export default City;
