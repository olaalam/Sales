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

const Lead = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [leads, setleads] = useState([]);
  const [salesOptions, setSalesOptions] = useState([]);
  const [activityOptions, setActivityOptions] = useState([]);
  const [sourceOptions, setSourceOptions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // Status options (corrected typo in "intersted" to "intersted")
  const statusOptions = [
    { value: "intersted", label: "intersted" },
    { value: "negotiation", label: "Negotiation" },
    { value: "demo_request", label: "Demo Request" },
    { value: "demo_done", label: "Demo Done" },
    { value: "reject", label: "Reject" },
    { value: "approve", label: "Approve" },
  ];

  // Fetch all data
// Replace your fetchleads function with this corrected version:

const fetchleads = async () => {
  dispatch(showLoader());
  try {
    const response = await fetch(
      "https://negotia.wegostation.com/api/admin/leads/",
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
    console.log("Full API response:", result);

    const formatted = result.data.data.leads.map((lead) => {
      const createdDate = new Date(lead.created_at);
      const created_at = `${createdDate.getFullYear()}/${(
        createdDate.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${createdDate
        .getDate()
        .toString()
        .padStart(2, "0")}`;

      // Create unified display key for City / Company
      const location_display =
        lead.country?.name && lead.city?.name
          ? `${lead.country.name} / ${lead.city.name}`
          : lead.country?.name || lead.city?.name || "—";

      return {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        type: lead.type || "—",
        status: lead.status || "intersted",
        
        // Display names for table
        activity_id: lead.activity?.name || "—",
        sales_id: lead.sales?.name || "—",
        source_id: lead.source?.name || "—",
        
        // Actual IDs for editing (FIXED HERE!)
        sales_id_value: lead.sales?.id || null,
        activity_id_value: lead.activity?.id || null,
        source_id_value: lead.source?.id || null,
        
        transfer: lead.transfer ? "true" : "false",
        created_at,
        
        // Country and City IDs (FIXED HERE!)
        country: lead.country?.id || null,
        city: lead.city?.id || null,
        city_name: lead.city?.name || "—",
        company: lead.company || null,
        location_display: location_display,
      };
    });

    setleads(formatted);
    setSalesOptions(result.data.data.SalesOptions);
    setActivityOptions(result.data.data.ActivityOptions);
    setSourceOptions(result.data.data.SourceOptions);
    setCountries(result.data.data.CountryOptions || []);
    setCities(result.data.data.CityOptions || []);
  } catch (error) {
    console.error("Error fetching leads:", error);
    toast.error("Failed to load leads data");
  } finally {
    dispatch(hideLoader());
  }
};

  useEffect(() => {
    fetchleads();
  }, []);

  // Update city list when country changes
  useEffect(() => {
    if (selectedRow?.country) {
      const filtered = cities.filter(
        (city) => city.country_id === Number(selectedRow.country)
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities([]);
    }
  }, [selectedRow?.country, cities]);


  // Handle status change in DataTable
  const handleToggleStatus = async (row, newStatus) => {
    const leadId = row.id;
    if (!leadId) {
      console.error("Lead ID not found:", row);
      toast.error("Lead ID not found!");
      return;
    }

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/leads/${leadId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        toast.success("Lead status updated successfully!");
        setleads((prev) =>
          prev.map((lead) =>
            (lead._id || lead.lead_id || lead.id) === leadId
              ? { ...lead, status: newStatus }
              : lead
          )
        );
      } else {
        toast.error("Failed to update lead status!");
      }
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast.error("Error occurred while updating lead status!");
    }
  };


  const handleEdit = (lead) => {
    setSelectedRow({
      ...lead,
      sales_id: lead.sales_id_value,
      activity_id: lead.activity_id_value,
      source_id: lead.source_id_value,
      country: lead.country,
      city: lead.city,
    });
    setIsEditOpen(true);
  };

  const handleDelete = (lead) => {
    setSelectedRow(lead);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const {
      id,
      name,
      phone,
      status,
      sales_id,
      activity_id,
      type,
      source_id,
      country,
      city,
    } = selectedRow;

    if (type === "company" && !source_id) {
      toast.error("Source is required for company type!");
      return;
    }

    const payload = {
      name: name || "",
      phone: phone || "",
      status: status || "intersted",
      type: type || "",
      sales_id: sales_id,
      activity_id: activity_id,
      source_id: source_id,
      country: String(country),
      city: String(city),
    };
    if (!country) {
      toast.error("Country is required!");
      return;
    }

    if (country && !city) {
      toast.error("City is required!");
      return;
    }

    console.log("Payload being sent:", payload);
    setIsSaving(true);
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/leads/${id}`,
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
        toast.success("Lead updated successfully!");
        await fetchleads();
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error(errorData.message || "Failed to update lead!");
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Error occurred while updating lead!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/leads/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Lead deleted successfully!");
        setleads(leads.filter((lead) => lead.id !== selectedRow.id));
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete lead!");
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Error occurred while deleting lead!");
    } finally {
      setIsDeleting(false);
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
    { key: "phone", label: "Phone" },
    { key: "location_display", label: "Country / City" },
    { key: "type", label: "Type" },
    { key: "activity_id", label: "Activity" }, // Ensured to display
    { key: "sales_id", label: "Sales" },      // Ensured to display
    { key: "source_id", label: "Source" },    // Ensured to display
    { key: "transfer", label: "Transfer" },
    { key: "status", label: "Status" },
  ];

  const filterOptionsForleads = [
    {
      label: "Status",
      key: "status",
      options: [{ value: "all", label: "All" }, ...statusOptions],
    },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <DataTable
        data={leads}
        columns={columns}
        showAddButton={true}
        addRoute="/lead/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showEditButton={true}
        showDeleteButton={true}
        showActions={true}
        showFilter={true}
        statusComponentType="select"
        filterOptions={filterOptionsForleads}
        searchKeys={["name", "phone", "type"]}
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
            {/* Basic info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="text-gray-400 block !pb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  value={selectedRow?.name || ""}
                  onChange={(e) => onChange("name", e.target.value)}
                  className="w-full !p-3 border border-teal-500 rounded-md text-black"
                  placeholder="Enter lead name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="text-gray-400 block !pb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={selectedRow?.phone || ""}
                  onChange={(e) => onChange("phone", e.target.value)}
                  className="w-full !p-3 border border-teal-500 rounded-md text-black"
                  placeholder="Enter phone"
                />
              </div>

              <div>
                <label htmlFor="type" className="text-gray-400 block !pb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedRow?.type || undefined}
                  onValueChange={(value) => onChange("type", value)}
                >
                  <SelectTrigger className="w-full !p-3 border border-teal-500 rounded-md text-black bg-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-teal-500 rounded-md !p-2">
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>


<div>
  <label htmlFor="sales_id" className="text-gray-400 block !pb-2">
    Sales
  </label>
  <Select
    value={selectedRow?.sales_id ? String(selectedRow.sales_id) : undefined}
    onValueChange={(value) => onChange("sales_id", Number(value))}
  >
    <SelectTrigger className="w-full !p-3 border border-teal-500 rounded-md text-black bg-white">
      <SelectValue placeholder="Select sales" />
    </SelectTrigger>
    <SelectContent className="bg-white border border-teal-500 rounded-md !p-2">
      {salesOptions.length > 0 ? (
        salesOptions.map((option) => (
          <SelectItem key={option.id} value={String(option.id)}>
            {option.name}
          </SelectItem>
        ))
      ) : (
        <SelectItem value="no-sales" disabled>
          No sales available
        </SelectItem>
      )}
    </SelectContent>
  </Select>
</div>

<div>
  <label htmlFor="activity_id" className="text-gray-400 block !pb-2">
    Activity
  </label>
  <Select
    value={selectedRow?.activity_id ? String(selectedRow.activity_id) : undefined}
    onValueChange={(value) => onChange("activity_id", Number(value))}
  >
    <SelectTrigger className="w-full !p-3 border border-teal-500 rounded-md text-black bg-white">
      <SelectValue placeholder="Select activity" />
    </SelectTrigger>
    <SelectContent className="bg-white border border-teal-500 rounded-md !p-2">
      {activityOptions.length > 0 ? (
        activityOptions.map((option) => (
          <SelectItem key={option.id} value={String(option.id)}>
            {option.name}
          </SelectItem>
        ))
      ) : (
        <SelectItem value="no-activities" disabled>
          No activities available
        </SelectItem>
      )}
    </SelectContent>
  </Select>
</div>

<div>
  <label htmlFor="source_id" className="text-gray-400 block !pb-2">
    Source <span className="text-red-500">*</span>
  </label>
  <Select
    value={selectedRow?.source_id ? String(selectedRow.source_id) : undefined}
    onValueChange={(value) => onChange("source_id", Number(value))}
  >
    <SelectTrigger className="w-full !p-3 border border-teal-500 rounded-md text-black bg-white">
      <SelectValue placeholder="Select source" />
    </SelectTrigger>
    <SelectContent className="bg-white border border-teal-500 rounded-md !p-2">
      {sourceOptions.length > 0 ? (
        sourceOptions.map((option) => (
          <SelectItem key={option.id} value={String(option.id)}>
            {option.name}
          </SelectItem>
        ))
      ) : (
        <SelectItem value="no-sources" disabled>
          No sources available
        </SelectItem>
      )}
    </SelectContent>
  </Select>
</div>

<div>
  <label htmlFor="country" className="text-gray-400 block !pb-2">
    Country <span className="text-red-500">*</span>
  </label>
  <Select
    value={selectedRow?.country ? String(selectedRow.country) : undefined}
    onValueChange={(value) => {
      onChange("country", Number(value));
      onChange("city", null);
    }}
  >
    <SelectTrigger className="w-full !p-3 border border-teal-500 rounded-md text-black bg-white">
      <SelectValue placeholder="Select country" />
    </SelectTrigger>
    <SelectContent className="bg-white border border-teal-500 rounded-md !p-2">
      {countries.length > 0 ? (
        countries.map((country) => (
          <SelectItem key={country.id} value={String(country.id)}>
            {country.name}
          </SelectItem>
        ))
      ) : (
        <SelectItem value="no-country" disabled>
          No countries available
        </SelectItem>
      )}
    </SelectContent>
  </Select>
</div>

<div>
  <label htmlFor="city" className="text-gray-400 block !pb-2">
    City <span className="text-red-500">*</span>
  </label>
  <Select
    value={selectedRow?.city ? String(selectedRow.city) : undefined}
    onValueChange={(value) => onChange("city", Number(value))}
    disabled={!selectedRow?.country}
  >
    <SelectTrigger className="w-full !p-3 border border-teal-500 rounded-md text-black bg-white">
      <SelectValue
        placeholder={
          selectedRow?.country ? "Select city" : "Select country first"
        }
      />
    </SelectTrigger>
    <SelectContent className="bg-white border border-teal-500 rounded-md !p-2">
      {filteredCities.length > 0 ? (
        filteredCities.map((city) => (
          <SelectItem key={city.id} value={String(city.id)}>
            {city.name}
          </SelectItem>
        ))
      ) : (
        <SelectItem value="no-city" disabled>
          No cities available
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
            isLoading={isDeleting}
          />
        </>
      )}
    </div>
  );
};

export default Lead;