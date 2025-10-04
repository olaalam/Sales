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


const Product = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [products, setproducts] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // Fetch products for dropdown
  const fetchproducts = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/products/",
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
        console.log("products API response:", result);

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

        // تحويل _id إلى id للتوافق مع باقي الكود
        const formattedproducts = productsData.map(product => ({
          ...product,
          id: product._id || product.id,
          // تأكد من وجود البيانات المطلوبة
          name: product.name || "",
          description: product.description || "",
          price_month: product.price_month || 0,
          price_quarter: product.price_quarter || 0,
          price_year: product.price_year || 0,
          setup_fees: product.setup_fees || 0,
          status: product.status || "Active"
        }));

        setproducts(formattedproducts);
        console.log("products set:", formattedproducts);
      } else {
        console.error("Failed to fetch products:", response.status);
        toast.error("Failed to fetch products!");
        setproducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error occurred while fetching products!");
      setproducts([]);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchproducts();
  }, []);

  const handleEdit = (product) => {
    // تأكد من أن البيانات كاملة قبل فتح ال dialog
    const completeproduct = {
      ...product,
      name: product.name || "",
      description: product.description || "",
      price_month: product.price_month || 0,
      price_quarter: product.price_quarter || 0,
      price_year: product.price_year || 0,
      setup_fees: product.setup_fees || 0,
      status: product.status || "Active"
    };
    
    console.log("Editing product:", completeproduct);
    setSelectedRow(completeproduct);
    setIsEditOpen(true);
  };

  const handleDelete = (product) => {
    setSelectedRow(product);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const { id, name,description,price_month,price_quarter,price_year,setup_fees, status } = selectedRow;

    // بناء الـ payload للـ products
const payload = {
  name: name || "",
  description: description || "",
  price_month: parseFloat(price_month) || 0,
  price_quarter: parseFloat(price_quarter) || 0,
  price_year: parseFloat(price_year) || 0,
  setup_fees: parseFloat(setup_fees) || 0,
  status: status === "Active" || status === true ? true : false,
};


    console.log("Payload being sent:", payload);

    dispatch(showLoader());
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/products/${id}`,
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
        toast.success("product updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        await fetchproducts(); // إعادة جلب البيانات
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error(errorData.message || "Failed to update product!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Error occurred while updating product!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleDeleteConfirm = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/products/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("product deleted successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        setproducts(products.filter((product) => product.id !== selectedRow.id));
        setIsDeleteOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete product!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error occurred while deleting product!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      dispatch(hideLoader());
    }
  };


 const handleToggleStatus = async (row) => {
 const { id, status: currentStatusString } = row;


 const isCurrentlyActive = currentStatusString === "Active";
 const newStatusBoolean = !isCurrentlyActive; 

 const newStatusString = newStatusBoolean ? "Active" : "inactive";

 const oldStatusString = currentStatusString;

 setproducts((prevproducts) =>
 prevproducts.map((product) =>
 product.id === id ? { ...product, status: newStatusString } : product
 )
 );

 dispatch(showLoader());
 try {
 const response = await fetch(
 `https://negotia.wegostation.com/api/admin/products/${id}`,
 {
  method: "PUT",
  headers: {
  "Content-Type": "application/json",
  ...getAuthHeaders(),
  },
  // 💡 تصحيح: إرسال القيمة المنطقية
  body: JSON.stringify({ status: newStatusBoolean }), // ⬅️ تم التعديل هنا
 }
 );

 if (response.ok) {
 toast.success("product status updated successfully!", {
  position: "top-right",
  autoClose: 3000,
 });
 // إذا نجح الطلب، لا داعي للتحديث المحلي مجدداً فقد تم في الخطوة التفاؤلية
 } else {
 const errorData = await response.json();
 console.error("Failed to update product status:", errorData);
 toast.error(errorData.message || "Failed to update product status!", {
  position: "top-right",
  autoClose: 3000,
 });
 // التراجع (Rollback) في حالة الخطأ
 setproducts((prevproducts) =>
  prevproducts.map((product) =>
  product.id === id ? { ...product, status: oldStatusString } : product
  )
 );
 }
 } catch (error) {
 console.error("Error updating product status:", error);
 toast.error("Error occurred while updating product status!", {
 position: "top-right",
 autoClose: 3000,
 });
 // التراجع (Rollback) في حالة الخطأ
 setproducts((prevproducts) =>
 prevproducts.map((product) =>
  product.id === id ? { ...product, status: oldStatusString } : product
 )
 );
 } finally {
 dispatch(hideLoader());
 }
 };

  const onChange = (key, value) => {
    console.log(`Changing ${key} to:`, value);
    setSelectedRow((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const columns = [
    { key: "name", label: "product Name" },
    { key: "description", label: "Description" },
    { key: "price_month", label: "Price month" },
    { key: "price_quarter", label: "Price quarter" },
    { key: "price_year", label: "Price Yearly" },
    { key: "setup_fees", label: "Setup Fees" },
    { key: "status", label: "Status" },
  ];

  const filterOptionsForproducts = [
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
    <>
      <div className="p-4">
        {isLoading && <FullPageLoader />}

        <DataTable
          data={products}
          columns={columns}
          showAddButton={true}
          addRoute="/product/add"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          showEditButton={true}
          showDeleteButton={true}
          showActions={true}
          showFilter={true}
          filterOptions={filterOptionsForproducts}
          searchKeys={["name"]} // مُصحح من product_name إلى name
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
              {/* product Name Field */}
              <div className="!mb-4">
                <label htmlFor="name" className="block text-gray-400 !mb-2">
                  product Name
                </label>
                <Input
                  id="name"
                  value={selectedRow?.name || ""}
                  onChange={(e) => onChange("name",  e.target.value)}
                  className="text-bg-primary !p-4"
                  placeholder="Enter product name"
                />
              </div>

              {/* product description Field */}
              <div className="!mb-4">
                <label htmlFor="description" className="block text-gray-400 !mb-2">
                  product description
                </label>
                <Input
                  id="description"
                  type="text"
                  value={selectedRow?.description || 0}
                  onChange={(e) => onChange("description",  e.target.value)}
                  className="text-bg-primary !p-4"
                  placeholder="Enter product description"
                  min="0"
                />
              </div>

              {/* product price_month Field */}
              <div className="!mb-4">
                <label htmlFor="price_month" className="block text-gray-400 !mb-2"> 
                  product Price month
                </label>
                <Input
                  id="price_month"
                  type="number"
                  value={selectedRow?.price_month || 0} 
                  onChange={(e) => onChange("price_month",  parseFloat(e.target.value) || 0)}
                  className="text-bg-primary !p-4"
                  placeholder="Enter product price month"
                  min="0"
                />
              </div>  
              {/* product price_quarter Field */}
              <div className="!mb-4">
                <label htmlFor="price_quarter" className="block text-gray-400 !mb-2">
                  product Price quarter
                </label>
                <Input
                  id="price_quarter"
                  type="number"
                  value={selectedRow?.price_quarter || 0}
                  onChange={(e) => onChange("price_quarter",  parseFloat(e.target.value) || 0)}
                  className="text-bg-primary !p-4"
                  placeholder="Enter product price quarter"
                  min="0"
                />
              </div>
              {/* product price_year Field */}
              <div className="!mb-4">
                <label htmlFor="price_year" className="block text-gray-400 !mb-2">
                  product Price Yearly
                </label>
                <Input
                  id="price_year"
                  type="number"
                  value={selectedRow?.price_year || 0}
                  onChange={(e) => onChange("price_year",  parseFloat(e.target.value) || 0)}
                  className="text-bg-primary !p-4"
                  placeholder="Enter product price yearly"
                  min="0"
                />
              </div>
              {/* product setup_fees Field */}
              <div className="!mb-4">
                <label htmlFor="setup_fees" className="block text-gray-400 !mb-2">
                  product Setup Fees
                </label>
                <Input
                  id="setup_fees"
                  type="number"
                  value={selectedRow?.setup_fees || 0}
                  onChange={(e) => onChange("setup_fees",  parseFloat(e.target.value) || 0)}
                  className="text-bg-primary !p-4"
                  placeholder="Enter product setup fees"
                  min="0"
                />
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
      
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        style={{ zIndex: 9999 }}
      />
    </>
  );
};

export default Product;