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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const SalesManagement = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [salesManagements, setsalesManagements] = useState([]);
  const [leadOptions, setLeadOptions] = useState([]);
  const [salesOptions, setSalesOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [offerOptions, setOfferOptions] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [pointsValue, setPointsValue] = useState("");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchsalesManagements = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/sales-management/",
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

      const formatted = result.data.data.sales.map((sale) => {
        const saleDate = new Date(sale.sale_date);
        const sale_date = `${saleDate.getFullYear()}/${(saleDate.getMonth() + 1).toString().padStart(2, "0")}/${saleDate.getDate().toString().padStart(2, "0")}`;

        return {
          id: sale.id,
          lead_id: sale.lead?.name || "—",
          sales_id: sale.salesUser?.name || "—",
          product_id: sale.product?.name || "—",
          offer_id: sale.offer?.name || "—",
          item_type: sale.item_type || "—",
          status: sale.status || "Pending",
          sale_date,
          // تخزين الـ IDs الفعلية
          lead_id_value: sale.lead?.id || null,
          sales_id_value: sale.salesUser?.id || null,
          product_id_value: sale.product?.id || null,
          offer_id_value: sale.offer?.id || null,
        };
      });

      setsalesManagements(formatted);
      setLeadOptions(result.data.data.leadOptions || []);
      setSalesOptions(result.data.data.salesOptions || []);
      setProductOptions(result.data.data.productOptions || []);
      setOfferOptions(result.data.data.offerOptions || []);
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales data");
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchsalesManagements();
  }, []);

  const handleEdit = (sale) => {
    setSelectedRow({
      ...sale,
      lead_id: sale.lead_id_value,
      sales_id: sale.sales_id_value,
      product_id: sale.product_id_value,
      offer_id: sale.offer_id_value,
    });
    setIsEditOpen(true);
  };

  const handleDelete = (sale) => {
    setSelectedRow(sale);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const { id, lead_id, sales_id, item_type, status, product_id, offer_id } = selectedRow;

    const payload = {
      item_type: item_type || "Product",
      status: status || "Pending",
    };

    if (lead_id) payload.lead_id = lead_id;
    if (sales_id) payload.sales_id = sales_id;

    if (item_type === "Product") {
      if (product_id) payload.product_id = product_id;
    } else if (item_type === "Offer") {
      if (offer_id) payload.offer_id = offer_id;
    }

    console.log("Payload being sent:", payload);
    setIsSaving(true);

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/sales-management/${id}`,
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
        await fetchsalesManagements();
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
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/sales-management/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Sale deleted successfully!");
        setsalesManagements(
          salesManagements.filter((sale) => sale.id !== selectedRow.id)
        );
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete sale!");
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("Error occurred while deleting sale!");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    setSelectedRow(row);

    if (newStatus === "Approve") {
      setIsApproveOpen(true);
    } else {
      try {
        const response = await fetch(
          `https://negotia.wegostation.com/api/admin/sales-management/${row.id}`,
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
          toast.success("Sale status updated successfully!");
          setsalesManagements((prev) =>
            prev.map((sale) =>
              sale.id === row.id ? { ...sale, status: newStatus } : sale
            )
          );
        } else {
          toast.error("Failed to update sale status!");
        }
      } catch (error) {
        console.error("Error updating sale status:", error);
        toast.error("Error occurred while updating sale status!");
      }
    }
  };

  const handleApproveAndSendPoints = async () => {
    if (!selectedRow || !pointsValue || isNaN(parseInt(pointsValue)) || parseInt(pointsValue) <= 0) {
      toast.error("Please enter a valid number of points greater than zero.");
      return;
    }

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/approve-sale/${selectedRow.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ points: parseInt(pointsValue) }),
        }
      );

      if (response.ok) {
        toast.success("Sale approved and points awarded successfully!");
        setsalesManagements((prev) =>
          prev.map((sale) =>
            sale.id === selectedRow.id ? { ...sale, status: "Approve" } : sale
          )
        );
        setIsApproveOpen(false);
        setPointsValue("");
      } else {
        const errorData = await response.json();
        console.error("Approval failed:", errorData);
        toast.error("Failed to approve sale!");
      }
    } catch (error) {
      console.error("Error approving sale:", error);
      toast.error("Error occurred while approving sale!");
    }
  };

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const columns = [
    { key: "lead_id", label: "Lead" },
    { key: "sales_id", label: "Sales Person" },
    { key: "product_id", label: "Product" },
    { key: "offer_id", label: "Offer" },
    { key: "item_type", label: "Item Type" },
    { key: "status", label: "Status" },
    { key: "sale_date", label: "Sale Date" },
  ];

  const filterOptionsForSales = [
    {
      label: "Status",
      key: "status",
      options: [
        { value: "Pending", label: "Pending" },
        { value: "Approve", label: "Approve" },
        { value: "Reject", label: "Reject" },
      ],
    },
    {
      label: "Item Type",
      key: "item_type",
      options: [
        { value: "Product", label: "Product" },
        { value: "Offer", label: "Offer" },
      ],
    },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <DataTable
        data={salesManagements}
        columns={columns}
        showAddButton={true}
        addRoute="/sales-management/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showEditButton={true}
        showDeleteButton={true}
        showActions={true}
        showFilter={true}
        statusComponentType="select"
        filterOptions={filterOptionsForSales}
        searchKeys={["lead_id", "sales_id", "product_id", "item_type"]}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lead_id" className="text-gray-400 !pb-3">
                  Lead
                </label>
                <Select
                  value={selectedRow?.lead_id ? String(selectedRow.lead_id) : undefined}
                  onValueChange={(value) => onChange("lead_id", parseInt(value))}
                >
                  <SelectTrigger className="!my-2 text-bg-primary !p-4 w-full">
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent className="bg-white !p-2">
                    {leadOptions.length > 0 ? (
                      leadOptions.map((option) => (
                        <SelectItem
                          key={option.id}
                          value={String(option.id)}
                          className="cursor-pointer"
                        >
                          {option.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-leads" disabled>
                        No leads available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="sales_id" className="text-gray-400 !pb-3">
                  Sales Person
                </label>
                <Select
                  value={selectedRow?.sales_id ? String(selectedRow.sales_id) : undefined}
                  onValueChange={(value) => onChange("sales_id", parseInt(value))}
                >
                  <SelectTrigger className="!my-2 text-bg-primary !p-4 w-full">
                    <SelectValue placeholder="Select sales person" />
                  </SelectTrigger>
                  <SelectContent className="bg-white !p-2">
                    {salesOptions.length > 0 ? (
                      salesOptions.map((option) => (
                        <SelectItem
                          key={option.id}
                          value={String(option.id)}
                          className="cursor-pointer"
                        >
                          {option.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-sales" disabled>
                        No sales persons available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="item_type" className="text-gray-400 !pb-3">
                  Item Type
                </label>
                <Select
                  value={selectedRow?.item_type || undefined}
                  onValueChange={(value) => onChange("item_type", value)}
                >
                  <SelectTrigger className="!my-2 text-bg-primary !p-4 w-full">
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white !p-2">
                    <SelectItem className="cursor-pointer" value="Product">
                      Product
                    </SelectItem>
                    <SelectItem className="cursor-pointer" value="Offer">
                      Offer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedRow?.item_type === "Product" ? (
                <div>
                  <label htmlFor="product_id" className="text-gray-400 !pb-3">
                    Product
                  </label>
                  <Select
                    value={selectedRow?.product_id ? String(selectedRow.product_id) : undefined}
                    onValueChange={(value) => onChange("product_id", parseInt(value))}
                  >
                    <SelectTrigger className="!my-2 text-bg-primary !p-4 w-full">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent className="bg-white !p-2">
                      {productOptions.length > 0 ? (
                        productOptions.map((option) => (
                          <SelectItem
                            key={option.id}
                            value={String(option.id)}
                            className="cursor-pointer"
                          >
                            {option.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-products" disabled>
                          No products available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <label htmlFor="offer_id" className="text-gray-400 !pb-3">
                    Offer
                  </label>
                  <Select
                    value={selectedRow?.offer_id ? String(selectedRow.offer_id) : undefined}
                    onValueChange={(value) => onChange("offer_id", parseInt(value))}
                  >
                    <SelectTrigger className="!my-2 text-bg-primary !p-4">
                      <SelectValue placeholder="Select offer" />
                    </SelectTrigger>
                    <SelectContent className="bg-white !p-2">
                      {offerOptions.length > 0 ? (
                        offerOptions.map((option) => (
                          <SelectItem
                            key={option.id}
                            value={String(option.id)}
                            className="cursor-pointer"
                          >
                            {option.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-offers" disabled>
                          No offers available
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
            isLoading={isDeleting}
            name={selectedRow.lead_id || `Sale ${selectedRow.id}`}
          />
        </>
      )}

      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white !p-5 rounded-lg shadow-lg">
          <DialogHeader className="!pb-4 border-b border-gray-200">
            <DialogTitle className="text-2xl font-extrabold text-bg-primary">Approve Sale</DialogTitle>
            <DialogDescription className="text-gray-600 text-base !mt-2">
              Enter the number of points to award for this sale.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 !py-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="points" className="text-lg font-semibold text-bg-primary w-24 text-right">
                Points
              </Label>
              <Input
                id="points"
                type="number"
                value={pointsValue}
                onChange={(e) => setPointsValue(e.target.value)}
                className="flex-1 h-12 rounded-md border border-gray-300 focus:ring-2 focus:ring-bg-primary focus:border-transparent transition-all duration-200 !px-4"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-3 !pt-4 border-t border-gray-200">
            <Button
              className="!px-6 !py-3 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
              variant="outline"
              onClick={() => setIsApproveOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="!px-6 !py-3 rounded-md bg-bg-primary hover:bg-teal-600 text-white font-semibold transition-colors duration-200 cursor-pointer"
              type="button"
              onClick={handleApproveAndSendPoints}
              disabled={
                !pointsValue ||
                isNaN(parseInt(pointsValue)) ||
                parseInt(pointsValue) <= 0
              }
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesManagement;