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
  const [salesOptions, setSalesOptions] = useState([]); // New state for Sales options
  const [activityOptions, setActivityOptions] = useState([]); // New state for Activity options
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

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

        return {
          id: lead._id,
          name: lead.name,
          phone: lead.phone,
          address: lead.address,
          type: lead.type || "—",
          status: lead.status || "intersted",
          activity_id: lead.activity_id?.name || "—",
          sales_id: lead.sales_id?.name || "—",
          transfer: lead.transfer ? "true" : "false",
          created_at,
          // Storing the actual IDs for a clean update process later
          sales_id_value: lead.sales_id?._id || undefined,
          activity_id_value: lead.activity_id?._id || undefined,
          source_id: lead.source_id?.name || "—",
        };
      });

      setleads(formatted);
      // **This is the main change** - storing the data from the API response
      setSalesOptions(result.data.data.SalesOptions);
      setActivityOptions(result.data.data.ActivityOptions);

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

  const handleEdit = (lead) => {
    // When editing, set the selected row and use the _id values for the Select components
    setSelectedRow({
      ...lead,
      sales_id: lead.sales_id_value,
      activity_id: lead.activity_id_value
    });
    setIsEditOpen(true);
  };

  const handleDelete = (lead) => {
    setSelectedRow(lead);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const { id, name, phone, password, address, status, sales_id, activity_id } =
      selectedRow;

    const payload = {
      name: name || "",
      phone: phone || "",
      status: status || "intersted",
      address: address || "",
      // Use the IDs from the state for the API call
      sales_id: sales_id || null,
      activity_id: activity_id || null,
    };

    if (password && password.trim()) {
      payload.password = password;
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
        toast.error("Failed to update lead!");
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Error occurred while updating lead!");
    }
    finally {
        // 2. تعطيل حالة التحميل بعد الانتهاء
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
        // 2. تعطيل حالة التحميل بعد الانتهاء
        setIsDeleting(false); 
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/leads/${row.id}`,
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
            lead.id === row.id ? { ...lead, status: newStatus } : lead
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

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address" },
    { key: "type", label: "Type" },
    { key: "activity_id", label: "Activity" },
    { key: "sales_id", label: "Sales" },
    { key: "transfer", label: "Transfer" },
    { key: "source_id", label: "Source" },
    { key: "status", label: "Status" },
  ];

  const filterOptionsForleads = [
    {
      label: "Status",
      key: "status",
      options: [
        { value: "all", label: "All" },
        { value: "intersted", label: "Interested" },
        { value: "negotiation", label: "Negotiation" },
        { value: "demo_request", label: "Demo Request" },
        { value: "demo_done", label: "Demo Done" },
        { value: "reject", label: "Reject" },
        { value: "approve", label: "Approve" },
      ],
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
        searchKeys={["name", "phone", "type", "target_name"]}
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
            <label htmlFor="name" className="text-gray-400 !pb-3">
              Name
            </label>
            <Input
              id="name"
              value={selectedRow?.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
              placeholder="Enter lead name"
            />

            <label htmlFor="phone" className="text-gray-400 !pb-3">
              Phone
            </label>
            <Input
              id="phone"
              type="phone"
              value={selectedRow?.phone || ""}
              onChange={(e) => onChange("phone", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
              placeholder="Enter phone address"
            />
            <label htmlFor="address" className="text-gray-400 !pb-3">
              Address
            </label>
            <Input
              id="address"
              type="address"
              value={selectedRow?.address || ""}
              onChange={(e) => onChange("address", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
              placeholder="Enter new address"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="type" className="text-gray-400 !pb-3">
                  Type
                </label>
                <Select
                  value={selectedRow?.type || undefined}
                  onValueChange={(value) => onChange("type", value)}
                >
                  <SelectTrigger className="!my-2 text-bg-primary !p-4">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white !p-2">
                    <SelectItem className="cursor-pointer" value="sales">
                      Sales
                    </SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* **Updated Sales Select component** */}
              <div>
                <label htmlFor="sales_id" className="text-gray-400 !pb-3">
                  Sales
                </label>
                <Select
                  value={selectedRow?.sales_id || undefined}
                  onValueChange={(value) => onChange("sales_id", value)}
                >
                  <SelectTrigger className="!my-2 text-bg-primary !p-4">
                    <SelectValue placeholder="Select sales" />
                  </SelectTrigger>
                  <SelectContent className="bg-white !p-2">
                    {salesOptions.length > 0 ? (
                      salesOptions.map((option) => (
                        <SelectItem
                          key={option._id}
                          value={option._id}
                        >
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

              {/* **New Activity Select component** */}
              <div>
                <label htmlFor="activity_id" className="text-gray-400 !pb-3">
                  Activity
                </label>
                <Select
                  value={selectedRow?.activity_id || undefined}
                  onValueChange={(value) => onChange("activity_id", value)}
                >
                  <SelectTrigger className="!my-2 text-bg-primary !p-4">
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent className="bg-white !p-2">
                    {activityOptions.length > 0 ? (
                      activityOptions.map((option) => (
                        <SelectItem
                          key={option._id}
                          value={option._id}
                        >
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