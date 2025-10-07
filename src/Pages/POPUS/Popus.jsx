"use client";
import { useEffect, useState, useCallback } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditDialog from "@/components/EditDialog";
import DeleteDialog from "@/components/DeleteDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const Popup = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [Popups, setPopups] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [newImageBase64, setNewImageBase64] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(null);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // تحويل الملف إلى Base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) reject(new Error("No file provided"));
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 🔹 Fetch popups
  const fetchPopups = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://negotia.wegostation.com/api/admin/popup-offers/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) throw new Error("Failed to load popups");

      const result = await response.json();

      const formatted = result.data.map((popup) => {
        const createdDate = new Date(popup.created_at);
        const created_at = `${createdDate.getFullYear()}/${(
          createdDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${createdDate
          .getDate()
          .toString()
          .padStart(2, "0")}`;

        const logo = (
          <Avatar className="w-12 h-12 !m-auto">
            {popup.image ? (
              <AvatarImage src={popup.image} alt={popup.title} />
            ) : (
              <AvatarFallback>
                {popup.title?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        );

        return {
          id: popup._id,
          title: popup.title,
          status: popup.status ? "Active" : "Inactive",
          image: popup.image || "",
          link: popup.link,
          created_at,
          logo,
        };
      });

      setPopups(formatted);
    } catch (error) {
      console.error("Error fetching popups:", error);
      toast.error("Failed to load popups data");
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchPopups();
  }, []);

  const handleEdit = (popup) => {
    setSelectedRow(popup);
    setIsEditOpen(true);
    setNewImageBase64(null);
  };

  const handleDelete = (popup) => {
    setSelectedRow(popup);
    setIsDeleteOpen(true);
  };

  // ✅ رفع صورة جديدة
  const handleImageChange = useCallback(async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const base64String = await convertFileToBase64(file);
        setNewImageBase64(base64String);
        setSelectedRow((prev) => ({ ...prev, image: base64String }));
      } catch (error) {
        toast.error("Failed to process image file.", error);
        setNewImageBase64(null);
      }
    }
  }, []);

// ✅ تعديل بيانات popup
  const handleSave = async () => {
    if (!selectedRow) return;

    const { id, title, status, link } = selectedRow;

    const payload = {
      title: title || "",
      link: link || "",
      status: status === "Active" ? true : false,
    };

    // ✅ فقط أرسل الصورة إذا كانت Base64 جديدة
    if (newImageBase64) {
      payload.image = newImageBase64;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/popup-offers/${id}`,
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
        toast.success("Popup updated successfully!");
        await fetchPopups();
        setIsEditOpen(false);
        setSelectedRow(null);
        setNewImageBase64(null); // ✅ امسح الصورة الجديدة بعد الحفظ
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.message || "Failed to update popup!",
          errorData.message
        );
      }
    } catch (error) {
      toast.error(error.message || "Error while updating popup!");
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ حذف popup
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/popup-offers/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Popup deleted successfully!");
        setPopups(Popups.filter((p) => p.id !== selectedRow.id));
        setIsDeleteOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete popup!");
      }
    } catch (error) {
      toast.error(error.message || "Error while deleting popup!");
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ تبديل الحالة
  const handleToggleStatus = async (row) => {
    const { id } = row;
    const newStatus = row.status === "Active" ? false : true;

    setIsTogglingStatus(id);

    setPopups((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: newStatus ? "Active" : "Inactive" } : p
      )
    );

    try {
      const response = await fetch(
        `https://negotia.wegostation.com/api/admin/popup-offers/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) toast.success("Status updated successfully!");
      else {
        toast.error("Failed to update popup status!");
        fetchPopups(); // rollback
      }
    } catch (error) {
      toast.error("Error updating popup status!", error);
      fetchPopups();
    } finally {
      setIsTogglingStatus(null);
    }
  };

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({ ...prev, [key]: value }));
  };

  const columns = [
    { key: "title", label: "Title" },
    { key: "link", label: "Link" },

    { key: "logo", label: "Image" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={
            row.status === "Active"
              ? "text-green-600 font-medium"
              : "text-gray-500 font-medium"
          }
        >
          {row.status}
        </span>
      ),
      isToggle: true,
      toggleKey: "status",
    },
  ];

  const filterOptions = [
    {
      label: "Status",
      key: "status",
      options: [
        { value: "all", label: "All" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
    },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <DataTable
        data={Popups}
        columns={columns}
        showAddButton={true}
        addRoute="/pop/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showEditButton={true}
        showDeleteButton={true}
        showActions={true}
        showFilter={true}
        filterOptions={filterOptions}
        searchKeys={["title"]}
        isLoadingEdit={isSaving}
        isLoadingDelete={isDeleting}
        isTogglingStatus={isTogglingStatus}
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
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 block !mb-2">Popup Title</label>
                <Input
                  value={selectedRow?.title || ""}
                  onChange={(e) => onChange("title", e.target.value)}
                  placeholder="Enter popup title "
                  className={"!p-2"}
                />
              </div>
                            <div>
                <label className="text-gray-400 block !mb-2">Popup Link</label>
                <Input
                  value={selectedRow?.link || ""}
                  onChange={(e) => onChange("link", e.target.value)}
                  placeholder="Enter popup Link "
                  className={"!p-2"}
                />
              </div>

              <div>
                <label className="text-gray-400 block !mb-2">Popup Image</label>
                {selectedRow?.image && (
                  <div className="flex items-center gap-4 !mb-2">
                    <img
                      src={selectedRow.image}
                      alt="Popup"
                      className="w-12 h-12 rounded-md object-cover border"
                    />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSaving}
                  className={"!ps-2"}
                />
              </div>
            </div>
          </EditDialog>

          <DeleteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDelete={handleDeleteConfirm}
            name={selectedRow.title}
            isLoading={isDeleting}
          />
        </>
      )}
    </div>
  );
};

export default Popup;
