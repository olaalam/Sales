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

const Commission = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [commissions, setcommissions] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // Fetch commissions for dropdown
  const fetchcommissions = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/commissions/",
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
        console.log("commissions API response:", result);

        // Handle different possible response structures
        let commissionsData = [];
        if (result.data && Array.isArray(result.data)) {
          commissionsData = result.data;
        } else if (
          result.data &&
          result.data.data &&
          Array.isArray(result.data.data)
        ) {
          commissionsData = result.data.data;
        } else if (Array.isArray(result)) {
          commissionsData = result;
        }

        // تحويل _id إلى id للتوافق مع باقي الكود
        const formattedcommissions = commissionsData.map((commission) => ({
          ...commission,
          id: commission._id || commission.id,
          // تأكد من وجود البيانات المطلوبة
          name: commission.level_name || "",
          type: commission.type || "",
          amount: commission.amount || 0,
          price_quarter: commission.point_threshold || 0,
        }));

        setcommissions(formattedcommissions);
        console.log("commissions set:", formattedcommissions);
      } else {
        console.error("Failed to fetch commissions:", response.status);
        toast.error("Failed to fetch commissions!");
        setcommissions([]);
      }
    } catch (error) {
      console.error("Error fetching commissions:", error);
      toast.error("Error occurred while fetching commissions!");
      setcommissions([]);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchcommissions();
  }, []);

  const handleEdit = (commission) => {
    // تأكد من أن البيانات كاملة قبل فتح ال dialog
    const completecommission = {
      ...commission,
      id: commission._id || commission.id,
      // تأكد من وجود البيانات المطلوبة
      level_name: commission.level_name || "",
      type: commission.type || "",
      amount: commission.amount || 0,
      price_quarter: commission.point_threshold || 0,
    };

    console.log("Editing commission:", completecommission);
    setSelectedRow(completecommission);
    setIsEditOpen(true);
  };

  const handleDelete = (commission) => {
    setSelectedRow(commission);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const { id, level_name, type, amount, point_threshold } = selectedRow;

    // بناء الـ payload للـ commissions
    const payload = {
      level_name: level_name || "",
      type: type || "",
      amount: parseFloat(amount) || 0,
      point_threshold: parseFloat(point_threshold) || 0,
    };

    console.log("Payload being sent:", payload);

    dispatch(showLoader());
    try {
      const response = await fetch(
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/commissions/${id}`,
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
        toast.success("commission updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        await fetchcommissions(); // إعادة جلب البيانات
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error(errorData.message || "Failed to update commission!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating commission:", error);
      toast.error("Error occurred while updating commission!", {
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
        `https://qpjgfr5x-3000.uks1.devtunnels.ms/api/admin/commissions/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("commission deleted successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        setcommissions(
          commissions.filter((commission) => commission.id !== selectedRow.id)
        );
        setIsDeleteOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete commission!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error deleting commission:", error);
      toast.error("Error occurred while deleting commission!", {
        position: "top-right",
        autoClose: 3000,
      });
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
    { key: "name", label: "Level Name" },
    { key: "type", label: "Type" },
    { key: "amount", label: "Amount" },
    { key: "point_threshold", label: "Point Threshold" },
  ];

  return (
    <>
      <div className="p-4">
        {isLoading && <FullPageLoader />}

        <DataTable
          data={commissions}
          columns={columns}
          showAddButton={true}
          addRoute="/commission/add"
          onEdit={handleEdit}
          onDelete={handleDelete}
          showEditButton={true}
          showDeleteButton={true}
          showActions={true}
          showFilter={true}
          searchKeys={["name"]} // مُصحح من commission_name إلى name
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
              {/* commission Name Field */}
              <div className="!mb-4">
                <label
                  htmlFor="level_name"
                  className="block text-gray-400 !mb-2"
                >
                  Level Name
                </label>
                <Input
                  id="level_name"
                  value={selectedRow?.level_name || ""}
                  onChange={(e) => onChange("level_name", e.target.value)}
                  className="text-bg-primary !p-4"
                  placeholder="Enter level name"
                />
              </div>

              {/* commission description Field */}
              <div className="!mb-4">
                <label htmlFor="type" className="block text-gray-400 !mb-2">
                  commission type
                </label>
                <Input
                  id="type"
                  type="text"
                  value={selectedRow?.type || 0}
                  onChange={(e) => onChange("type", e.target.value)}
                  className="text-bg-primary !p-4"
                  placeholder="Enter commission type"
                  min="0"
                />
              </div>

              {/* commission price_month Field */}
              <div className="!mb-4">
                <label htmlFor="amount" className="block text-gray-400 !mb-2">
                  Amount
                </label>
                <Input
                  id="amount"
                  type="number"
                  value={selectedRow?.amount || 0}
                  onChange={(e) =>
                    onChange("amount", parseFloat(e.target.value) || 0)
                  }
                  className="text-bg-primary !p-4"
                  placeholder="Enter Amount"
                  min="0"
                />
              </div>
              {/* commission price_quarter Field */}
              <div className="!mb-4">
                <label
                  htmlFor="point_threshold"
                  className="block text-gray-400 !mb-2"
                >
                  point_threshold
                </label>
                <Input
                  id="point_threshold"
                  type="number"
                  value={selectedRow?.point_threshold || 0}
                  onChange={(e) =>
                    onChange("point_threshold", parseFloat(e.target.value) || 0)
                  }
                  className="text-bg-primary !p-4"
                  placeholder="Enter point_threshold"
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

export default Commission;
