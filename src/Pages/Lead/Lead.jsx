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
  const [sourceOptions, setSourceOptions] = useState([]); // ✅ Source options
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
          type: lead.type || "—",
          status: lead.status || "intersted",
          activity_id: lead.activity_id?.name || "—",
          sales_id: lead.sales_id?.name || "—",
          transfer: lead.transfer ? "true" : "false",
          created_at,
          sales_id_value: lead.sales_id?._id || undefined,
          activity_id_value: lead.activity_id?._id || undefined,
          source_id: lead.source_id?.name || "—",
          source_id_value: lead.source_id?._id || undefined, // ✅
        };
      });

      setleads(formatted);
      setSalesOptions(result.data.data.SalesOptions);
      setActivityOptions(result.data.data.ActivityOptions);
      setSourceOptions(result.data.data.SourceOptions); // ✅
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
    setSelectedRow({
      ...lead,
      sales_id: lead.sales_id_value,
      activity_id: lead.activity_id_value,
      source_id: lead.source_id_value,
    });
    setIsEditOpen(true);
  };

  const handleDelete = (lead) => {
    setSelectedRow(lead);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const { id, name, phone, status, sales_id, activity_id, type, source_id } =
      selectedRow;

    // ✅ Validation: if company, source_id required
    if (type === "company" && !source_id) {
      toast.error("Source is required for company type!");
      return;
    }

    const payload = {
      name: name || "",
      phone: phone || "",
      status: status || "intersted",
      sales_id: sales_id || null,
      activity_id: activity_id || null,
      type: type || "",
      source_id: type === "company" ? source_id : null, // ✅ only send if company
    };

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
              placeholder="Enter phone"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type */}
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
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sales */}
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
                        <SelectItem key={option._id} value={option._id}>
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

              {/* Activity */}
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
                        <SelectItem key={option._id} value={option._id}>
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

              {/* ✅ Show Source only if type = company */}
              {selectedRow?.type === "company" && (
                <div className="md:col-span-3">
                  <label htmlFor="source_id" className="text-gray-400 !pb-3">
                    Source <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={selectedRow?.source_id || undefined}
                    onValueChange={(value) => onChange("source_id", value)}
                  >
                    <SelectTrigger className="!my-2 text-bg-primary !p-4">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="bg-white !p-2">
                      {sourceOptions.length > 0 ? (
                        sourceOptions.map((option) => (
                          <SelectItem key={option._id} value={option._id}>
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
              )}
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
