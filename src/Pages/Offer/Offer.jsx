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

// Helper function to format date for HTML date input
const formatDateForInput = (dateString) => {
  if (!dateString || dateString === "—") return "";
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return "";
    
    // Format to YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return "";
  }
};

const Offer = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [offers, setoffers] = useState([]);
  const [products, setproducts] = useState([]); // For product dropdown
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchoffers = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/offers/",
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

      const formatted = result.data.data.map((offer) => {
        return {
          id: offer._id,
          name: offer.name,
          description: offer.description || "—",
          start_date: offer.start_date ? formatDateForInput(offer.start_date) : "",
          end_date: offer.end_date ? formatDateForInput(offer.end_date) : "",
          discount_type: offer.discount_type || "—",
          discount_amount: offer.discount_amount || 0,
          subscription_details: offer.subscription_details || "—",
          product_name: offer.product_id?.name || "—",
          setup_phase: offer.setup_phase || "—",
          product_id: offer.product_id?._id || null,
        };
      });

      setoffers(formatted);
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast.error("Failed to load offers data");
    } finally {
      dispatch(hideLoader());
    }
  };

  // Fetch products for dropdown
  const fetchproducts = async () => {
    try {
      const response = await fetch(
        "https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/products/",
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
        console.log("products API response:", result); // للتحقق من البيانات

        // Handle different possible response structures
        let productsData = [];
        if (result.data && Array.isArray(result.data)) {
          productsData = result.data;
        } else if (
          result.data &&
          result.data.data &&
          Array.isArray(result.data.data)
        ) {
          productsData = result.data.data;
        } else if (Array.isArray(result)) {
          productsData = result;
        }

        setproducts(productsData);
        console.log("products set:", productsData);
      } else {
        console.error("Failed to fetch products:", response.status);
        // Set empty array if products API fails
        setproducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      // Set empty array if products API fails
      setproducts([]);
    }
  };

  useEffect(() => {
    fetchoffers();
    fetchproducts(); // تفعيل استدعاء الـ products
  }, []);

  const handleEdit = (offer) => {
    setSelectedRow(offer);
    setIsEditOpen(true);
  };

  const handleDelete = (offer) => {
    setSelectedRow(offer);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const {
      id,
      name,
      description,
      discount_type,
      discount_amount,
      subscription_details,
      setup_phase,
      start_date,
      end_date,
      product_id,
    } = selectedRow;

    const payload = {
      name: name || "",
      description: description || "",
      start_date: start_date || "",
      end_date: end_date || "",
      discount_type: discount_type || "",
      discount_amount: discount_amount || 0,
      subscription_details: subscription_details || "",
      setup_phase: setup_phase || "",
      product_id: product_id || null,
    };

    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/offers/${id}`,
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
        toast.success("Offer updated successfully!");
        await fetchoffers();
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);

        // Extract the error message properly
        const errorMessage =
          errorData?.error?.message ||
          errorData?.message ||
          errorData?.error?.details ||
          "Failed to update offer!";

        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error updating offer:", error);
      toast.error(error?.message || "Error occurred while updating offer!");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/offers/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Offer deleted successfully!");
        setoffers(offers.filter((offer) => offer.id !== selectedRow.id));
        setIsDeleteOpen(false);
      } else {
        const errorData = await response.json();
        console.error("Delete failed:", errorData);

        // Extract the error message properly
        const errorMessage =
          errorData?.error?.message ||
          errorData?.message ||
          errorData?.error?.details ||
          "Failed to delete offer!";

        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast.error(error?.message || "Error occurred while deleting offer!");
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
    { key: "description", label: "Description" },
    { key: "start_date", label: "Start Date" },
    { key: "end_date", label: "End Date" },
    { key: "discount_type", label: "Discount Type" },
    { key: "discount_amount", label: "Discount Amount" },
    { key: "subscription_details", label: "Subscription Details" },
    { key: "setup_phase", label: "Setup Phase" },
    { key: "product_name", label: "product Name" },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <DataTable
        data={offers}
        columns={columns}
        showAddButton={true}
        addRoute="/offer/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        showEditButton={true}
        showDeleteButton={true}
        showActions={true}
        showFilter={true}
        searchKeys={["name", "description", "product_name"]}
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
              placeholder="Enter offer name"
            />

            {/* Description */}
            <label htmlFor="description" className="text-gray-400 !pb-3">
              Description
            </label>
            <Input
              id="description"
              value={selectedRow?.description || ""}
              onChange={(e) => onChange("description", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
              placeholder="Enter offer description"
            />

            {/* باقي الحقول بشكل 2 في الصف */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-gray-400 !pb-3">Start Date</label>
                <Input
                  type="date"
                  value={selectedRow?.start_date || ""}
                  onChange={(e) => onChange("start_date", e.target.value)}
                  className="!my-2 text-bg-primary !p-4"
                />
              </div>
              <div>
                <label className="text-gray-400 !pb-3">End Date</label>
                <Input
                  type="date"
                  value={selectedRow?.end_date || ""}
                  onChange={(e) => onChange("end_date", e.target.value)}
                  className="!my-2 text-bg-primary !p-4"
                />
              </div>

              <div>
                <label className="text-gray-400 !pb-3">Discount Amount</label>
                <Input
                  type="number"
                  value={selectedRow?.discount_amount || 0}
                  onChange={(e) => onChange("discount_amount", e.target.value)}
                  className="!my-2 text-bg-primary !p-4"
                />
              </div>

              <div>
                <label className="text-gray-400 !pb-3">
                  Subscription Details
                </label>
                <Input
                  value={selectedRow?.subscription_details || ""}
                  onChange={(e) =>
                    onChange("subscription_details", e.target.value)
                  }
                  className="!my-2 text-bg-primary !p-4"
                />
              </div>
              <div>
                <label className="text-gray-400 !pb-3">Setup Phase</label>
                <Input
                  value={selectedRow?.setup_phase || ""}
                  onChange={(e) => onChange("setup_phase", e.target.value)}
                  className="!my-2 text-bg-primary !p-4"
                />
              </div>

              <div>
                <label htmlFor="discount_type" className="text-gray-400 !pb-3">
                  Discount Type
                </label>
                <Select
                  value={selectedRow?.discount_type || ""}
                  onValueChange={(value) => onChange("discount_type", value)}
                >
                  <SelectTrigger className="!my-2 text-bg-primary !p-4">
                    <SelectValue placeholder="Select discount_type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white !p-2">
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product field - Full width */}
            <div className="mt-4 w-full">
              <label htmlFor="product" className="text-gray-400 !pb-3 block">
                Product
              </label>
              <Select
                value={selectedRow?.product_id || ""}
                onValueChange={(value) => onChange("product_id", value)}
              >
                <SelectTrigger className="!my-2 text-bg-primary !p-4 w-full">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent className="bg-white !p-2">
                  {products.length > 0 ? (
                    products.map((product) => (
                      <SelectItem
                        key={product._id || product.id}
                        value={product._id || product.id}
                      >
                        {product.name} ({product.point || product.points || 0}{" "}
                        points)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No products available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
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

export default Offer;