"use client";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash, Plus, CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import clsx from "clsx";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function DataTable({
  data,
  columns,
  addRoute,
  onAdd,
  onEdit,
  onDelete,
  onToggleStatus,
  showAddButton = true,
  showDeleteButtonInHeader = false,
  onDeleteInHeader,
  showRowSelection = false,
  showFilter = true,
  showActions = true,
  showEditButton = true,
  showDeleteButton = true,
  searchKeys = [],
  onAddClick,
  filterOptions = [],
  initialPage = 1,
  defaultAddSubscriberType = null,
  statusComponentType = "switch",
}) {
  const [searchValue, setSearchValue] = useState("");
  const [activeFilters, setActiveFilters] = useState(() => {
    const initialFilters = {};
    filterOptions.forEach((group) => {
      initialFilters[group.key] = "all";
    });
    return initialFilters;
  });
  const [selectedRows, setSelectedRows] = useState([]);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(Math.max(1, initialPage));
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(Math.max(1, initialPage));
  }, [initialPage]);

  const getNestedValue = (obj, path) => {
    return path
      .split(".")
      .reduce((acc, part) => (acc ? acc[part] : undefined), obj);
  };

  const filteredData = useMemo(() => {
    let currentData = data;

    if (searchValue) {
      const lowerCaseSearchValue = searchValue.toLowerCase();
      currentData = currentData.filter((row) => {
        const matches = searchKeys.some((key) => {
          const value = getNestedValue(row, key);

          if (
            value === null ||
            value === undefined ||
            typeof value === "object"
          ) {
            return false;
          }

          const searchableString = String(value).toLowerCase();
          const isMatch = searchableString.includes(lowerCaseSearchValue);

          return isMatch;
        });
        return matches;
      });
    }

    Object.entries(activeFilters).forEach(([filterKey, filterValue]) => {
      if (filterValue !== "all") {
        currentData = currentData.filter((row) => {
          const rowValue = getNestedValue(row, filterKey);
          const comparableRowValue =
            rowValue !== null && rowValue !== undefined
              ? String(rowValue).toLowerCase()
              : "";
          const comparableFilterValue = String(filterValue).toLowerCase();

          return comparableRowValue === comparableFilterValue;
        });
      }
    });

    return currentData;
  }, [data, searchValue, activeFilters, searchKeys]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages, filteredData.length]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowSelect = (row) => {
    setSelectedRows((prev) =>
      prev.includes(row.id)
        ? prev.filter((id) => id !== row.id)
        : [...prev, row.id]
    );
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedRows(paginatedData.map((row) => row.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleAccordionFilterChange = (filterKey, value) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
    setCurrentPage(1);
  };

  return (
    <div className="w-full !p-3 space-y-6">
      <div className="flex justify-between !mb-6 items-center flex-wrap gap-4">
        <Input
          placeholder="Search..."
          className="w-full md:!ms-3 sm:!ms-0 !ps-3 sm:w-1/3 max-w-sm border-bg-primary focus:border-bg-primary focus:ring-bg-primary rounded-[10px]"
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setCurrentPage(1);
          }}
        />
        <div className="flex items-center gap-3 flex-wrap">
          {showFilter && filterOptions.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              {filterOptions.map((group) => (
                <div key={group.key} className="w-[150px]">
                  <Select
                    value={activeFilters[group.key]}
                    onValueChange={(val) =>
                      handleAccordionFilterChange(group.key, val)
                    }
                  >
                    <SelectTrigger className="text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]">
                      <SelectValue placeholder={group.label} defaultValue="all">
                        {activeFilters[group.key] === "all"
                          ? group.label
                          : group.options.find(
                              (opt) => opt.value === activeFilters[group.key]
                            )?.label || group.label}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                      {group.options.map((option) => (
                        <SelectItem
                          key={option.value}
                          className="text-bg-primary"
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
          {showAddButton && (
            <Button
              onClick={() => {
                if (onAddClick) {
                  onAddClick();
                } else if (onAdd) {
                  onAdd();
                } else if (addRoute) {
                  console.log(
                    "Navigating via addRoute:",
                    addRoute,
                    "with type:",
                    defaultAddSubscriberType
                  );
                  navigate(addRoute, {
                    state: { initialType: defaultAddSubscriberType },
                  });
                }
              }}
              className="bg-bg-primary cursor-pointer text-white hover:bg-teal-700 rounded-[10px] !p-3"
            >
              <Plus className="w-5 h-5 !mr-2" />
              Add
            </Button>
          )}
          {showDeleteButtonInHeader && (
            <Button
              onClick={() => onDeleteInHeader(selectedRows)}
              className="bg-red-600 cursor-pointer text-white hover:bg-red-700 rounded-[10px] !p-3"
              disabled={selectedRows.length === 0}
            >
              <Trash className="w-5 h-5 !mr-2" />
              Delete Selected
            </Button>
          )}
        </div>
      </div>
      <div className="max-h-[calc(100vh-300px)]">
        <Table className="!min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="text-bg-primary font-semibold w-12">
                #
              </TableHead>
              {showRowSelection && (
                <TableHead className="text-bg-primary font-semibold w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedRows.length === paginatedData.length &&
                      paginatedData.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-bg-primary border-gray-300 rounded focus:ring-bg-primary"
                  />
                </TableHead>
              )}
              {columns.map((col, index) => (
                <TableHead
                  key={index}
                  className="text-bg-primary font-semibold"
                >
                  {col.label}
                </TableHead>
              ))}
              {(showEditButton || showDeleteButton || showActions) && (
                <TableHead className="text-bg-primary font-semibold">
                  Action
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <TableRow key={row.id || index}>
                  <TableCell className="!px-2 !py-1 text-sm">
                    {startIndex + index + 1}
                  </TableCell>
                  {showRowSelection && (
                    <TableCell className="!px-2 !py-1">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleRowSelect(row);
                        }}
                        className="w-4 h-4 text-bg-primary border-gray-300 rounded focus:ring-bg-primary"
                      />
                    </TableCell>
                  )}
                  {columns.map((col, idx) => (
                    <TableCell
                      key={idx}
                      className={clsx(
                        "!px-2 !py-1 text-sm whitespace-normal break-words",
                        col.key === "img" &&
                          "h-full min-h-[60px] flex justify-center items-center"
                      )}
                    >
                      {col.key === "status" ? (
                        statusComponentType === "switch" ? (
                          <div className="flex justify-center items-center gap-2">
                            <Switch
                              checked={
                                getNestedValue(row, col.key) === true ||
                                String(
                                  getNestedValue(row, col.key)
                                ).toLowerCase() === "active"
                              }
                              onCheckedChange={(checked) =>
                                onToggleStatus?.(
                                  row,
                                  checked ? "approve" : "reject"
                                )
                              }
                              className={clsx(
                                "relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none",
                                getNestedValue(row, col.key) === true ||
                                  String(
                                    getNestedValue(row, col.key)
                                  ).toLowerCase() === "active"
                                  ? "bg-bg-primary"
                                  : "bg-gray-300"
                              )}
                            >
                              <span
                                className={clsx(
                                  "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200",
                                  getNestedValue(row, col.key) === true ||
                                    String(
                                      getNestedValue(row, col.key)
                                    ).toLowerCase() === "active"
                                    ? "translate-x-5"
                                    : "translate-x-1"
                                )}
                              />
                            </Switch>
                          </div>
                        ) : (
                          <Select
                            value={getNestedValue(row, col.key) || undefined}
                            onValueChange={(value) =>
                              onToggleStatus?.(row, value)
                            }
                          >
                            <SelectTrigger className="!my-2 text-bg-primary !p-4 !m-auto">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white !p-2">
                              {filterOptions
                                .find((opt) => opt.key === "status")
                                ?.options.filter((opt) => opt.value !== "all")
                                .map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )
                      ) : col.key === "img" ? (
                        <img
                          src={row[col.key]}
                          alt="preview"
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : col.key === "map" ? (
                        <a
                          href={`https://maps.google.com/?q=${row[col.key]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline"
                        >
                          View Map
                        </a>
                      ) : col.render ? (
                        col.render(row)
                      ) : (
                        row[col.key]
                      )}
                    </TableCell>
                  ))}
                  {(showEditButton || showDeleteButton || showActions) && (
                    <TableCell className="!py-3">
                      <div className="flex justify-center items-center gap-2">
                        {showEditButton && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onEdit?.(row);
                            }}
                          >
                            <Edit className="w-4 h-4 text-bg-primary" />
                          </Button>
                        )}
                        {showDeleteButton && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete?.(row)}
                          >
                            <Trash className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                        {showRowSelection && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowSelect(row);
                            }}
                          >
                            <CheckSquare
                              className={clsx(
                                "w-4 h-4",
                                selectedRows.includes(row.id)
                                  ? "text-bg-primary"
                                  : "text-gray-400"
                              )}
                            />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (showActions || showEditButton || showDeleteButton
                      ? 1
                      : 0) +
                    (showRowSelection ? 1 : 0) +
                    1
                  }
                  className="h-24 text-center"
                >
                  No data to display.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              />
            </PaginationItem>
            {[...Array(totalPages).keys()].map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => handlePageChange(page + 1)}
                  isActive={currentPage === page + 1}
                >
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
